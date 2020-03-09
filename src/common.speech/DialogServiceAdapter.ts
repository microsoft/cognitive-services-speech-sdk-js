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
    PromiseCompletionWrapper,
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

    private privDialogAuthFetchEventId: string;
    private privDialogIsDisposed: boolean;
    private privDialogAuthentication: IAuthentication;
    private privDialogAudioSource: IAudioSource;
    private privDialogRequestSession: RequestSession;

    // A promise for a configured connection.
    // Do not consume directly, call fetchConnection instead.
    private privConnectionConfigPromise: Promise<IConnection>;

    private privConnectionLoop: Promise<void>;
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
        this.postConnectImplOverride = this.dialogConnectImpl;
        this.configConnectionOverride = this.configConnection;
        this.disconnectOverride = this.privDisconnect;
        this.privDialogAudioSource = audioSource;
        this.privDialogRequestSession = new RequestSession(audioSource.id());
        this.privDialogIsDisposed = false;
        this.agentConfigSent = false;
        this.privLastResult = null;
    }

    public isDisposed(): boolean {
        return this.privDialogIsDisposed;
    }

    public async dispose(reason?: string): Promise<void> {
        this.privDialogIsDisposed = true;
        if (this.privConnectionConfigPromise) {
            const connection: IConnection = await this.privConnectionConfigPromise;
            await connection.dispose(reason);
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
        this.fetchConnection().then((connection: IConnection) => {
            connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "agent",
                requestId,
                "application/json",
                agentMessageJson));
        });
    }

    protected async privDisconnect(): Promise<void> {
        this.cancelRecognition(this.privDialogRequestSession.sessionId,
            this.privDialogRequestSession.requestId,
            CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting");

        this.terminateMessageLoop = true;
        this.agentConfigSent = false;
        return;
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): boolean {

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
        error: string): void {

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

            if (!!this.privSuccessCallback) {
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
                    this.privSuccessCallback(result);
                    this.privSuccessCallback = undefined;
                    /* tslint:disable:no-empty */
                } catch { }
            }
        }
    }

    protected async listenOnce(
        recoMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallback: (e: string) => void
    ): Promise<void> {
        this.privRecognizerConfig.recognitionMode = recoMode;

        this.privSuccessCallback = successCallback;
        this.privErrorCallback = errorCallback;

        this.privDialogRequestSession.startNewRecognition();
        this.privDialogRequestSession.listenForServiceTelemetry(this.privDialogAudioSource.events);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();

        const preAudioPromise: Promise<void> = this.sendPreAudioMessages();

        const node: IAudioStreamNode = await this.privDialogAudioSource.attach(this.privDialogRequestSession.audioNodeId);
        const format: AudioStreamFormatImpl = await this.privDialogAudioSource.format;
        const deviceInfo: ISpeechConfigAudioDevice = await this.privDialogAudioSource.deviceInfo;

        const audioNode = new ReplayableAudioNode(node, format.avgBytesPerSec);
        this.privDialogRequestSession.onAudioSourceAttachCompleted(audioNode, false);

        this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

        try {
            await conPromise;
            await preAudioPromise;
        } catch (error) {
            this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error);
            return Promise.resolve();
        }

        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privDialogRequestSession.sessionId);

        if (!!this.privRecognizer.sessionStarted) {
            this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
        }

        const audioSendPromise = this.sendAudio(audioNode);

        // /* tslint:disable:no-empty */
        audioSendPromise.then(() => { /*add? return true;*/ }, (error: string) => {
            this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        });

    }

    protected sendAudio = (audioStreamNode: IAudioStreamNode): Promise<void> => {
        return this.privDialogAudioSource.format.then<void>((audioFormat: AudioStreamFormatImpl) => {
            // NOTE: Home-baked promises crash ios safari during the invocation
            // of the error callback chain (looks like the recursion is way too deep, and
            // it blows up the stack). The following construct is a stop-gap that does not
            // bubble the error up the callback chain and hence circumvents this problem.
            // TODO: rewrite with ES6 promises.
            const deferred = new Deferred<void>();

            // The time we last sent data to the service.
            let nextSendTime: number = Date.now();

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
                    this.fetchConnection().then((connection: IConnection) => {
                        audioStreamNode.read().then(
                            (audioStreamChunk: IStreamChunk<ArrayBuffer>) => {
                                // we have a new audio chunk to upload.
                                if (this.privDialogRequestSession.isSpeechEnded) {
                                    // If service already recognized audio end then don't send any more audio
                                    deferred.resolve();
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

                                    const uploaded: Promise<void> = connection.send(
                                        new SpeechConnectionMessage(
                                            MessageType.Binary, "audio", this.privDialogRequestSession.requestId, null, payload));

                                    if (audioStreamChunk && !audioStreamChunk.isEnd) {
                                        uploaded.then(() => {

                                            // Regardless of success or failure, schedule the next upload.
                                            // If the underlying connection was broken, the next cycle will
                                            // get a new connection and re-transmit missing audio automatically.
                                            readAndUploadCycle();
                                        }, () => {
                                            readAndUploadCycle();
                                        });
                                    } else {
                                        // the audio stream has been closed, no need to schedule next
                                        // read-upload cycle.
                                        this.privDialogRequestSession.onSpeechEnded();
                                        deferred.resolve();
                                    }
                                }, sendDelay);
                            },
                            (error: string) => {
                                if (this.privDialogRequestSession.isSpeechEnded) {
                                    // For whatever reason, Reject is used to remove queue subscribers inside
                                    // the Queue.DrainAndDispose invoked from DetachAudioNode down below, which
                                    // means that sometimes things can be rejected in normal circumstances, without
                                    // any errors.
                                    deferred.resolve(); // TODO: remove the argument, it's is completely meaningless.
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

            return deferred.promise;
        });
    }

    protected sendWaveHeader(connection: IConnection): Promise<void> {
        return this.audioSource.format.then<void>((format: AudioStreamFormatImpl) => {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Binary,
                "audio",
                this.privDialogRequestSession.requestId,
                null,
                format.header));
        });
    }

    // Establishes a websocket connection to the end point.
    private dialogConnectImpl(connection: Promise<IConnection>): Promise<IConnection> {
        this.privConnectionLoop = this.startMessageLoop();
        return connection;
    }

    private receiveDialogMessageOverride(): Promise<void> {

        // we won't rely on the cascading promises of the connection since we want to continually be available to receive messages
        const communicationCustodian: Deferred<void> = new Deferred<void>();

        const loop = async (): Promise<void> => {
            try {
                const connection: IConnection = await this.fetchConnection();
                const message: ConnectionMessage = await connection.read();

                const isDisposed: boolean = this.isDisposed();
                const terminateMessageLoop = (!this.isDisposed() && this.terminateMessageLoop);
                if (isDisposed || terminateMessageLoop) {
                    // We're done.
                    communicationCustodian.resolve(undefined);
                    return;
                }

                if (!message) {
                    return loop();
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
                            } else {
                                this.privDialogRequestSession.onServiceTurnStartResponse();
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
                        }
                        break;

                    default:
                        if (!this.processTypeSpecificMessages(connectionMessage)) {
                            if (!!this.serviceEvents) {
                                this.serviceEvents.onEvent(new ServiceEvent(connectionMessage.path.toLowerCase(), connectionMessage.textBody));
                            }
                        }
                }
                const ret: Promise<void> = loop();
                // tslint:disable-next-line:no-console
                ret.catch(() => { console.warn("Inner loop"); });
                return ret;
            } catch (error) {
                this.terminateMessageLoop = true;
                communicationCustodian.resolve();
            }
        };

        // tslint:disable-next-line:no-console
        loop().catch(() => { console.warn("Loop catch 2"); });

        return communicationCustodian.promise;
    }

    private async startMessageLoop(): Promise<void> {

        this.terminateMessageLoop = false;

        try {
            await this.receiveDialogMessageOverride();

        } catch (error) {
            this.cancelRecognition(this.privDialogRequestSession.sessionId, this.privDialogRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        }

        return Promise.resolve();
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private configConnection(): Promise<IConnection> {
        if (this.privConnectionConfigPromise) {
            const wrapper: PromiseCompletionWrapper<IConnection> = new PromiseCompletionWrapper<IConnection>(this.privConnectionConfigPromise);

            if (wrapper.isCompleted &&
                (wrapper.isError || wrapper.result.state() === ConnectionState.Disconnected)) {

                this.privConnectionConfigPromise = null;
                return this.configConnection();
            } else {
                return this.privConnectionConfigPromise;
            }
        }

        if (this.terminateMessageLoop) {
            this.terminateMessageLoop = false;
            return Promise.reject(`Connection to service terminated.`);
        }

        this.privConnectionConfigPromise = this.connectImpl().then(async (connection: IConnection): Promise<IConnection> => {
            await this.sendSpeechServiceConfig(connection, this.privDialogRequestSession, this.privRecognizerConfig.SpeechServiceConfig.serialize());
            await this.sendAgentConfig(connection);
            return connection;
        });

        // This will be awaited later, so set an empty catch.
        this.privConnectionConfigPromise.catch(() => { });
        return this.privConnectionConfigPromise;
    }

    private async sendPreAudioMessages(): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        await this.sendAgentContext(connection);
        await this.sendWaveHeader(connection);
    }

    private sendAgentConfig = (connection: IConnection): Promise<void> => {
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

        return;
    }

    private sendAgentContext = (connection: IConnection): Promise<void> => {
        const guid: string = createGuid();

        const speechActivityTemplate = this.privDialogServiceConnector.properties.getProperty(PropertyId.Conversation_Speech_Activity_Template);

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
