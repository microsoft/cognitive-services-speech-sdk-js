// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import {
    ConnectionEvent,
    IAudioSource,
    MessageType,
    TranslationStatus,
} from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    Recognizer,
    ResultReason,
    SpeechRecognitionResult,
    TranslationRecognitionCanceledEventArgs,
    TranslationRecognitionEventArgs,
    TranslationRecognitionResult,
    TranslationRecognizer,
    Translations,
    TranslationSynthesisEventArgs,
    TranslationSynthesisResult,
} from "../sdk/Exports";
import {
    CancellationErrorCodePropertyName,
    DetailedSpeechPhrase,
    EnumTranslation,
    OutputFormatPropertyName,
    RecognitionStatus,
    SimpleSpeechPhrase,
    SpeechHypothesis,
    ServiceRecognizerBase,
    SynthesisStatus,
    TranslationHypothesis,
    TranslationPhrase,
    TranslationSynthesisEnd,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { ITranslationPhrase } from "./ServiceMessages/TranslationPhrase";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class ConversationServiceRecognizer extends ServiceRecognizerBase {

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: Recognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.handleSpeechPhraseMessage = async (textBody: string): Promise<void> => this.handleSpeechPhrase(textBody);
        this.handleSpeechHypothesisMessage = (textBody: string): void => this.handleSpeechHypothesis(textBody);
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {
        void connectionMessage;
        return;
    }

    protected handleRecognizedCallback(result: SpeechRecognitionResult, sessionId: string): void {
        void result;
        void sessionId;
        return;
    }

    protected handleRecognizingCallback(result: SpeechRecognitionResult, duration: number, sessionId: string): void {
        if (this.privRecognizer instanceof TranslationRecognizer) {
            try {
                const ev = new TranslationRecognitionEventArgs(TranslationRecognitionResult.fromSpeechRecognitionResult(result), duration, sessionId);
                this.privRecognizer.recognizing(this.privRecognizer, ev);
                /* eslint-disable no-empty */
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }

    protected async processSpeechMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {
        let processed: boolean = false;
        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
            case "speech.fragment":
                if (!!this.handleSpeechHypothesisMessage) {
                    this.handleSpeechHypothesisMessage(connectionMessage.textBody);
                }
                processed = true;
                break;
            case "speech.phrase":
                if (!!this.handleSpeechPhraseMessage) {
                    await this.handleSpeechPhraseMessage(connectionMessage.textBody);
                }
                processed = true;
                break;
            default:
                break;
        }
        return processed;
    }

    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {
            // Implementing to allow inheritance
            void sessionId;
            void requestId;
            void cancellationReason;
            void errorCode;
            void error;
        }

    protected async handleSpeechPhrase(textBody: string): Promise<void> {

        const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(textBody);
        const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);
        let result: SpeechRecognitionResult;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, textBody);
        const simpleOffset = simple.Offset + this.privRequestSession.currentTurnAudioOffset;

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
                        simpleOffset,
                        simple.Language,
                        simple.LanguageDetectionConfidence,
                        simple.SpeakerId,
                        undefined,
                        textBody,
                        resultProps);

                    if (this.privRecognizer instanceof TranslationRecognizer) {
                        try {
                            const ev = new TranslationRecognitionEventArgs(TranslationRecognitionResult.fromSpeechRecognitionResult(result), simpleOffset, this.privRequestSession.sessionId);
                            this.privRecognizer.recognized(this.privRecognizer, ev);
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                        return;
                    }
                } else {
                    const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(textBody);
                    const totalOffset: number = detailed.Offset + this.privRequestSession.currentTurnAudioOffset;
                    const offsetCorrectedJson: string = detailed.getJsonWithCorrectedOffsets(totalOffset);

                    result = new SpeechRecognitionResult(
                        this.privRequestSession.requestId,
                        resultReason,
                        detailed.Text,
                        detailed.Duration,
                        totalOffset,
                        detailed.Language,
                        detailed.LanguageDetectionConfidence,
                        detailed.SpeakerId,
                        undefined,
                        offsetCorrectedJson,
                        resultProps);
                }

                this.handleRecognizedCallback(result, this.privRequestSession.sessionId);
            }
        }
    }

    protected handleSpeechHypothesis(textBody: string): void {
        const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(textBody);
        const offset: number = hypothesis.Offset + this.privRequestSession.currentTurnAudioOffset;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, textBody);

        const result = new SpeechRecognitionResult(
            this.privRequestSession.requestId,
            ResultReason.RecognizingSpeech,
            hypothesis.Text,
            hypothesis.Duration,
            offset,
            hypothesis.Language,
            hypothesis.LanguageDetectionConfidence,
            hypothesis.SpeakerId,
            undefined,
            textBody,
            resultProps);

        this.privRequestSession.onHypothesis(offset);
        this.handleRecognizingCallback(result, hypothesis.Duration, this.privRequestSession.sessionId);
    }
}
export class TranslationServiceRecognizer extends ConversationServiceRecognizer {
    private privTranslationRecognizer: TranslationRecognizer;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        translationRecognizer: TranslationRecognizer) {

        super(authentication, connectionFactory, audioSource, recognizerConfig, translationRecognizer);
        this.privTranslationRecognizer = translationRecognizer;
        this.connectionEvents.attach((connectionEvent: ConnectionEvent): void => {
            if (connectionEvent.name === "ConnectionEstablishedEvent") {
                this.privTranslationRecognizer.onConnection();
            } else if (connectionEvent.name === "ConnectionClosedEvent") {
                void this.privTranslationRecognizer.onDisconnection();
            }
        });

    }

    protected async processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        const resultProps: PropertyCollection = new PropertyCollection();
        let processed: boolean = await this.processSpeechMessages(connectionMessage);
        if (processed) {
            return true;
        }

        const handleTranslationPhrase = async (translatedPhrase: TranslationPhrase): Promise<void> => {
            this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + translatedPhrase.Offset + translatedPhrase.Duration);

            if (translatedPhrase.RecognitionStatus === RecognitionStatus.Success) {

                // OK, the recognition was successful. How'd the translation do?
                const result: TranslationRecognitionEventArgs = this.fireEventForResult(translatedPhrase, resultProps);
                if (!!this.privTranslationRecognizer.recognized) {
                    try {
                        this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, result);
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }

                // report result to promise.
                if (!!this.privSuccessCallback) {
                    try {
                        this.privSuccessCallback(result.result);
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
            } else {
                const reason: ResultReason = EnumTranslation.implTranslateRecognitionResult(translatedPhrase.RecognitionStatus);

                const result = new TranslationRecognitionResult(
                    undefined,
                    this.privRequestSession.requestId,
                    reason,
                    translatedPhrase.Text,
                    translatedPhrase.Duration,
                    this.privRequestSession.currentTurnAudioOffset + translatedPhrase.Offset,
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                if (reason === ResultReason.Canceled) {
                    const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(translatedPhrase.RecognitionStatus);
                    const cancellationErrorCode: CancellationErrorCode = EnumTranslation.implTranslateCancelErrorCode(translatedPhrase.RecognitionStatus);

                    await this.cancelRecognitionLocal(
                        cancelReason,
                        cancellationErrorCode,
                        EnumTranslation.implTranslateErrorDetails(cancellationErrorCode));

                } else {
                    if (!(this.privRequestSession.isSpeechEnded && reason === ResultReason.NoMatch && translatedPhrase.RecognitionStatus !== RecognitionStatus.InitialSilenceTimeout)) {
                        const ev = new TranslationRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                        if (!!this.privTranslationRecognizer.recognized) {
                            try {
                                this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, ev);
                                /* eslint-disable no-empty */
                            } catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                    }

                    // report result to promise.
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
            }

        };

        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        switch (connectionMessage.path.toLowerCase()) {
            case "translation.hypothesis":

                const result: TranslationRecognitionEventArgs = this.fireEventForResult(TranslationHypothesis.fromJSON(connectionMessage.textBody), resultProps);
                this.privRequestSession.onHypothesis(this.privRequestSession.currentTurnAudioOffset + result.offset);

                if (!!this.privTranslationRecognizer.recognizing) {
                    try {
                        this.privTranslationRecognizer.recognizing(this.privTranslationRecognizer, result);
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                processed = true;
                break;

            case "translation.response":
                const phrase: { SpeechPhrase: ITranslationPhrase } = JSON.parse(connectionMessage.textBody) as { SpeechPhrase: ITranslationPhrase };
                if (!!phrase.SpeechPhrase) {
                    await handleTranslationPhrase(TranslationPhrase.fromTranslationResponse(phrase));
                }
                break;
            case "translation.phrase":
                await handleTranslationPhrase(TranslationPhrase.fromJSON(connectionMessage.textBody));
                break;

            case "translation.synthesis":
                this.sendSynthesisAudio(connectionMessage.binaryBody, this.privRequestSession.sessionId);
                processed = true;
                break;

            case "translation.synthesis.end":
                const synthEnd: TranslationSynthesisEnd = TranslationSynthesisEnd.fromJSON(connectionMessage.textBody);

                switch (synthEnd.SynthesisStatus) {
                    case SynthesisStatus.Error:
                        if (!!this.privTranslationRecognizer.synthesizing) {
                            const result = new TranslationSynthesisResult(ResultReason.Canceled, undefined);
                            const retEvent: TranslationSynthesisEventArgs = new TranslationSynthesisEventArgs(result, this.privRequestSession.sessionId);

                            try {
                                this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
                                /* eslint-disable no-empty */
                            } catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }

                        if (!!this.privTranslationRecognizer.canceled) {
                            // And raise a canceled event to send the rich(er) error message back.
                            const canceledResult: TranslationRecognitionCanceledEventArgs = new TranslationRecognitionCanceledEventArgs(
                                this.privRequestSession.sessionId,
                                CancellationReason.Error,
                                synthEnd.FailureReason,
                                CancellationErrorCode.ServiceError,
                                null);

                            try {
                                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, canceledResult);
                                /* eslint-disable no-empty */
                            } catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                        break;
                    case SynthesisStatus.Success:
                        this.sendSynthesisAudio(undefined, this.privRequestSession.sessionId);
                        break;
                    default:
                        break;
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

        if (!!this.privTranslationRecognizer.canceled) {

            const cancelEvent: TranslationRecognitionCanceledEventArgs = new TranslationRecognitionCanceledEventArgs(
                sessionId,
                cancellationReason,
                error,
                errorCode,
                undefined);

            try {
                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, cancelEvent);
                /* eslint-disable no-empty */
            } catch { }
        }

        if (!!this.privSuccessCallback) {
            const result: TranslationRecognitionResult = new TranslationRecognitionResult(
                undefined, // Translations
                requestId,
                ResultReason.Canceled,
                undefined, // Text
                undefined, // Druation
                undefined, // Offset
                error,
                undefined, // Json
                properties);
            try {
                this.privSuccessCallback(result);
                /* eslint-disable no-empty */
                this.privSuccessCallback = undefined;
            } catch { }
        }
    }

    private fireEventForResult(serviceResult: TranslationHypothesis | TranslationPhrase, properties: PropertyCollection): TranslationRecognitionEventArgs {
        let translations: Translations;

        if (undefined !== serviceResult.Translation.Translations) {
            translations = new Translations();
            for (const translation of serviceResult.Translation.Translations) {
                translations.set(translation.Language, translation.Text || translation.DisplayText);
            }
        }

        let resultReason: ResultReason;
        if (serviceResult instanceof TranslationPhrase) {
            if (!!serviceResult.Translation && serviceResult.Translation.TranslationStatus === TranslationStatus.Success) {
                resultReason = ResultReason.TranslatedSpeech;
            } else {
                resultReason = ResultReason.RecognizedSpeech;
            }
        } else {
            resultReason = ResultReason.TranslatingSpeech;
        }

        const offset: number = serviceResult.Offset + this.privRequestSession.currentTurnAudioOffset;

        const result = new TranslationRecognitionResult(
            translations,
            this.privRequestSession.requestId,
            resultReason,
            serviceResult.Text,
            serviceResult.Duration,
            offset,
            serviceResult.Translation.FailureReason,
            JSON.stringify(serviceResult),
            properties);

        const ev = new TranslationRecognitionEventArgs(result, offset, this.privRequestSession.sessionId);
        return ev;
    }

    private sendSynthesisAudio(audio: ArrayBuffer, sessionId: string): void {
        const reason = (undefined === audio) ? ResultReason.SynthesizingAudioCompleted : ResultReason.SynthesizingAudio;
        const result = new TranslationSynthesisResult(reason, audio);
        const retEvent: TranslationSynthesisEventArgs = new TranslationSynthesisEventArgs(result, sessionId);

        if (!!this.privTranslationRecognizer.synthesizing) {
            try {
                this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
                /* eslint-disable no-empty */
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }

    }
}
