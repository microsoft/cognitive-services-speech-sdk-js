// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionMessage,
    createGuid,
    IAudioSource,
    IConnection,
    MessageType,
    PromiseHelper,
} from "../common/Exports";
import { PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream";
import {
    ActivityReceivedEventArgs,
    AudioOutputStream,
    CancellationErrorCode,
    CancellationReason,
    DialogServiceConnector,
    PropertyCollection,
    PropertyId,
    PullAudioOutputStream,
    RecognitionEventArgs,
    ResultReason,
    SessionEventArgs,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
} from "../sdk/Exports";
import { DialogServiceTurnStateManager } from "./DialogServiceTurnStateManager";
import {
    CancellationErrorCodePropertyName,
    EnumTranslation,
    RecognitionStatus,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechDetected,
    SpeechHypothesis,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { ActivityPayloadResponse } from "./ServiceMessages/ActivityResponsePayload";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class DialogServiceAdapter extends ServiceRecognizerBase {
    private privDialogServiceConnector: DialogServiceConnector;

    // Turns are of two kinds:
    // 1: SR turns, end when the SR result is returned and then turn end.
    // 2: Service turns where an activity is sent by the service along with the audio.
    private privTurnStateManager: DialogServiceTurnStateManager;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        dialogServiceConnector: DialogServiceConnector) {

        super(authentication, connectionFactory, audioSource, recognizerConfig, dialogServiceConnector);
        this.privDialogServiceConnector = dialogServiceConnector;

        this.receiveMessageOverride = this.receiveDialogMessageOverride;
        this.privTurnStateManager = new DialogServiceTurnStateManager();
    }

    protected processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void): void {

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        let result: SpeechRecognitionResult;

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.phrase":
                const speechPhrase: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);

                this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + speechPhrase.Offset + speechPhrase.Duration);

                if (speechPhrase.RecognitionStatus === RecognitionStatus.Success) {
                    const args: SpeechRecognitionEventArgs = this.fireEventForResult(speechPhrase, resultProps);
                    if (!!this.privDialogServiceConnector.recognized) {
                        try {
                            this.privDialogServiceConnector.recognized(this.privDialogServiceConnector, args);
                            /* tslint:disable:no-empty */
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }

                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(args.result);
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
                break;
            case "speech.hypothesis":
                const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(connectionMessage.textBody);
                const offset: number = hypothesis.Offset + this.privRequestSession.currentTurnAudioOffset;

                result = new SpeechRecognitionResult(
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    offset,
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                this.privRequestSession.onHypothesis(offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);

                if (!!this.privDialogServiceConnector.recognizing) {
                    try {
                        this.privDialogServiceConnector.recognizing(this.privDialogServiceConnector, ev);
                        /* tslint:disable:no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;

            case "audio":
                const audioRequestId = connectionMessage.requestId.toUpperCase();

                if (audioRequestId !== this.privRequestSession.requestId.toUpperCase()) {
                    const turn = this.privTurnStateManager.GetTurn(audioRequestId);
                    turn.audioStream.write(connectionMessage.binaryBody);
                }
                break;

            case "response":
                const responseRequestId = connectionMessage.requestId.toUpperCase();
                const activityPayload: ActivityPayloadResponse = ActivityPayloadResponse.fromJSON(connectionMessage.textBody);
                const turn = this.privTurnStateManager.GetTurn(responseRequestId);

                const pullAudioOutputStream: PullAudioOutputStreamImpl = turn.processActivityPayload(activityPayload);
                const activity = new ActivityReceivedEventArgs(activityPayload.messagePayload, pullAudioOutputStream);
                if (!!this.privDialogServiceConnector.activityReceived) {
                    try {
                        this.privDialogServiceConnector.activityReceived(this.privDialogServiceConnector, activity);
                        /* tslint:disable:no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
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

            if (!!this.privDialogServiceConnector.canceled) {
                const properties: PropertyCollection = new PropertyCollection();
                properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

                const cancelEvent: SpeechRecognitionCanceledEventArgs = new SpeechRecognitionCanceledEventArgs(
                    cancellationReason,
                    error,
                    errorCode,
                    undefined,
                    sessionId);

                try {
                    this.privDialogServiceConnector.canceled(this.privDialogServiceConnector, cancelEvent);
                    /* tslint:disable:no-empty */
                } catch { }

                if (!!cancelRecoCallback) {
                    const result: SpeechRecognitionResult = new SpeechRecognitionResult(
                        undefined, // ResultId
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
    }

    private receiveDialogMessageOverride = (
        message: ConnectionMessage,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void
        ): any => {
            if (this.isDisposed()) {
                // We're done.
                return PromiseHelper.fromResult(undefined);
            }

            if (!message) {
                return this.receiveMessage(successCallback, errorCallBack);
            }

            const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

            switch (connectionMessage.path.toLowerCase()) {
                case "turn.start":
                    const turnRequestId = connectionMessage.requestId.toUpperCase();

                    // turn started by the service
                    if (turnRequestId !== this.privRequestSession.requestId.toUpperCase()) {
                        this.privTurnStateManager.StartTurn(turnRequestId);
                    }
                    break;
                case "speech.startdetected":
                    const speechStartDetected: SpeechDetected = SpeechDetected.fromJSON(connectionMessage.textBody);

                    const speechStartEventArgs = new RecognitionEventArgs(speechStartDetected.Offset, this.privRequestSession.sessionId);

                    if (!!this.privRecognizer.speechStartDetected) {
                        this.privRecognizer.speechStartDetected(this.privRecognizer, speechStartEventArgs);
                    }

                    break;
                case "speech.enddetected":

                    let json: string;

                    if (connectionMessage.textBody.length > 0) {
                        json = connectionMessage.textBody;
                    } else {
                        // If the request was empty, the JSON returned is empty.
                        json = "{ Offset: 0 }";
                    }

                    const speechStopDetected: SpeechDetected = SpeechDetected.fromJSON(json);

                    this.privRequestSession.onServiceRecognized(speechStopDetected.Offset + this.privRequestSession.currentTurnAudioOffset);

                    const speechStopEventArgs = new RecognitionEventArgs(speechStopDetected.Offset + this.privRequestSession.currentTurnAudioOffset, this.privRequestSession.sessionId);

                    if (!!this.privRecognizer.speechEndDetected) {
                        this.privRecognizer.speechEndDetected(this.privRecognizer, speechStopEventArgs);
                    }
                    break;

                case "turn.end":
                    const turnEndRequestId = connectionMessage.requestId.toUpperCase();

                    // turn started by the service
                    if (turnEndRequestId !== this.privRequestSession.requestId.toUpperCase()) {
                        this.privTurnStateManager.CompleteTurn(turnEndRequestId);
                    } else {
                        // Audio session turn
                        this.sendTelemetryData();

                        const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                        this.privRequestSession.onServiceTurnEndResponse(this.privRecognizerConfig.isContinuousRecognition);

                        if (this.privRequestSession.isSpeechEnded) {
                            if (!!this.privRecognizer.sessionStopped) {
                                this.privRecognizer.sessionStopped(this.privRecognizer, sessionStopEventArgs);
                            }

                            return PromiseHelper.fromResult(true);
                        } else {
                            this.fetchConnection().onSuccessContinueWith((connection: IConnection) => {
                                this.sendSpeechContext(connection);
                            });
                        }
                    }

                    break;
                default:
                    this.processTypeSpecificMessages(
                        connectionMessage,
                        successCallback,
                        errorCallBack);
            }

            return this.receiveMessage(successCallback, errorCallBack);
        }

    private fireEventForResult(serviceResult: SimpleSpeechPhrase, properties: PropertyCollection): SpeechRecognitionEventArgs {
        const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(serviceResult.RecognitionStatus);

        const offset: number = serviceResult.Offset + this.privRequestSession.currentTurnAudioOffset;

        const result = new SpeechRecognitionResult(
            this.privRequestSession.requestId,
            resultReason,
            serviceResult.DisplayText,
            serviceResult.Duration,
            offset,
            undefined,
            JSON.stringify(serviceResult),
            properties);

        const ev = new SpeechRecognitionEventArgs(result, offset, this.privRequestSession.sessionId);
        return ev;
    }
}
