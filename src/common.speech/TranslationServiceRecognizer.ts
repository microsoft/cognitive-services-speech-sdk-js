// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAudioSource,
    MessageType,
    TranslationStatus,
} from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    PropertyId,
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
    EnumTranslation,
    RecognitionStatus,
    ServiceRecognizerBase,
    SynthesisStatus,
    TranslationHypothesis,
    TranslationPhrase,
    TranslationSynthesisEnd,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

// tslint:disable-next-line:max-classes-per-file
export class TranslationServiceRecognizer extends ServiceRecognizerBase {
    private privTranslationRecognizer: TranslationRecognizer;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        translationRecognizer: TranslationRecognizer) {

        super(authentication, connectionFactory, audioSource, recognizerConfig, translationRecognizer);
        this.privTranslationRecognizer = translationRecognizer;

    }

    protected processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: TranslationRecognitionResult) => void,
        errorCallBack?: (e: string) => void): void {

        const resultProps: PropertyCollection = new PropertyCollection();
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
                        /* tslint:disable:no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }

                break;
            case "translation.phrase":
                const translatedPhrase: TranslationPhrase = TranslationPhrase.fromJSON(connectionMessage.textBody);

                this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + translatedPhrase.Offset + translatedPhrase.Duration);

                if (translatedPhrase.RecognitionStatus === RecognitionStatus.Success) {

                    // OK, the recognition was successful. How'd the translation do?
                    const result: TranslationRecognitionEventArgs = this.fireEventForResult(translatedPhrase, resultProps);
                    if (!!this.privTranslationRecognizer.recognized) {
                        try {
                            this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, result);
                            /* tslint:disable:no-empty */
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }

                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(result.result);
                        } catch (e) {
                            if (!!errorCallBack) {
                                errorCallBack(e);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        successCallback = undefined;
                        errorCallBack = undefined;
                    }

                    break;
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

                        this.cancelRecognitionLocal(
                            cancelReason,
                            EnumTranslation.implTranslateCancelErrorCode(translatedPhrase.RecognitionStatus),
                            undefined,
                            successCallback);
                    } else {
                        if (!(this.privRequestSession.isSpeechEnded && reason === ResultReason.NoMatch && translatedPhrase.RecognitionStatus !== RecognitionStatus.InitialSilenceTimeout)) {
                            const ev = new TranslationRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                            if (!!this.privTranslationRecognizer.recognized) {
                                try {
                                    this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, ev);
                                    /* tslint:disable:no-empty */
                                } catch (error) {
                                    // Not going to let errors in the event handler
                                    // trip things up.
                                }
                            }
                        }

                        // report result to promise.
                        if (!!successCallback) {
                            try {
                                successCallback(result);
                            } catch (e) {
                                if (!!errorCallBack) {
                                    errorCallBack(e);
                                }
                            }
                            // Only invoke the call back once.
                            // and if it's successful don't invoke the
                            // error after that.
                            successCallback = undefined;
                            errorCallBack = undefined;
                        }
                    }
                }
                break;

            case "translation.synthesis":
                this.sendSynthesisAudio(connectionMessage.binaryBody, this.privRequestSession.sessionId);
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
                                /* tslint:disable:no-empty */
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
                                /* tslint:disable:no-empty */
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
                break;
            default:
                break;
        }
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string,
        cancelRecoCallback: (e: SpeechRecognitionResult) => void): void {

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
                /* tslint:disable:no-empty */
            } catch { }
        }

        if (!!cancelRecoCallback) {
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
                cancelRecoCallback(result);
                /* tslint:disable:no-empty */
            } catch { }
        }
    }

    private fireEventForResult(serviceResult: TranslationHypothesis | TranslationPhrase, properties: PropertyCollection): TranslationRecognitionEventArgs {
        let translations: Translations;

        if (undefined !== serviceResult.Translation.Translations) {
            translations = new Translations();
            for (const translation of serviceResult.Translation.Translations) {
                translations.set(translation.Language, translation.Text);
            }
        }

        let resultReason: ResultReason;
        if (serviceResult instanceof TranslationPhrase) {
            if (serviceResult.Translation.TranslationStatus === TranslationStatus.Success) {
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
                /* tslint:disable:no-empty */
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }

    }
}
