// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionEvent,
    IAudioSource,
    MessageType,
    TranslationStatus,
} from "../common/Exports.js";
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
} from "../sdk/Exports.js";
import {
    CancellationErrorCodePropertyName,
    ConversationServiceRecognizer,
    EnumTranslation,
    ITranslationHypothesis,
    RecognitionStatus,
    SynthesisStatus,
    TranslationHypothesis,
    TranslationPhrase,
    TranslationSynthesisEnd,
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";
import { IConnectionFactory } from "./IConnectionFactory.js";
import { RecognizerConfig } from "./RecognizerConfig.js";
import { ITranslationPhrase } from "./ServiceMessages/TranslationPhrase.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

// eslint-disable-next-line max-classes-per-file
export class TranslationServiceRecognizer extends ConversationServiceRecognizer {
    private privTranslationRecognizer: TranslationRecognizer;
    private privPrimaryLanguageChanged: boolean = false;
    // Last translation text observed per language from translation.hypothesis events.
    // Used to decide, on the Recognized event that follows a primary-language change,
    // whether a real Synthesizing event is expected before we trigger resetTurn.
    private privLastRecognizingTranslations: { [language: string]: string } = {};
    // The primary target language captured at the time of the mutation (i.e., the
    // language the service is still synthesizing in until resetTurn flushes the
    // new context). Compared against the same language's text in the Recognized
    // result to predict whether synthesis audio is on its way.
    private privPrimaryLanguageBeingReplaced: string | undefined;
    // When true, the SDK has decided that a Synthesizing event is expected for
    // the just-Recognized phrase and is deferring resetTurn until that event
    // (or the synthesis end marker) arrives.
    private privAwaitingSynthesisForReset: boolean = false;

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
            }
        });

    }

    public primaryTargetLanguageChanged(removedPrimaryLanguage: string): void {
        this.setTranslationJson();
        // Only capture the language being replaced on the first mutation in a
        // pending window; subsequent calls before resetTurn fires shouldn't
        // overwrite it because the service is still operating against the
        // original primary on the wire.
        if (!this.privPrimaryLanguageChanged) {
            this.privPrimaryLanguageBeingReplaced = removedPrimaryLanguage;
        }
        this.privPrimaryLanguageChanged = true;
    }

    protected async processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        const resultProps: PropertyCollection = new PropertyCollection();
        let processed: boolean = await this.processSpeechMessages(connectionMessage);
        if (processed) {
            return true;
        }

        const handleTranslationPhrase = async (translatedPhrase: TranslationPhrase): Promise<void> => {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, translatedPhrase.asJson());

            const phraseLatencyMs = this.privRequestSession.onPhraseRecognized(translatedPhrase.Offset + translatedPhrase.Duration);
            if (phraseLatencyMs > 0) {
                resultProps.setProperty(PropertyId.SpeechServiceResponse_RecognitionLatencyMs, phraseLatencyMs.toString());
            }

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
                    translatedPhrase.Offset,
                    translatedPhrase.Language,
                    translatedPhrase.Confidence,
                    undefined,
                    translatedPhrase.asJson(),
                    resultProps);

                if (reason === ResultReason.Canceled) {
                    const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(translatedPhrase.RecognitionStatus);
                    const cancellationErrorCode: CancellationErrorCode = EnumTranslation.implTranslateCancelErrorCode(translatedPhrase.RecognitionStatus);

                    await this.cancelRecognitionLocal(
                        cancelReason,
                        cancellationErrorCode,
                        EnumTranslation.implTranslateErrorDetails(cancellationErrorCode));

                } else {
                    if (translatedPhrase.RecognitionStatus !== RecognitionStatus.EndOfDictation) {
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
                }
                processed = true;
            }

        };

        const handleTranslationHypothesis = (hypothesis: TranslationHypothesis): void => {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, hypothesis.asJson());

            const hypothesisLatencyMs = this.privRequestSession.onHypothesis(hypothesis.Offset);
            if (hypothesisLatencyMs > 0) {
                resultProps.setProperty(PropertyId.SpeechServiceResponse_RecognitionLatencyMs, hypothesisLatencyMs.toString());
            }

            // Continuously track the latest intermediate translation text for
            // every target language. The Recognized handler uses this map to
            // decide whether a follow-up Synthesizing event is expected before
            // applying a deferred resetTurn.
            if (!!hypothesis.Translation && !!hypothesis.Translation.Translations) {
                for (const t of hypothesis.Translation.Translations) {
                    this.privLastRecognizingTranslations[t.Language] = t.Text !== undefined ? t.Text : (t.DisplayText !== undefined ? t.DisplayText : "");
                }
            }

            const result: TranslationRecognitionEventArgs = this.fireEventForResult(hypothesis, resultProps);

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
        };

        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        switch (connectionMessage.path.toLowerCase()) {
            case "translation.hypothesis":
                handleTranslationHypothesis(TranslationHypothesis.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset));
                break;

            case "translation.response":
                const phrase: { SpeechPhrase: ITranslationPhrase } = JSON.parse(connectionMessage.textBody) as { SpeechPhrase: ITranslationPhrase };
                if (!!phrase.SpeechPhrase) {
                    const responsePhrase: TranslationPhrase = TranslationPhrase.fromTranslationResponse(phrase, this.privRequestSession.currentTurnAudioOffset);
                    await handleTranslationPhrase(responsePhrase);
                    await this.maybeResetTurnAfterRecognized(responsePhrase);
                } else {
                    const hypothesis: { SpeechHypothesis: ITranslationHypothesis } = JSON.parse(connectionMessage.textBody) as { SpeechHypothesis: ITranslationHypothesis };
                    if (!!hypothesis.SpeechHypothesis) {
                        handleTranslationHypothesis(TranslationHypothesis.fromTranslationResponse(hypothesis, this.privRequestSession.currentTurnAudioOffset));
                    }
                }
                break;
            case "translation.phrase":
                const phraseMessage: TranslationPhrase = TranslationPhrase.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);
                await handleTranslationPhrase(phraseMessage);
                await this.maybeResetTurnAfterRecognized(phraseMessage);
                break;

            case "translation.synthesis":
            case "audio":
                this.sendSynthesisAudio(connectionMessage.binaryBody, this.privRequestSession.sessionId);
                await this.maybeResetTurnAfterSynthesis();
                processed = true;
                break;

            case "audio.end":
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
                // Defensive: if a deferred resetTurn was waiting on a Synthesizing
                // event but only the synthesis-end marker arrived (e.g., the
                // service produced a 0-byte / dummy synthesis), still apply the
                // reset here so we don't strand a pending mutation.
                await this.maybeResetTurnAfterSynthesis();
                processed = true;
                break;
            default:
                break;
        }
        return processed;
    }

    // After a Recognized phrase arrives following a primary-language mutation,
    // decide whether to apply the resetTurn now or defer it until the next
    // synthesis-related event arrives.
    //
    // Heuristic (driven by observed service behavior):
    //   - If the recognized translation text for the language being replaced
    //     is non-empty AND differs from the last intermediate translation seen
    //     for that language, the service is virtually certain to deliver a
    //     real Synthesizing event next. Defer resetTurn so the synthesis
    //     audio for this phrase isn't dropped by the new turn boundary.
    //   - Otherwise, no real synthesis is expected (or only a 0-byte dummy);
    //     trigger resetTurn immediately.
    private async maybeResetTurnAfterRecognized(translatedPhrase: TranslationPhrase): Promise<void> {
        if (!this.privPrimaryLanguageChanged) {
            return;
        }

        const language: string | undefined = this.privPrimaryLanguageBeingReplaced;
        const recognizedText: string = this.getTranslationTextForLanguage(translatedPhrase, language);
        const intermediateText: string = (language !== undefined && this.privLastRecognizingTranslations[language] !== undefined)
            ? this.privLastRecognizingTranslations[language]
            : "";

        // Clear the pending-mutation tracking state regardless of which branch
        // we take so subsequent phrases aren't re-evaluated against stale data.
        this.privPrimaryLanguageChanged = false;
        this.privPrimaryLanguageBeingReplaced = undefined;
        this.privLastRecognizingTranslations = {};

        if (recognizedText.length > 0 && recognizedText !== intermediateText) {
            // A real Synthesizing event is expected; wait for it before resetting.
            this.privAwaitingSynthesisForReset = true;
        } else {
            await this.resetTurn();
        }
    }

    // If a deferred resetTurn is pending, apply it now. Called from the
    // synthesis message paths so the reset lands after the synthesis event
    // for the just-Recognized phrase has been forwarded to the client.
    private async maybeResetTurnAfterSynthesis(): Promise<void> {
        if (!this.privAwaitingSynthesisForReset) {
            return;
        }
        this.privAwaitingSynthesisForReset = false;
        await this.resetTurn();
    }

    private getTranslationTextForLanguage(translatedPhrase: TranslationPhrase, language: string | undefined): string {
        if (language === undefined || !translatedPhrase.Translation || !translatedPhrase.Translation.Translations) {
            return "";
        }
        for (const t of translatedPhrase.Translation.Translations) {
            if (t.Language === language) {
                return t.Text !== undefined ? t.Text : (t.DisplayText !== undefined ? t.DisplayText : "");
            }
        }
        return "";
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
                undefined, // Language
                undefined, // LanguageDetectionConfidence
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

    protected handleRecognizingCallback(result: SpeechRecognitionResult, offset: number, sessionId: string): void {
        try {
            const ev = new TranslationRecognitionEventArgs(TranslationRecognitionResult.fromSpeechRecognitionResult(result), offset, sessionId);
            this.privTranslationRecognizer.recognizing(this.privTranslationRecognizer, ev);
            /* eslint-disable no-empty */
        } catch (error) {
            // Not going to let errors in the event handler
            // trip things up.
        }
    }

    protected handleRecognizedCallback(result: SpeechRecognitionResult, offset: number, sessionId: string): void {
        try {
            const ev = new TranslationRecognitionEventArgs(TranslationRecognitionResult.fromSpeechRecognitionResult(result), offset, sessionId);
            this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, ev);
        } catch (error) {
            // Not going to let errors in the event handler
            // trip things up.
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
        let confidence: string;
        if (serviceResult instanceof TranslationPhrase) {
            if (!!serviceResult.Translation && serviceResult.Translation.TranslationStatus === TranslationStatus.Success) {
                resultReason = ResultReason.TranslatedSpeech;
            } else {
                resultReason = ResultReason.RecognizedSpeech;
            }
            confidence = serviceResult.Confidence;
        } else {
            resultReason = ResultReason.TranslatingSpeech;
        }
        const language = serviceResult.Language;

        const result = new TranslationRecognitionResult(
            translations,
            this.privRequestSession.requestId,
            resultReason,
            serviceResult.Text,
            serviceResult.Duration,
            serviceResult.Offset,
            language,
            confidence,
            serviceResult.Translation.FailureReason,
            serviceResult.asJson(),
            properties);

        const ev = new TranslationRecognitionEventArgs(result, serviceResult.Offset, this.privRequestSession.sessionId);
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
