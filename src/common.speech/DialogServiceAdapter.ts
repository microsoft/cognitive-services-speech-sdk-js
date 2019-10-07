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

        // TODO add impl details along with ListenOnce impl
    }

}
