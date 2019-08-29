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
    DialogServiceConnector,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechRecognitionResult,
    TranslationRecognitionResult,
    Translations,
    TranslationSynthesisEventArgs,
    TranslationSynthesisResult
} from "../sdk/Exports";
import {
    CancellationErrorCodePropertyName,
    EnumTranslation,
    RecognitionStatus,
    ServiceRecognizerBase
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class DialogServiceAdapter extends ServiceRecognizerBase {
    private privDialogServiceConnector: DialogServiceConnector;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        dialogServiceConnector: DialogServiceConnector) {

        super(authentication, connectionFactory, audioSource, recognizerConfig, dialogServiceConnector);
        this.privDialogServiceConnector = dialogServiceConnector;
    }

    protected processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: TranslationRecognitionResult) => void,
        errorCallBack?: (e: string) => void): void {
        return;
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string,
        cancelRecoCallback: (e: SpeechRecognitionResult) => void): void {
        return;
    //     if (!!this.privTranslationRecognizer.canceled) {
    //         const properties: PropertyCollection = new PropertyCollection();
    //         properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

    //         const cancelEvent: TranslationRecognitionCanceledEventArgs = new TranslationRecognitionCanceledEventArgs(
    //             sessionId,
    //             cancellationReason,
    //             error,
    //             errorCode,
    //             undefined);

    //         try {
    //             this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, cancelEvent);
    //             /* tslint:disable:no-empty */
    //         } catch { }

    //         if (!!cancelRecoCallback) {
    //             const result: TranslationRecognitionResult = new TranslationRecognitionResult(
    //                 undefined, // Translations
    //                 requestId,
    //                 ResultReason.Canceled,
    //                 undefined, // Text
    //                 undefined, // Druation
    //                 undefined, // Offset
    //                 error,
    //                 undefined, // Json
    //                 properties);
    //             try {
    //                 cancelRecoCallback(result);
    //                 /* tslint:disable:no-empty */
    //             } catch { }
    //         }
    //     }
    }

    // private fireEventForResult(serviceResult: TranslationHypothesis | TranslationPhrase, properties: PropertyCollection): TranslationRecognitionEventArgs {
    //     let translations: Translations;

    //     if (undefined !== serviceResult.Translation.Translations) {
    //         translations = new Translations();
    //         for (const translation of serviceResult.Translation.Translations) {
    //             translations.set(translation.Language, translation.Text);
    //         }
    //     }

    //     let resultReason: ResultReason;
    //     if (serviceResult instanceof TranslationPhrase) {
    //         if (serviceResult.Translation.TranslationStatus === TranslationStatus.Success) {
    //             resultReason = ResultReason.TranslatedSpeech;
    //         } else {
    //             resultReason = ResultReason.RecognizedSpeech;
    //         }
    //     } else {
    //         resultReason = ResultReason.TranslatingSpeech;
    //     }

    //     const offset: number = serviceResult.Offset + this.privRequestSession.currentTurnAudioOffset;

    //     const result = new TranslationRecognitionResult(
    //         translations,
    //         this.privRequestSession.requestId,
    //         resultReason,
    //         serviceResult.Text,
    //         serviceResult.Duration,
    //         offset,
    //         serviceResult.Translation.FailureReason,
    //         JSON.stringify(serviceResult),
    //         properties);

    //     const ev = new TranslationRecognitionEventArgs(result, offset, this.privRequestSession.sessionId);
    //     return ev;
    // }

    // private sendSynthesisAudio(audio: ArrayBuffer, sessionId: string): void {
    //     const reason = (undefined === audio) ? ResultReason.SynthesizingAudioCompleted : ResultReason.SynthesizingAudio;
    //     const result = new TranslationSynthesisResult(reason, audio);
    //     const retEvent: TranslationSynthesisEventArgs = new TranslationSynthesisEventArgs(result, sessionId);

    //     if (!!this.privTranslationRecognizer.synthesizing) {
    //         try {
    //             this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
    //             /* tslint:disable:no-empty */
    //         } catch (error) {
    //             // Not going to let errors in the event handler
    //             // trip things up.
    //         }
    //     }

    // }
}
