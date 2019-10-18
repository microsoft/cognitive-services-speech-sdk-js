// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import {
    ConnectionEvent,
    ConnectionMessage,
    ConnectionOpenResponse,
    ConnectionState,
    createGuid,
    createNoDashGuid,
    Deferred,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    IStreamChunk,
    MessageType,
    Promise,
    PromiseHelper,
    PromiseResult,
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
    AgentConfig,
    CancellationErrorCodePropertyName,
    EnumTranslation,
    ISpeechConfigAudioDevice,
    RecognitionStatus,
    RequestSession,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechDetected,
    SpeechHypothesis,
} from "./Exports";
import { AuthInfo, IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { ActivityPayloadResponse } from "./ServiceMessages/ActivityResponsePayload";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class DialogServiceAdapter extends ServiceRecognizerBase {
    private privDialogServiceConnector: DialogServiceConnector;
    private privDialogConnectionFactory: IConnectionFactory;
    private privDialogAuthFetchEventId: string;
    private privDialogIsDisposed: boolean;
    private privDialogAuthentication: IAuthentication;
    private privDialogAudioSource: IAudioSource;
    private privDialogRequestSession: RequestSession;

    // A promise for a configured connection.
    // Do not consume directly, call fetchDialogConnection instead.
    private privConnectionConfigPromise: Promise<IConnection>;

    // A promise for a connection, but one that has not had the speech context sent yet.
    // Do not consume directly, call fetchDialogConnection instead.
    private privDialogConnectionPromise: Promise<IConnection>;

    private privSuccessCallback: (e: SpeechRecognitionResult) => void;
    private privConnectionLoop: Promise<IConnection>;
    private terminateMessageLoop: boolean;

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
        this.privDialogAuthentication = authentication;
        this.receiveMessageOverride = this.receiveDialogMessageOverride;
        this.recognizeOverride = this.listenOnce;
        this.connectImplOverride = this.dialogConnectImpl;
        this.configConnectionOverride = this.configConnection;
        this.fetchConnectionOverride = this.fetchDialogConnection;
        this.disconnectOverride = this.privDisconnect;
        this.privDialogAudioSource = audioSource;
        this.privDialogRequestSession = new RequestSession(audioSource.id());
        this.privDialogConnectionFactory = connectionFactory;
        this.privDialogIsDisposed = false;
        this.privTurnStateManager = new DialogServiceTurnStateManager();
    }

    public isDisposed(): boolean {
        return this.privDialogIsDisposed;
    }

    public dispose(reason?: string): void {
        this.privDialogIsDisposed = true;
        if (this.privConnectionConfigPromise) {
            this.privConnectionConfigPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose(reason);
            });
        }
    }

    public sendMessage = (message: string): void => {

        this.dialogConnectImpl();

        this.sendPreAudioMessages();

        const interactionGuid: string = createGuid();
        const requestId: string = createNoDashGuid();

        const agentMessage: any = {
            context: {
                interactionId: interactionGuid
            },
            messagePayload: message,
            version: 0.5
        };

        const agentMessageJson = JSON.stringify(agentMessage);

        this.fetchDialogConnection().onSuccessContinueWith((connection: IConnection) => {
            connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "agent",
                requestId,
                "application/json",
                agentMessageJson));
        });
    }

    protected privDisconnect(): void {
        // tslint:disable-next-line:no-console
        console.info("privDisconnect");
        // this.cancelRecognitionLocal(CancellationReason.Error,
        //     CancellationErrorCode.NoError,
        //     "Disconnecting",
        //     undefined);

        this.terminateMessageLoop = true;
        if (this.privDialogConnectionPromise.result().isCompleted) {
            if (!this.privDialogConnectionPromise.result().isError) {
                this.privDialogConnectionPromise.result().result.dispose();
                this.privDialogConnectionPromise = null;
            }
        } else {
            this.privDialogConnectionPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose();
            });
        }
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

                this.privDialogRequestSession.onPhraseRecognized(this.privDialogRequestSession.currentTurnAudioOffset + speechPhrase.Offset + speechPhrase.Duration);

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
                    if (!!this.privSuccessCallback) {
                        try {
                            this.privSuccessCallback(args.result);
                        } catch (e) {
                            if (!!errorCallBack) {
                                errorCallBack(e);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        this.privSuccessCallback = undefined;
                        errorCallBack = undefined;
                    }
                }
                break;
            case "speech.hypothesis":
                const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(connectionMessage.textBody);
                const offset: number = hypothesis.Offset + this.privDialogRequestSession.currentTurnAudioOffset;

                result = new SpeechRecognitionResult(
                    this.privDialogRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    offset,
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                this.privDialogRequestSession.onHypothesis(offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privDialogRequestSession.sessionId);

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

    protected listenOnce = (
        recoMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallback: (e: string) => void
        ): any => {
            this.privRecognizerConfig.recognitionMode = recoMode;

            this.privDialogRequestSession.startNewRecognition();
            this.privDialogRequestSession.listenForServiceTelemetry(this.privDialogAudioSource.events);

            // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
            this.dialogConnectImpl();

            this.sendPreAudioMessages();

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

            return this.audioSource
                .attach(this.privDialogRequestSession.audioNodeId)
                .continueWithPromise<boolean>((result: PromiseResult<IAudioStreamNode>) => {
                    let audioNode: ReplayableAudioNode;

                    if (result.isError) {
                        // tslint:disable-next-line:no-console
                        console.info("Error in listenOnce: " + result.error);
                        // this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, result.error, successCallback);
                        return PromiseHelper.fromError<boolean>(result.error);
                    } else {
                        audioNode = new ReplayableAudioNode(result.result, this.audioSource.format as AudioStreamFormatImpl);
                        this.privDialogRequestSession.onAudioSourceAttachCompleted(audioNode, false);
                    }

                    return this.audioSource.deviceInfo.onSuccessContinueWithPromise<boolean>((deviceInfo: ISpeechConfigAudioDevice): Promise<boolean> => {
                        this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

                        return this.configConnection()
                            .on((_: IConnection) => {
                                const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privDialogRequestSession.sessionId);

                                if (!!this.privRecognizer.sessionStarted) {
                                    this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
                                }

                                const audioSendPromise = this.sendAudio(audioNode);

                                // /* tslint:disable:no-empty */
                                audioSendPromise.on((_: boolean) => { /*add? return true;*/ }, (error: string) => {
                                    // tslint:disable-next-line:no-console
                                    console.info("Error in listenOnce audioSendPromise: " + error);
                                    // this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error, successCallback);
                                });

                            }, (error: string) => {
                                // tslint:disable-next-line:no-console
                                console.info("Error in listenOnce configConnection: " + error);
                                // this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error, successCallback);
                            }).continueWithPromise<boolean>((result: PromiseResult<IConnection>): Promise<boolean> => {
                                if (result.isError) {
                                    return PromiseHelper.fromError(result.error);
                                } else {
                                    return PromiseHelper.fromResult<boolean>(true);
                                }
                            });
                    });
                });
        }

        protected sendAudio = (
            audioStreamNode: IAudioStreamNode): Promise<boolean> => {
            // NOTE: Home-baked promises crash ios safari during the invocation
            // of the error callback chain (looks like the recursion is way too deep, and
            // it blows up the stack). The following construct is a stop-gap that does not
            // bubble the error up the callback chain and hence circumvents this problem.
            // TODO: rewrite with ES6 promises.
            const deferred = new Deferred<boolean>();

            // The time we last sent data to the service.
            let nextSendTime: number = Date.now();

            const audioFormat: AudioStreamFormatImpl = this.privDialogAudioSource.format as AudioStreamFormatImpl;

            // Max amount to send before we start to throttle
            const fastLaneSizeMs: string = this.privRecognizerConfig.parameters.getProperty("SPEECH-TransmitLengthBeforThrottleMs", "5000");
            const maxSendUnthrottledBytes: number = audioFormat.avgBytesPerSec / 1000 * parseInt(fastLaneSizeMs, 10);
            const startRecogNumber: number = this.privDialogRequestSession.recogNumber;

            const readAndUploadCycle = () => {

                // If speech is done, stop sending audio.
                if (!this.privDialogIsDisposed &&
                    !this.privDialogRequestSession.isSpeechEnded &&
                    this.privDialogRequestSession.isRecognizing &&
                    this.privDialogRequestSession.recogNumber === startRecogNumber) {
                    this.fetchDialogConnection().on((connection: IConnection) => {
                        audioStreamNode.read().on(
                            (audioStreamChunk: IStreamChunk<ArrayBuffer>) => {
                                // we have a new audio chunk to upload.
                                if (this.privDialogRequestSession.isSpeechEnded) {
                                    // If service already recognized audio end then don't send any more audio
                                    deferred.resolve(true);
                                    return;
                                }

                                let payload: ArrayBuffer;
                                let sendDelay: number;

                                if (audioStreamChunk.isEnd) {
                                    payload = null;
                                    sendDelay = 0;
                                } else {
                                    payload = audioStreamChunk.buffer;
                                    this.privDialogRequestSession.onAudioSent(payload.byteLength);

                                    if (maxSendUnthrottledBytes >= this.privDialogRequestSession.bytesSent) {
                                        sendDelay = 0;
                                    } else {
                                        sendDelay = Math.max(0, nextSendTime - Date.now());
                                    }
                                }

                                // Are we ready to send, or need we delay more?
                                setTimeout(() => {
                                    if (payload !== null) {
                                        nextSendTime = Date.now() + (payload.byteLength * 1000 / (audioFormat.avgBytesPerSec * 2));
                                    }

                                    const uploaded: Promise<boolean> = connection.send(
                                        new SpeechConnectionMessage(
                                            MessageType.Binary, "audio", this.privDialogRequestSession.requestId, null, payload));

                                    if (!audioStreamChunk.isEnd) {
                                        uploaded.continueWith((_: PromiseResult<boolean>) => {

                                            // Regardless of success or failure, schedule the next upload.
                                            // If the underlying connection was broken, the next cycle will
                                            // get a new connection and re-transmit missing audio automatically.
                                            readAndUploadCycle();
                                        });
                                    } else {
                                        // the audio stream has been closed, no need to schedule next
                                        // read-upload cycle.
                                        this.privDialogRequestSession.onSpeechEnded();
                                        deferred.resolve(true);
                                    }
                                }, sendDelay);
                            },
                            (error: string) => {
                                if (this.privDialogRequestSession.isSpeechEnded) {
                                    // For whatever reason, Reject is used to remove queue subscribers inside
                                    // the Queue.DrainAndDispose invoked from DetachAudioNode down below, which
                                    // means that sometimes things can be rejected in normal circumstances, without
                                    // any errors.
                                    deferred.resolve(true); // TODO: remove the argument, it's is completely meaningless.
                                } else {
                                    // Only reject, if there was a proper error.
                                    deferred.reject(error);
                                }
                            });
                    }, (error: string) => {
                        deferred.reject(error);
                    });
                }
            };

            readAndUploadCycle();

            return deferred.promise();
        }

    // Establishes a websocket connection to the end point.
    private dialogConnectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {
        if (this.privDialogConnectionPromise) {
            if (this.privDialogConnectionPromise.result().isCompleted &&
                (this.privDialogConnectionPromise.result().isError
                    || this.privDialogConnectionPromise.result().result.state() === ConnectionState.Disconnected)) {
                this.privConnectionId = null;
                this.privDialogConnectionPromise = null;
                return this.dialogConnectImpl();
            } else {
                return this.privDialogConnectionPromise;
            }
        }

        this.privDialogAuthFetchEventId = createNoDashGuid();
        this.privConnectionId = createNoDashGuid();

                    if (!!this.privRecognizer.speechEndDetected) {
                        this.privRecognizer.speechEndDetected(this.privRecognizer, speechStopEventArgs);
                    }
                    break;

                case "turn.end":
                    const turnEndRequestId = connectionMessage.requestId.toUpperCase();

                                // turn started by the service
                                if (turnRequestId !== this.privRequestSession.requestId.toUpperCase()) {
                                    this.privTurnStateManager.StartTurn(turnRequestId);
                                }
                                break;
                            case "speech.startdetected":
                                const speechStartDetected: SpeechDetected = SpeechDetected.fromJSON(connectionMessage.textBody);

                                const speechStartEventArgs = new RecognitionEventArgs(speechStartDetected.Offset, this.privDialogRequestSession.sessionId);

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

                                this.privDialogRequestSession.onServiceRecognized(speechStopDetected.Offset + this.privDialogRequestSession.currentTurnAudioOffset);

                                const speechStopEventArgs = new RecognitionEventArgs(speechStopDetected.Offset + this.privDialogRequestSession.currentTurnAudioOffset, this.privDialogRequestSession.sessionId);

                                if (!!this.privRecognizer.speechEndDetected) {
                                    this.privRecognizer.speechEndDetected(this.privRecognizer, speechStopEventArgs);
                                }
                                break;

                            case "turn.end":
                                const turnEndRequestId = connectionMessage.requestId.toUpperCase();
                                // TODO: enable for this recognizer?   this.sendTelemetryData();
                                // tslint:disable-next-line:no-console
                                console.info("Turn.end debugturn:" + turnEndRequestId);

                                // turn started by the service
                                if (turnEndRequestId !== this.privRequestSession.requestId.toUpperCase()) {
                                    this.privTurnStateManager.CompleteTurn(turnEndRequestId);
                                } else {
                                    // Audio session turn

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

                        return this.receiveDialogMessageOverride();
                });
            }, (error: string) => {
                this.terminateMessageLoop = true;
            });

            return communicationCustodian.promise();
        }

    private startMessageLoop(): Promise<IConnection> {

        this.terminateMessageLoop = false;

        const messageRetrievalPromise = this.receiveDialogMessageOverride();

        return messageRetrievalPromise.on((r: IConnection) => {
            return true;
        }, (error: string) => {
            // tslint:disable-next-line:no-console
            console.info("Error in startMessageLoop promise: " + error);
            // this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error, this.privSuccessCallback/*successCallback*/);
        });
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private configConnection(): Promise<IConnection> {
        if (this.privConnectionConfigPromise) {
            if (this.privConnectionConfigPromise.result().isCompleted &&
                (this.privConnectionConfigPromise.result().isError
                    || this.privConnectionConfigPromise.result().result.state() === ConnectionState.Disconnected)) {

                this.privConnectionConfigPromise = null;
                return this.configConnection();
            } else {
                return this.privConnectionConfigPromise;
            }
        }

        this.privConnectionConfigPromise = this.dialogConnectImpl().onSuccessContinueWithPromise((connection: IConnection): Promise<IConnection> => {
            return this.sendSpeechServiceConfig(connection, this.privDialogRequestSession, this.privRecognizerConfig.SpeechServiceConfig.serialize())
                .onSuccessContinueWithPromise((_: boolean) => {
                    return this.sendAgentConfig(connection).onSuccessContinueWith((_: boolean) => {
                        return connection;
                    });
                });
        });

        return this.privConnectionConfigPromise;
    }

    private fetchDialogConnection = (): Promise<IConnection> => {
        return this.configConnection();
    }

    private sendPreAudioMessages(): void {
        this.fetchDialogConnection().onSuccessContinueWith((connection: IConnection): void => {
            this.sendAgentContext(connection);
        });
    }

    private sendAgentConfig = (connection: IConnection): Promise<boolean> => {
        if (this.agentConfig) {
            const agentConfigJson = this.agentConfig.toJsonString();

            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "agent.config",
                this.privDialogRequestSession.requestId,
                "application/json",
                agentConfigJson));
        }

        return PromiseHelper.fromResult(true);
    }

    private sendAgentContext = (connection: IConnection): Promise<boolean> => {
        const guid: string = createGuid();

        const agentContext: any = {
            channelData: "",
            context: {
                interactionId: guid
            },
            version: 0.5
        };

        const agentContextJson = JSON.stringify(agentContext);

        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "speech.agent.context",
            this.privDialogRequestSession.requestId,
            "application/json",
            agentContextJson));
    }

    private fireEventForResult(serviceResult: SimpleSpeechPhrase, properties: PropertyCollection): SpeechRecognitionEventArgs {
        const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(serviceResult.RecognitionStatus);

        const offset: number = serviceResult.Offset + this.privDialogRequestSession.currentTurnAudioOffset;

        const result = new SpeechRecognitionResult(
            this.privDialogRequestSession.requestId,
            resultReason,
            serviceResult.DisplayText,
            serviceResult.Duration,
            offset,
            undefined,
            JSON.stringify(serviceResult),
            properties);

        const ev = new SpeechRecognitionEventArgs(result, offset, this.privDialogRequestSession.sessionId);
        return ev;
    }
}
