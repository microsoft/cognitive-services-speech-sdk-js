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
    ServiceEvent,
} from "../common/Exports";
import { PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";
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
import { RecognitionMode, RecognizerConfig } from "./RecognizerConfig";
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
    private agentConfigSent: boolean;
    private privLastResult: SpeechRecognitionResult;

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
        this.privTurnStateManager = new DialogServiceTurnStateManager();
        this.recognizeOverride = this.listenOnce;
        this.connectImplOverride = this.dialogConnectImpl;
        this.configConnectionOverride = this.configConnection;
        this.fetchConnectionOverride = this.fetchDialogConnection;
        this.disconnectOverride = this.privDisconnect;
        this.privDialogAudioSource = audioSource;
        this.privDialogRequestSession = new RequestSession(audioSource.id());
        this.privDialogConnectionFactory = connectionFactory;
        this.privDialogIsDisposed = false;
        this.agentConfigSent = false;
        this.privLastResult = null;
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
        this.cancelRecognition(this.privDialogRequestSession.sessionId,
            this.privDialogRequestSession.requestId,
            CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting",
            undefined);

        this.terminateMessageLoop = true;
        this.agentConfigSent = false;
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
        errorCallBack?: (e: string) => void): boolean {

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        let result: SpeechRecognitionResult;
        let processed: boolean;

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.phrase":
                const speechPhrase: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);

                this.privDialogRequestSession.onPhraseRecognized(this.privDialogRequestSession.currentTurnAudioOffset + speechPhrase.Offset + speechPhrase.Duration);

                if (speechPhrase.RecognitionStatus === RecognitionStatus.Success) {
                    const args: SpeechRecognitionEventArgs = this.fireEventForResult(speechPhrase, resultProps);
                    this.privLastResult = args.result;

                    if (!!this.privDialogServiceConnector.recognized) {
                        try {
                            this.privDialogServiceConnector.recognized(this.privDialogServiceConnector, args);
                            /* tslint:disable:no-empty */
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }
                }
                processed = true;
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
                processed = true;
                break;

            case "audio":
                {
                    const audioRequestId = connectionMessage.requestId.toUpperCase();
                    const turn = this.privTurnStateManager.GetTurn(audioRequestId);
                    try {
                        // Empty binary message signals end of stream.
                        if (!connectionMessage.binaryBody) {
                            turn.endAudioStream();
                        } else {
                            turn.audioStream.write(connectionMessage.binaryBody);
                        }
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                processed = true;
                break;

            case "response":
                {
                    const responseRequestId = connectionMessage.requestId.toUpperCase();
                    const activityPayload: ActivityPayloadResponse = ActivityPayloadResponse.fromJSON(connectionMessage.textBody);
                    const turn = this.privTurnStateManager.GetTurn(responseRequestId);

                    // update the conversation Id
                    if (activityPayload.conversationId) {
                        const updateAgentConfig = this.agentConfig.get();
                        updateAgentConfig.botInfo.conversationId = activityPayload.conversationId;
                        this.agentConfig.set(updateAgentConfig);
                    }

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
        error: string,
        cancelRecoCallback: (e: SpeechRecognitionResult) => void): void {

            this.terminateMessageLoop = true;

            if (!!this.privDialogRequestSession.isRecognizing) {
                this.privDialogRequestSession.onStopRecognizing();
            }

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

            this.privSuccessCallback = successCallback;

            return this.privDialogAudioSource
                .attach(this.privDialogRequestSession.audioNodeId)
                .continueWithPromise<boolean>((result: PromiseResult<IAudioStreamNode>) => {
                    let audioNode: ReplayableAudioNode;

                    if (result.isError) {
                        this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.ConnectionFailure, result.error, successCallback);
                        return PromiseHelper.fromError<boolean>(result.error);
                    } else {
                        audioNode = new ReplayableAudioNode(result.result, this.privDialogAudioSource.format as AudioStreamFormatImpl);
                        this.privDialogRequestSession.onAudioSourceAttachCompleted(audioNode, false);
                    }

                    return this.privDialogAudioSource.deviceInfo.onSuccessContinueWithPromise<boolean>((deviceInfo: ISpeechConfigAudioDevice): Promise<boolean> => {
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
                                    this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error, successCallback);
                                });

                            }, (error: string) => {
                                this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error, successCallback);
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

                                if (!audioStreamChunk || audioStreamChunk.isEnd) {
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

                                    if (audioStreamChunk && !audioStreamChunk.isEnd) {
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

    protected sendWaveHeader(connection: IConnection): Promise<boolean> {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Binary,
            "audio",
            this.privDialogRequestSession.requestId,
            null,
            this.audioSource.format.header));
        }

    // Establishes a websocket connection to the end point.
    private dialogConnectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {
        if (this.privDialogConnectionPromise) {
            if (this.privDialogConnectionPromise.result().isCompleted &&
                (this.privDialogConnectionPromise.result().isError
                    || this.privDialogConnectionPromise.result().result.state() === ConnectionState.Disconnected)) {
                this.agentConfigSent = false;
                this.privDialogConnectionPromise = null;
                this.terminateMessageLoop = true;
                return this.configConnection();
            } else {
                return this.privDialogConnectionPromise;
            }
        }

        this.privDialogAuthFetchEventId = createNoDashGuid();

        // keep the connectionId for reconnect events
        if (this.privConnectionId === undefined) {
            this.privConnectionId = createNoDashGuid();
        }

        this.privDialogRequestSession.onPreConnectionStart(this.privDialogAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privDialogAuthentication.fetchOnExpiry(this.privDialogAuthFetchEventId) : this.privDialogAuthentication.fetch(this.privDialogAuthFetchEventId);

        this.privDialogConnectionPromise = authPromise
            .continueWithPromise((result: PromiseResult<AuthInfo>) => {
                if (result.isError) {
                    this.privDialogRequestSession.onAuthCompleted(true, result.error);
                    throw new Error(result.error);
                } else {
                    this.privDialogRequestSession.onAuthCompleted(false);
                }

                const connection: IConnection = this.privDialogConnectionFactory.create(this.privRecognizerConfig, result.result, this.privConnectionId);

                this.privDialogRequestSession.listenForServiceTelemetry(connection.events);

                // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
                // it'll stop sending events.
                connection.events.attach((event: ConnectionEvent) => {
                    this.connectionEvents.onEvent(event);
                });

                return connection.open().onSuccessContinueWithPromise((response: ConnectionOpenResponse): Promise<IConnection> => {
                    if (response.statusCode === 200) {
                        this.privDialogRequestSession.onPreConnectionStart(this.privDialogAuthFetchEventId, this.privConnectionId);
                        this.privDialogRequestSession.onConnectionEstablishCompleted(response.statusCode);

                        return PromiseHelper.fromResult<IConnection>(connection);
                    } else if (response.statusCode === 403 && !isUnAuthorized) {
                        return this.dialogConnectImpl(true);
                    } else {
                        this.privDialogRequestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                        return PromiseHelper.fromError<IConnection>(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
                    }
                });
            });

        this.privConnectionLoop = this.startMessageLoop();
        return this.privDialogConnectionPromise;
    }

    private receiveDialogMessageOverride = (
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void
        ): Promise<IConnection> => {

            // we won't rely on the cascading promises of the connection since we want to continually be available to receive messages
            const communicationCustodian: Deferred<IConnection> = new Deferred<IConnection>();

            this.fetchDialogConnection().on((connection: IConnection): Promise<IConnection> => {
                return connection.read()
                    .onSuccessContinueWithPromise((message: ConnectionMessage): Promise<IConnection> => {
                        const isDisposed: boolean = this.isDisposed();
                        const terminateMessageLoop = (!this.isDisposed() && this.terminateMessageLoop);
                        if (isDisposed || terminateMessageLoop) {
                            // We're done.
                            communicationCustodian.resolve(undefined);
                            return PromiseHelper.fromResult<IConnection>(undefined);
                        }

                        if (!message) {
                            return this.receiveDialogMessageOverride();
                        }

                        const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

                        switch (connectionMessage.path.toLowerCase()) {
                            case "turn.start":
                                {
                                    const turnRequestId = connectionMessage.requestId.toUpperCase();
                                    const audioSessionReqId = this.privDialogRequestSession.requestId.toUpperCase();

                                    // turn started by the service
                                    if (turnRequestId !== audioSessionReqId) {
                                        this.privTurnStateManager.StartTurn(turnRequestId);
                                    }
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
                                {
                                    const turnEndRequestId = connectionMessage.requestId.toUpperCase();

                                    const audioSessionReqId = this.privDialogRequestSession.requestId.toUpperCase();

                                    // turn started by the service
                                    if (turnEndRequestId !== audioSessionReqId) {
                                        this.privTurnStateManager.CompleteTurn(turnEndRequestId);
                                    } else {
                                        // Audio session turn

                                        const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privDialogRequestSession.sessionId);
                                        this.privDialogRequestSession.onServiceTurnEndResponse(false);

                                        if (this.privDialogRequestSession.isSpeechEnded) {
                                            if (!!this.privRecognizer.sessionStopped) {
                                                this.privRecognizer.sessionStopped(this.privRecognizer, sessionStopEventArgs);
                                            }
                                        }

                                        // report result to promise.
                                        if (!!this.privSuccessCallback && this.privLastResult) {
                                            try {
                                                this.privSuccessCallback(this.privLastResult);
                                                this.privLastResult = null;
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
                                }
                                break;

                            default:
                                if (!this.processTypeSpecificMessages(
                                    connectionMessage,
                                    successCallback,
                                    errorCallBack)) {
                                        if (!!this.serviceEvents) {
                                            this.serviceEvents.onEvent(new ServiceEvent(connectionMessage.path.toLowerCase(), connectionMessage.textBody));
                                        }
                                    }
                        }

                        return this.receiveDialogMessageOverride();
                });
            }, (error: string) => {
                this.terminateMessageLoop = true;
                communicationCustodian.resolve(undefined);
                return PromiseHelper.fromResult<IConnection>(undefined);
            });

            return communicationCustodian.promise();
        }

    private startMessageLoop(): Promise<IConnection> {

        this.terminateMessageLoop = false;

        const messageRetrievalPromise = this.receiveDialogMessageOverride();

        return messageRetrievalPromise.on((r: IConnection) => {
            return true;
        }, (error: string) => {
            this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error, this.privSuccessCallback);
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

        if (this.terminateMessageLoop) {
            this.terminateMessageLoop = false;
            return PromiseHelper.fromError(`Connection to service terminated.`);
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
            this.sendWaveHeader(connection);
        });
    }

    private sendAgentConfig = (connection: IConnection): Promise<boolean> => {
        if (this.agentConfig && !this.agentConfigSent) {

            if (this.privRecognizerConfig.parameters.getProperty(PropertyId.Conversation_DialogType) === "custom_commands") {
                const config = this.agentConfig.get();
                config.botInfo.commandsCulture = this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-us");
                this.agentConfig.set(config);
            }
            const agentConfigJson = this.agentConfig.toJsonString();

            // guard against sending this multiple times on one connection
            this.agentConfigSent = true;

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

        const speechActivityTemplate = this.privRecognizerConfig.parameters.getProperty(PropertyId.Conversation_Speech_Activity_Template);

        const agentContext: any = {
            channelData: "",
            context: {
                interactionId: guid
            },
            messagePayload: typeof speechActivityTemplate === undefined ? undefined : speechActivityTemplate,
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
