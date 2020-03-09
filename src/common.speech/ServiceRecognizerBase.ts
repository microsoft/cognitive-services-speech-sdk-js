// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import {
    ArgumentNullError,
    ConnectionClosedEvent,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionOpenResponse,
    ConnectionState,
    createGuid,
    createNoDashGuid,
    Deferred,
    EventSource,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    IDisposable,
    IStreamChunk,
    MessageType,
    PromiseCompletionWrapper,
    ServiceEvent,
} from "../common/Exports";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";
import {
    CancellationErrorCode,
    CancellationReason,
    PropertyId,
    RecognitionEventArgs,
    Recognizer,
    SessionEventArgs,
    SpeechRecognitionResult,
} from "../sdk/Exports";
import { Callback } from "../sdk/Transcription/IConversation";
import {
    AgentConfig,
    DynamicGrammarBuilder,
    ISpeechConfigAudio,
    ISpeechConfigAudioDevice,
    RecognitionMode,
    RequestSession,
    SpeechContext,
    SpeechDetected,
} from "./Exports";
import {
    AuthInfo,
    IAuthentication,
} from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export abstract class ServiceRecognizerBase implements IDisposable {
    private privAuthentication: IAuthentication;
    private privConnectionFactory: IConnectionFactory;
    private privAudioSource: IAudioSource;

    // A promise for a configured connection.
    // Do not consume directly, call fetchConnection instead.
    private privConnectionConfigurationPromise: Promise<IConnection>;

    // A promise for a connection, but one that has not had the speech context sent yet.
    // Do not consume directly, call fetchConnection instead.
    private privConnectionPromise: Promise<IConnection>;
    private privAuthFetchEventId: string;
    private privIsDisposed: boolean;
    private privMustReportEndOfStream: boolean;
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privServiceEvents: EventSource<ServiceEvent>;
    private privSpeechContext: SpeechContext;
    private privDynamicGrammar: DynamicGrammarBuilder;
    private privAgentConfig: AgentConfig;
    private privServiceHasSentMessage: boolean;
    private privActivityTemplate: string;
    protected privRequestSession: RequestSession;
    protected privConnectionId: string;
    protected privRecognizerConfig: RecognizerConfig;
    protected privRecognizer: Recognizer;
    protected privSuccessCallback: (e: SpeechRecognitionResult) => void;
    protected privErrorCallback: (e: string) => void;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: Recognizer) {

        if (!authentication) {
            throw new ArgumentNullError("authentication");
        }

        if (!connectionFactory) {
            throw new ArgumentNullError("connectionFactory");
        }

        if (!audioSource) {
            throw new ArgumentNullError("audioSource");
        }

        if (!recognizerConfig) {
            throw new ArgumentNullError("recognizerConfig");
        }

        this.privMustReportEndOfStream = false;
        this.privAuthentication = authentication;
        this.privConnectionFactory = connectionFactory;
        this.privAudioSource = audioSource;
        this.privRecognizerConfig = recognizerConfig;
        this.privIsDisposed = false;
        this.privRecognizer = recognizer;
        this.privRequestSession = new RequestSession(this.privAudioSource.id());
        this.privConnectionEvents = new EventSource<ConnectionEvent>();
        this.privServiceEvents = new EventSource<ServiceEvent>();
        this.privDynamicGrammar = new DynamicGrammarBuilder();
        this.privSpeechContext = new SpeechContext(this.privDynamicGrammar);
        this.privAgentConfig = new AgentConfig();
    }

    public get audioSource(): IAudioSource {
        return this.privAudioSource;
    }

    public get speechContext(): SpeechContext {
        return this.privSpeechContext;
    }

    public get dynamicGrammar(): DynamicGrammarBuilder {
        return this.privDynamicGrammar;
    }

    public get agentConfig(): AgentConfig {
        return this.privAgentConfig;
    }

    public set conversationTranslatorToken(token: string) {
        this.privRecognizerConfig.parameters.setProperty(PropertyId.ConversationTranslator_Token, token);
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public async dispose(reason?: string): Promise<void> {
        this.privIsDisposed = true;
        if (this.privConnectionConfigurationPromise) {
            const connection: IConnection = await this.privConnectionConfigurationPromise;
            await connection.dispose(reason);
        }
    }

    public get connectionEvents(): EventSource<ConnectionEvent> {
        return this.privConnectionEvents;
    }

    public get serviceEvents(): EventSource<ServiceEvent> {
        return this.privServiceEvents;
    }

    public get recognitionMode(): RecognitionMode {
        return this.privRecognizerConfig.recognitionMode;
    }

    protected recognizeOverride: (recoMode: RecognitionMode, sc: (e: SpeechRecognitionResult) => void, ec: (e: string) => void) => any = undefined;

    public async recognize(
        recoMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void,
    ): Promise<void> {

        if (this.recognizeOverride !== undefined) {
            return this.recognizeOverride(recoMode, successCallback, errorCallBack);
        }

        // Clear the existing configuration promise to force a re-transmission of config and context.
        this.privConnectionConfigurationPromise = null;
        this.privRecognizerConfig.recognitionMode = recoMode;

        this.privSuccessCallback = successCallback;
        this.privErrorCallback = errorCallBack;

        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privAudioSource.events);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();

        const audioStreamNode: IAudioStreamNode = await this.audioSource.attach(this.privRequestSession.audioNodeId);
        const format: AudioStreamFormatImpl = await this.audioSource.format;
        const deviceInfo: ISpeechConfigAudioDevice = await this.audioSource.deviceInfo;

        const audioNode = new ReplayableAudioNode(audioStreamNode, format.avgBytesPerSec);
        this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);

        this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

        try {
            await conPromise;
            const configuredConnection: IConnection = await this.configureConnection();
        } catch (error) {
            this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error);
            return;
        }

        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);

        if (!!this.privRecognizer.sessionStarted) {
            this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
        }

        const messageRetrievalPromise = this.receiveMessage();
        const audioSendPromise = this.sendAudio(audioNode);

        /* tslint:disable:no-empty */
        audioSendPromise.catch((error: string) => {
            this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        });

        return;
    }

    public async stopRecognizing(): Promise<void> {
        if (this.privRequestSession.isRecognizing) {
            await this.audioSource.turnOff();
            await this.sendFinalAudio();
            this.privRequestSession.onStopRecognizing();
            await this.privRequestSession.turnCompletionPromise;
            this.privRequestSession.dispose();
        }
        return;
    }

    public async connect(): Promise<void> {
        await this.connectImpl();
    }

    public connectAsync(cb?: Callback, err?: Callback): void {
        this.connectImpl().then((connection: IConnection): void => {
            try {
                if (!!cb) {
                    cb();
                }
            } catch (e) {
                if (!!err) {
                    err(e);
                }
            }
        }, (reason: any): void => {
            try {
                if (!!err) {
                    err(reason);
                }
                /* tslint:disable:no-empty */
            } catch (error) {
            }
        });
    }

    protected disconnectOverride: () => Promise<void> = undefined;

    public async disconnect(): Promise<void> {
        this.cancelRecognitionLocal(CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting");

        try {
            (await this.privConnectionPromise).dispose();
        } catch (error) {

        }
        this.privConnectionPromise = null;

        if (this.disconnectOverride !== undefined) {
            await this.disconnectOverride();
            return;
        }
    }

    public disconnectAsync(cb?: Callback, err?: Callback): void {
        try {
            if (this.disconnectOverride !== undefined) {
                this.disconnectOverride();
                if (!!cb) {
                    cb();
                }
                return;
            }

            this.cancelRecognitionLocal(CancellationReason.Error,
                CancellationErrorCode.NoError,
                "Disconnecting");

            this.privConnectionPromise.then((result: IConnection): void => {
                try {
                    if (!!cb) {
                        cb();
                    }
                } catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
            }, (reason: any): void => {
                try {
                    if (!!err) {
                        err(reason);
                    }
                    /* tslint:disable:no-empty */
                } catch (error) {
                }
            });
        } catch (e) {
            if (!!err) {
                err(e);
            }
        }
    }

    // Called when telemetry data is sent to the service.
    // Used for testing Telemetry capture.
    public static telemetryData: (json: string) => void;
    public static telemetryDataEnabled: boolean = true;

    public sendMessage(message: string): void { }

    public set activityTemplate(messagePayload: string) { this.privActivityTemplate = messagePayload; }
    public get activityTemplate(): string { return this.privActivityTemplate; }

    protected abstract processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void): boolean;

    protected async sendTelemetryData(): Promise<void> {
        const telemetryData = this.privRequestSession.getTelemetry();
        if (ServiceRecognizerBase.telemetryDataEnabled !== true ||
            this.privIsDisposed ||
            null === telemetryData) {
            return;
        }

        if (!!ServiceRecognizerBase.telemetryData) {
            try {
                ServiceRecognizerBase.telemetryData(telemetryData);
                /* tslint:disable:no-empty */
            } catch { }
        }

        const connection: IConnection = await this.fetchConnection();
        await connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "telemetry",
            this.privRequestSession.requestId,
            "application/json",
            telemetryData));
    }

    // Cancels recognition.
    protected abstract cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void;

    // Cancels recognition.
    protected cancelRecognitionLocal(
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {

        if (!!this.privRequestSession.isRecognizing) {
            this.privRequestSession.onStopRecognizing();

            this.cancelRecognition(
                this.privRequestSession.sessionId,
                this.privRequestSession.requestId,
                cancellationReason,
                errorCode,
                error);
        }
    }

    protected receiveMessageOverride: () => Promise<void> = undefined;

    protected async receiveMessage(): Promise<void> {
        try {
            let connection = await this.fetchConnection();
            const message = await connection.read();

            if (this.receiveMessageOverride !== undefined) {
                return this.receiveMessageOverride();
            }

            if (this.privIsDisposed) {
                // We're done.
                return;
            }

            // indicates we are draining the queue and it came with no message;
            if (!message) {
                if (!this.privRequestSession.isRecognizing) {
                    return;
                } else {
                    return this.receiveMessage();
                }
            }

            this.privServiceHasSentMessage = true;
            const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

            if (connectionMessage.requestId.toLowerCase() === this.privRequestSession.requestId.toLowerCase()) {
                switch (connectionMessage.path.toLowerCase()) {
                    case "turn.start":
                        this.privMustReportEndOfStream = true;
                        this.privRequestSession.onServiceTurnStartResponse();
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
                        // Only shrink the buffers for continuous recognition.
                        // For single shot, the speech.phrase message will come after the speech.end and it should own buffer shrink.
                        if (this.privRecognizerConfig.isContinuousRecognition) {
                            this.privRequestSession.onServiceRecognized(speechStopDetected.Offset + this.privRequestSession.currentTurnAudioOffset);
                        }
                        const speechStopEventArgs = new RecognitionEventArgs(speechStopDetected.Offset + this.privRequestSession.currentTurnAudioOffset, this.privRequestSession.sessionId);
                        if (!!this.privRecognizer.speechEndDetected) {
                            this.privRecognizer.speechEndDetected(this.privRecognizer, speechStopEventArgs);
                        }
                        break;

                    case "turn.end":
                        this.sendTelemetryData();
                        if (this.privRequestSession.isSpeechEnded && this.privMustReportEndOfStream) {
                            this.privMustReportEndOfStream = false;
                            this.cancelRecognitionLocal(CancellationReason.EndOfStream, CancellationErrorCode.NoError, undefined);
                        }
                        const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                        this.privRequestSession.onServiceTurnEndResponse(this.privRecognizerConfig.isContinuousRecognition);
                        if (!this.privRecognizerConfig.isContinuousRecognition || this.privRequestSession.isSpeechEnded || !this.privRequestSession.isRecognizing) {
                            if (!!this.privRecognizer.sessionStopped) {
                                this.privRecognizer.sessionStopped(this.privRecognizer, sessionStopEventArgs);
                            }
                            return;
                        } else {
                            connection = await this.fetchConnection();
                            await this.sendSpeechContext(connection);
                            await this.sendWaveHeader(connection);
                        }
                        break;

                    default:
                        if (!this.processTypeSpecificMessages(connectionMessage)) {
                            // here are some messages that the derived class has not processed, dispatch them to connect class
                            if (!!this.privServiceEvents) {
                                this.serviceEvents.onEvent(new ServiceEvent(connectionMessage.path.toLowerCase(), connectionMessage.textBody));
                            }
                        }
                }
            }
            return this.receiveMessage();
        } catch (error) {
            return null;
        }
    }

    protected sendSpeechContext = (connection: IConnection): Promise<void> => {
        const speechContextJson = this.speechContext.toJSON();

        if (speechContextJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.context",
                this.privRequestSession.requestId,
                "application/json",
                speechContextJson));
        }
        return;
    }

    protected sendWaveHeader(connection: IConnection): Promise<void> {
        return this.audioSource.format.then((format: AudioStreamFormatImpl) => {
            // this.writeBufferToConsole(format.header);
            return connection.send(new SpeechConnectionMessage(
                MessageType.Binary,
                "audio",
                this.privRequestSession.requestId,
                "audio/x-wav",
                format.header
            ));
        });
    }

    protected postConnectImplOverride: (connection: Promise<IConnection>) => Promise<IConnection> = undefined;

    // Establishes a websocket connection to the end point.
    protected connectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {
        if (this.privConnectionPromise) {
            const connectionWrapper: PromiseCompletionWrapper<IConnection> = new PromiseCompletionWrapper<IConnection>(this.privConnectionPromise);

            if (connectionWrapper.isCompleted &&
                (connectionWrapper.isError || connectionWrapper.result.state() === ConnectionState.Disconnected) &&
                this.privServiceHasSentMessage === true) {
                this.privConnectionId = null;
                this.privConnectionPromise = null;
                this.privServiceHasSentMessage = false;
                return this.connectImpl();
            } else {
                return this.privConnectionPromise;
            }
        }

        this.privAuthFetchEventId = createNoDashGuid();
        this.privConnectionId = createNoDashGuid();

        this.privRequestSession.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);

        this.privConnectionPromise = authPromise.then(async (result: AuthInfo) => {
            this.privRequestSession.onAuthCompleted(false);

            const connection: IConnection = this.privConnectionFactory.create(this.privRecognizerConfig, result, this.privConnectionId);

            this.privRequestSession.listenForServiceTelemetry(connection.events);

            // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
            // it'll stop sending events.
            connection.events.attach((event: ConnectionEvent) => {
                this.connectionEvents.onEvent(event);
            });
            const response = await connection.open();
            if (response.statusCode === 200) {
                this.privRequestSession.onConnectionEstablishCompleted(response.statusCode);
                return Promise.resolve(connection);
            } else if (response.statusCode === 403 && !isUnAuthorized) {
                return this.connectImpl(true);
            } else {
                this.privRequestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                return Promise.reject(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
            }
        }, (error: string): IConnection => {
            this.privRequestSession.onAuthCompleted(true, error);
            throw new Error(error);
        });

        // Attach an empty handler to allow the promise to run in the background while
        // other startup events happen. It'll eventually be awaited on.
        this.privConnectionPromise.catch(() => { });

        if (this.postConnectImplOverride !== undefined) {
            return this.postConnectImplOverride(this.privConnectionPromise);
        }
        return this.privConnectionPromise;
    }

    protected configConnectionOverride: () => any = undefined;

    protected sendSpeechServiceConfig = (connection: IConnection, requestSession: RequestSession, SpeechServiceConfigJson: string): Promise<void> => {
        // filter out anything that is not required for the service to work.
        if (ServiceRecognizerBase.telemetryDataEnabled !== true) {
            const withTelemetry = JSON.parse(SpeechServiceConfigJson);

            const replacement: any = {
                context: {
                    system: withTelemetry.context.system,
                },
            };

            SpeechServiceConfigJson = JSON.stringify(replacement);
        }

        if (SpeechServiceConfigJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.config",
                requestSession.requestId,
                "application/json",
                SpeechServiceConfigJson));
        }

        return;
    }

    protected fetchConnection(): Promise<IConnection> {
        return this.configureConnection();
    }

    protected sendAudio = (
        audioStreamNode: IAudioStreamNode): Promise<void> => {
        return this.audioSource.format.then((audioFormat: AudioStreamFormatImpl) => {
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
            const startRecogNumber: number = this.privRequestSession.recogNumber;

            const readAndUploadCycle = () => {

                // If speech is done, stop sending audio.
                if (!this.privIsDisposed &&
                    !this.privRequestSession.isSpeechEnded &&
                    this.privRequestSession.isRecognizing &&
                    this.privRequestSession.recogNumber === startRecogNumber) {
                    this.fetchConnection().then((connection: IConnection) => {
                        audioStreamNode.read().then(
                            (audioStreamChunk: IStreamChunk<ArrayBuffer>) => {
                                // we have a new audio chunk to upload.
                                if (this.privRequestSession.isSpeechEnded) {
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
                                    this.privRequestSession.onAudioSent(payload.byteLength);

                                    if (maxSendUnthrottledBytes >= this.privRequestSession.bytesSent) {
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
                                            MessageType.Binary, "audio", this.privRequestSession.requestId, null, payload));

                                    if (!audioStreamChunk?.isEnd) {
                                        uploaded.then(() => {
                                            // this.writeBufferToConsole(payload);
                                            // Regardless of success or failure, schedule the next upload.
                                            // If the underlying connection was broken, the next cycle will
                                            // get a new connection and re-transmit missing audio automatically.
                                            readAndUploadCycle();
                                        }, (error: string): void => {
                                            readAndUploadCycle();
                                        });
                                    } else {
                                        // the audio stream has been closed, no need to schedule next
                                        // read-upload cycle.
                                        this.privRequestSession.onSpeechEnded();
                                        deferred.resolve();
                                    }
                                }, sendDelay);
                            },
                            (error: string) => {
                                if (this.privRequestSession.isSpeechEnded) {
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

    private writeBufferToConsole(buffer: ArrayBuffer): void {
        let out: string = "Buffer Size: ";
        if (null === buffer) {
            out += "null";
        } else {
            const readView: Uint8Array = new Uint8Array(buffer);
            out += buffer.byteLength + "\r\n";
            for (let i: number = 0; i < buffer.byteLength; i++) {
                out += readView[i].toString(16).padStart(2, "0") + " ";
            }
        }
        // tslint:disable-next-line:no-console
        console.info(out);
    }

    private async sendFinalAudio(): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        await connection.send(new SpeechConnectionMessage(MessageType.Binary, "audio", this.privRequestSession.requestId, null, null));
        return;
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private configureConnection(): Promise<IConnection> {
        if (this.configConnectionOverride !== undefined) {
            return this.configConnectionOverride();
        }

        if (this.privConnectionConfigurationPromise) {
            const wrapper: PromiseCompletionWrapper<IConnection> = new PromiseCompletionWrapper<IConnection>(this.privConnectionConfigurationPromise);
            if (wrapper.isCompleted &&
                (wrapper.isError
                    || wrapper.result.state() === ConnectionState.Disconnected)) {

                this.privConnectionConfigurationPromise = null;
                return this.configureConnection();
            } else {
                return this.privConnectionConfigurationPromise;
            }
        }

        this.privConnectionConfigurationPromise = this.connectImpl().then(async (connection: IConnection): Promise<IConnection> => {
            //            console.warn("Connection Completed. " + this.privRequestSession.sessionId);
            await this.sendSpeechServiceConfig(connection, this.privRequestSession, this.privRecognizerConfig.SpeechServiceConfig.serialize());
            await this.sendSpeechContext(connection);
            await this.sendWaveHeader(connection);
            return connection;
        });

        return this.privConnectionConfigurationPromise;
    }
}
