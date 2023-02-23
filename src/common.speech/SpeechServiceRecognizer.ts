// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAudioSource } from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechRecognizer,
} from "../sdk/Exports";
import {
    CancellationErrorCodePropertyName,
    DetailedSpeechPhrase,
    EnumTranslation,
    OutputFormatPropertyName,
    RecognitionStatus,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechHypothesis,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognitionMode, RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

interface CustomModel {
    language: string;
    endpoint: string;
}

interface PhraseDetection {
    customModels?: CustomModel[];
    onInterim?: { action: string };
    onSuccess?: { action: string };
    mode?: string;
    INTERACTIVE?: Segmentation;
    CONVERSATION?: Segmentation;
    DICTATION?: Segmentation;
}

interface Segmentation {
    segmentation: {
        mode: "Custom";
        segmentationSilenceTimeoutMs: number;
    };
}

// eslint-disable-next-line max-classes-per-file
export class SpeechServiceRecognizer extends ServiceRecognizerBase {

    private privSpeechRecognizer: SpeechRecognizer;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        speechRecognizer: SpeechRecognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, speechRecognizer);
        this.privSpeechRecognizer = speechRecognizer;

        const phraseDetection: PhraseDetection = {};

        if (recognizerConfig.autoDetectSourceLanguages !== undefined) {
            const sourceLanguages: string[] = recognizerConfig.autoDetectSourceLanguages.split(",");

            let speechContextLidMode;
            if (recognizerConfig.languageIdMode === "Continuous") {
                speechContextLidMode = "DetectContinuous";
            } else {// recognizerConfig.languageIdMode === "AtStart"
                speechContextLidMode = "DetectAtAudioStart";
            }

            this.privSpeechContext.setSection("languageId", {
                Priority: "PrioritizeLatency",
                languages: sourceLanguages,
                mode: speechContextLidMode,
                onSuccess: { action: "Recognize" },
                onUnknown: { action: "None" }
            });
            this.privSpeechContext.setSection("phraseOutput", {
                interimResults: {
                    resultType: "Auto"
                },
                phraseResults: {
                    resultType: "Always"
                }
            });
            const customModels: CustomModel[] = recognizerConfig.sourceLanguageModels;
            if (customModels !== undefined) {
                phraseDetection.customModels = customModels;
                phraseDetection.onInterim = { action: "None" };
                phraseDetection.onSuccess = { action: "None" };
            }
        }

        const isEmpty = (obj: object): boolean => {
            // eslint-disable-next-line guard-for-in, brace-style
            for (const x in obj) { return false; }
            return true;
        };

        if (!isEmpty(phraseDetection)) {
            this.privSpeechContext.setSection("phraseDetection", phraseDetection);
        }
    }

    protected setSpeechSegmentationTimeout(): void{
        const speechSegmentationTimeout: string = this.privRecognizerConfig.parameters.getProperty(PropertyId.Speech_SegmentationSilenceTimeoutMs, undefined);
        if (speechSegmentationTimeout !== undefined) {
            const mode = this.recognitionMode === RecognitionMode.Conversation ? "CONVERSATION" :
                this.recognitionMode === RecognitionMode.Dictation ? "DICTATION" : "INTERACTIVE";
            const segmentationSilenceTimeoutMs: number = parseInt(speechSegmentationTimeout, 10);
            const phraseDetection = this.privSpeechContext.getSection("phraseDetection") as PhraseDetection;
            phraseDetection.mode = mode;
            phraseDetection[mode] = {
                segmentation: {
                    mode: "Custom",
                    segmentationSilenceTimeoutMs
                }
            };
            this.privSpeechContext.setSection("phraseDetection", phraseDetection);
        }
    }

    protected async processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let result: SpeechRecognitionResult;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        let processed: boolean = false;

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
            case "speech.fragment":
                const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(connectionMessage.textBody);
                const offset: number = hypothesis.Offset + this.privRequestSession.currentTurnAudioOffset;

                result = new SpeechRecognitionResult(
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    offset,
                    hypothesis.Language,
                    hypothesis.LanguageDetectionConfidence,
                    undefined, // Speaker Id
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                this.privRequestSession.onHypothesis(offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);

                if (!!this.privSpeechRecognizer.recognizing) {
                    try {
                        this.privSpeechRecognizer.recognizing(this.privSpeechRecognizer, ev);
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                processed = true;
                break;
            case "speech.phrase":
                const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);
                const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);

                this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + simple.Offset + simple.Duration);

                if (ResultReason.Canceled === resultReason) {
                    const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);
                    const cancellationErrorCode: CancellationErrorCode = EnumTranslation.implTranslateCancelErrorCode(simple.RecognitionStatus);

                    await this.cancelRecognitionLocal(
                        cancelReason,
                        cancellationErrorCode,
                        EnumTranslation.implTranslateErrorDetails(cancellationErrorCode));

                } else {
                    if (!(this.privRequestSession.isSpeechEnded && resultReason === ResultReason.NoMatch && simple.RecognitionStatus !== RecognitionStatus.InitialSilenceTimeout)) {
                        if (this.privRecognizerConfig.parameters.getProperty(OutputFormatPropertyName) === OutputFormat[OutputFormat.Simple]) {
                            result = new SpeechRecognitionResult(
                                this.privRequestSession.requestId,
                                resultReason,
                                simple.DisplayText,
                                simple.Duration,
                                simple.Offset + this.privRequestSession.currentTurnAudioOffset,
                                simple.Language,
                                simple.LanguageDetectionConfidence,
                                undefined, // Speaker Id
                                undefined,
                                connectionMessage.textBody,
                                resultProps);
                        } else {
                            const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(connectionMessage.textBody);
                            const totalOffset: number = detailed.Offset + this.privRequestSession.currentTurnAudioOffset;
                            const offsetCorrectedJson: string = detailed.getJsonWithCorrectedOffsets(totalOffset);

                            result = new SpeechRecognitionResult(
                                this.privRequestSession.requestId,
                                resultReason,
                                detailed.RecognitionStatus === RecognitionStatus.Success ? detailed.NBest[0].Display : undefined,
                                detailed.Duration,
                                totalOffset,
                                detailed.Language,
                                detailed.LanguageDetectionConfidence,
                                undefined, // Speaker Id
                                undefined,
                                offsetCorrectedJson,
                                resultProps);
                        }

                        const event: SpeechRecognitionEventArgs = new SpeechRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                        if (!!this.privSpeechRecognizer.recognized) {
                            try {
                                this.privSpeechRecognizer.recognized(this.privSpeechRecognizer, event);
                                /* eslint-disable no-empty */
                            } catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                    }

                    if (!!this.privSuccessCallback) {
                        try {
                            this.privSuccessCallback(result);
                        } catch (e) {
                            if (!!this.privErrorCallback) {
                                this.privErrorCallback(e as string);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        this.privSuccessCallback = undefined;
                        this.privErrorCallback = undefined;
                    }
                }
                processed = true;
                break;
            default:
                break;
        }
        return processed;
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {

        const properties: PropertyCollection = new PropertyCollection();
        properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

        if (!!this.privSpeechRecognizer.canceled) {
            const cancelEvent: SpeechRecognitionCanceledEventArgs = new SpeechRecognitionCanceledEventArgs(
                cancellationReason,
                error,
                errorCode,
                undefined,
                sessionId);
            try {
                this.privSpeechRecognizer.canceled(this.privSpeechRecognizer, cancelEvent);
                /* eslint-disable no-empty */
            } catch { }
        }

        if (!!this.privSuccessCallback) {
            const result: SpeechRecognitionResult = new SpeechRecognitionResult(
                requestId,
                ResultReason.Canceled,
                undefined, // Text
                undefined, // Duration
                undefined, // Offset
                undefined, // Language
                undefined, // Language Detection Confidence
                undefined, // Speaker Id
                error,
                undefined, // Json
                properties);
            try {
                this.privSuccessCallback(result);
                this.privSuccessCallback = undefined;
                /* eslint-disable no-empty */
            } catch { }
        }
    }
}
