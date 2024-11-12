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
    ConversationTranscriptionCanceledEventArgs,
    ConversationTranscriptionEventArgs,
    ConversationTranscriptionResult,
    ConversationTranscriber,
} from "../sdk/Exports.js";
import {
    CancellationErrorCodePropertyName,
    EnumTranslation,
    OutputFormatPropertyName,
    RecognitionStatus,
    ServiceRecognizerBase,
    SpeechPhrase,
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";
import { IConnectionFactory } from "./IConnectionFactory.js";
import { RecognizerConfig } from "./RecognizerConfig.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";
import { PhraseDetection, SpeakerDiarization } from "./ServiceRecognizerBase.js";

// eslint-disable-next-line max-classes-per-file
export class ConversationTranscriptionServiceRecognizer extends ServiceRecognizerBase {

    private privConversationTranscriber: ConversationTranscriber;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        conversationTranscriber: ConversationTranscriber) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, conversationTranscriber);
        this.privConversationTranscriber = conversationTranscriber;
        this.setSpeakerDiarizationJson();
    }

    protected setSpeakerDiarizationJson(): void {
        if (this.privEnableSpeakerId) {
            const phraseDetection = this.privSpeechContext.getSection("phraseDetection") as PhraseDetection;
            phraseDetection.mode = "Conversation";
            const speakerDiarization: SpeakerDiarization = {};
            speakerDiarization.mode = "Anonymous";
            speakerDiarization.audioSessionId = this.privDiarizationSessionId;
            speakerDiarization.audioOffsetMs = 0;
            speakerDiarization.diarizeIntermediates = this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceResponse_DiarizeIntermediateResults, "false") === "true";
            phraseDetection.speakerDiarization = speakerDiarization;
            this.privSpeechContext.setSection("phraseDetection", phraseDetection);
        }
    }

    protected async processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let result: ConversationTranscriptionResult;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        let processed: boolean = false;

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
            case "speech.fragment":
                const hypothesis: SpeechPhrase = SpeechPhrase.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);

                result = new ConversationTranscriptionResult(
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    hypothesis.Offset,
                    hypothesis.Language,
                    hypothesis.LanguageDetectionConfidence,
                    hypothesis.SpeakerId,
                    undefined,
                    hypothesis.asJson(),
                    resultProps);

                this.privRequestSession.onHypothesis(hypothesis.Offset);

                const ev = new ConversationTranscriptionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);

                if (!!this.privConversationTranscriber.transcribing) {
                    try {
                        this.privConversationTranscriber.transcribing(this.privConversationTranscriber, ev);
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                processed = true;
                break;
            case "speech.phrase":
                processed = true;
                const simple: SpeechPhrase = SpeechPhrase.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);
                const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);

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

                    result = new ConversationTranscriptionResult(
                        this.privRequestSession.requestId,
                        resultReason,
                        simple.Text,
                        simple.Duration,
                        simple.Offset,
                        simple.Language,
                        simple.LanguageDetectionConfidence,
                        simple.SpeakerId,
                        undefined,
                        simple.asJson(),
                        resultProps);


                    const event: ConversationTranscriptionEventArgs = new ConversationTranscriptionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                    if (!!this.privConversationTranscriber.transcribed) {
                        try {
                            this.privConversationTranscriber.transcribed(this.privConversationTranscriber, event);
                            /* eslint-disable no-empty */
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }
                }
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

        if (!!this.privConversationTranscriber.canceled) {
            const cancelEvent: ConversationTranscriptionCanceledEventArgs = new ConversationTranscriptionCanceledEventArgs(
                cancellationReason,
                error,
                errorCode,
                undefined,
                sessionId);
            try {
                this.privConversationTranscriber.canceled(this.privConversationTranscriber, cancelEvent);
                /* eslint-disable no-empty */
            } catch { }
        }
    }
}
