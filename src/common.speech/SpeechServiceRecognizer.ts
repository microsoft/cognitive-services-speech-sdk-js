// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAudioSource } from "../common/Exports.js";
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
} from "../sdk/Exports.js";
import {
    CancellationErrorCodePropertyName,
    DetailedSpeechPhrase,
    EnumTranslation,
    OutputFormatPropertyName,
    RecognitionStatus,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechHypothesis,
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";
import { IConnectionFactory } from "./IConnectionFactory.js";
import { RecognizerConfig } from "./RecognizerConfig.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

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

    }

    protected async processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let result: SpeechRecognitionResult;

        const resultProps: PropertyCollection = new PropertyCollection();

        let processed: boolean = false;

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
            case "speech.fragment":
                const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);
                resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, hypothesis.asJson());

                result = new SpeechRecognitionResult(
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    hypothesis.Offset,
                    hypothesis.Language,
                    hypothesis.LanguageDetectionConfidence,
                    undefined, // Speaker Id
                    undefined,
                    hypothesis.asJson(),
                    resultProps);

                this.privRequestSession.onHypothesis(hypothesis.Offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Offset, this.privRequestSession.sessionId);

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
                const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);
                resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, simple.asJson());

                const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus, this.privExpectContentAssessmentResponse);

                this.privRequestSession.onPhraseRecognized(simple.Offset + simple.Duration);

                if (ResultReason.Canceled === resultReason) {
                    const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);
                    const cancellationErrorCode: CancellationErrorCode = EnumTranslation.implTranslateCancelErrorCode(simple.RecognitionStatus);

                    await this.cancelRecognitionLocal(
                        cancelReason,
                        cancellationErrorCode,
                        EnumTranslation.implTranslateErrorDetails(cancellationErrorCode));

                } else {
                    // Like the native SDK's, don't event / return an EndOfDictation message.
                    if (simple.RecognitionStatus === RecognitionStatus.EndOfDictation) {
                        break;
                    }

                    if (this.privRecognizerConfig.parameters.getProperty(OutputFormatPropertyName) === OutputFormat[OutputFormat.Simple]) {
                        result = new SpeechRecognitionResult(
                            this.privRequestSession.requestId,
                            resultReason,
                            simple.DisplayText,
                            simple.Duration,
                            simple.Offset,
                            simple.Language,
                            simple.LanguageDetectionConfidence,
                            undefined, // Speaker Id
                            undefined,
                            simple.asJson(),
                            resultProps);
                    } else {
                        const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);
                        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, detailed.asJson());

                        result = new SpeechRecognitionResult(
                            this.privRequestSession.requestId,
                            resultReason,
                            detailed.RecognitionStatus === RecognitionStatus.Success ? detailed.NBest[0].Display : "",
                            detailed.Duration,
                            detailed.Offset,
                            detailed.Language,
                            detailed.LanguageDetectionConfidence,
                            undefined, // Speaker Id
                            undefined,
                            detailed.asJson(),
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
