// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAudioSource,
    IConnection,
    MessageType
} from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    ConversationTranscriber,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
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
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

// tslint:disable-next-line:max-classes-per-file
export class TranscriptionServiceRecognizer extends ServiceRecognizerBase {

    private privConversationTranscriber: ConversationTranscriber;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        transcriber: ConversationTranscriber) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, transcriber);
        this.privConversationTranscriber = transcriber;
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
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                this.privRequestSession.onHypothesis(offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);

                if (!!this.privConversationTranscriber.recognizing) {
                    try {
                        this.privConversationTranscriber.recognizing(this.privConversationTranscriber, ev);
                        /* tslint:disable:no-empty */
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

                    await this.cancelRecognitionLocal(
                        cancelReason,
                        EnumTranslation.implTranslateCancelErrorCode(simple.RecognitionStatus),
                        undefined);

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
                                undefined,
                                connectionMessage.textBody,
                                resultProps);
                        } else {
                            const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(connectionMessage.textBody);

                            result = new SpeechRecognitionResult(
                                this.privRequestSession.requestId,
                                resultReason,
                                detailed.RecognitionStatus === RecognitionStatus.Success ? detailed.NBest[0].Display : undefined,
                                detailed.Duration,
                                detailed.Offset + this.privRequestSession.currentTurnAudioOffset,
                                detailed.Language,
                                detailed.LanguageDetectionConfidence,
                                undefined,
                                connectionMessage.textBody,
                                resultProps);
                        }

                        const event: SpeechRecognitionEventArgs = new SpeechRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                        if (!!this.privConversationTranscriber.recognized) {
                            try {
                                this.privConversationTranscriber.recognized(this.privConversationTranscriber, event);
                                /* tslint:disable:no-empty */
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
                                this.privErrorCallback(e);
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

        if (!!this.privConversationTranscriber.canceled) {
            const cancelEvent: SpeechRecognitionCanceledEventArgs = new SpeechRecognitionCanceledEventArgs(
                cancellationReason,
                error,
                errorCode,
                undefined,
                sessionId);
            try {
                this.privConversationTranscriber.canceled(this.privConversationTranscriber, cancelEvent);
                /* tslint:disable:no-empty */
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
                error,
                undefined, // Json
                properties);
            try {
                this.privSuccessCallback(result);
                this.privSuccessCallback = undefined;
                /* tslint:disable:no-empty */
            } catch { }
        }
    }

    // Encapsulated for derived service recognizers that need to send additional JSON
    protected async sendPrePayloadJSON(connection: IConnection): Promise<void> {
        await this.sendSpeechContext(connection);
        await this.sendSpeechEvent(connection);
        await this.sendWaveHeader(connection);
        return;
    }

    private sendSpeechEvent = (connection: IConnection): Promise<void> => {
        const speechEventJson = this.speechEvent.toJSON();

        if (speechEventJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.event",
                this.privRequestSession.requestId,
                "application/json",
                speechEventJson));
        }
        return;
    }

    private get speechEvent(): any {
        return this.privConversationTranscriber.conversationSpeechEvent;
    }
}
