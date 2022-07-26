// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import { ConnectionOpenResponse } from "../common/ConnectionOpenResponse";
import {
    ArgumentNullError,
    ConnectionClosedEvent,
    ConnectionEvent,
    ConnectionState,
    createNoDashGuid,
    EventSource,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    IDisposable,
    IStreamChunk,
    MessageType,
    ServiceEvent,
    Timeout
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
    ISpeechConfigAudioDevice,
    RecognitionMode,
    RequestSession,
    SpeechContext,
    SpeechDetected,
    type
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

    // A promise for a configured connection.
    // Do not consume directly, call fetchConnection instead.
    private privConnectionConfigurationPromise: Promise<IConnection> = undefined;

    // A promise for a connection, but one that has not had the speech context sent yet.
    // Do not consume directly, call fetchConnection instead.
    private privConnectionPromise: Promise<IConnection> = undefined;
    private privAuthFetchEventId: string;
    private privIsDisposed: boolean;
    private privMustReportEndOfStream: boolean;
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privServiceEvents: EventSource<ServiceEvent>;
    private privDynamicGrammar: DynamicGrammarBuilder;
    private privAgentConfig: AgentConfig;
    private privServiceHasSentMessage: boolean;
    private privActivityTemplate: string;
    private privSetTimeout: (cb: () => void, delay: number) => number = setTimeout;
    private privAudioSource: IAudioSource;
    private privIsLiveAudio: boolean = false;
    protected privSpeechContext: SpeechContext;
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
        if (typeof (Blob) !== "undefined" && typeof (Worker) !== "undefined") {
            this.privSetTimeout = Timeout.setTimeout;
        }

        this.connectionEvents.attach((connectionEvent: ConnectionEvent): void => {
            if (connectionEvent.name === "ConnectionClosedEvent") {
                const connectionClosedEvent = connectionEvent as ConnectionClosedEvent;
                if (connectionClosedEvent.statusCode === 1003 ||
                    connectionClosedEvent.statusCode === 1007 ||
                    connectionClosedEvent.statusCode === 1002 ||
                    connectionClosedEvent.statusCode === 4000 ||
                    this.privRequestSession.numConnectionAttempts > this.privRecognizerConfig.maxRetryCount
                ) {
                    void this.cancelRecognitionLocal(CancellationReason.Error,
                        connectionClosedEvent.statusCode === 1007 ? CancellationErrorCode.BadRequestParameters : CancellationErrorCode.ConnectionFailure,
                        `${connectionClosedEvent.reason} websocket error code: ${connectionClosedEvent.statusCode}`);
                }
            }
        });
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

    public set authentication(auth: IAuthentication) {
        this.privAuthentication = this.authentication;
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public async dispose(reason?: string): Promise<void> {
        this.privIsDisposed = true;
        if (this.privConnectionConfigurationPromise !== undefined) {
            try {
                const connection: IConnection = await this.privConnectionConfigurationPromise;
                await connection.dispose(reason);
            } catch (error) {
                // The connection is in a bad state. But we're trying to kill it, so...
                return;
            }
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

    protected recognizeOverride: (recoMode: RecognitionMode, sc: (e: SpeechRecognitionResult) => void, ec: (e: string) => void) => Promise<void> = undefined;

    public async recognize(
        recoMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void,
    ): Promise<void> {

        if (this.recognizeOverride !== undefined) {
            await this.recognizeOverride(recoMode, successCallback, errorCallBack);
            return;
        }
        // Clear the existing configuration promise to force a re-transmission of config and context.
        this.privConnectionConfigurationPromise = undefined;
        this.privRecognizerConfig.recognitionMode = recoMode;

        this.privSuccessCallback = successCallback;
        this.privErrorCallback = errorCallBack;

        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privAudioSource.events);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();
        let audioNode: ReplayableAudioNode;

        try {
            const audioStreamNode: IAudioStreamNode = await this.audioSource.attach(this.privRequestSession.audioNodeId);
            const format: AudioStreamFormatImpl = await this.audioSource.format;
            const deviceInfo: ISpeechConfigAudioDevice = await this.audioSource.deviceInfo;
            this.privIsLiveAudio = deviceInfo.type && deviceInfo.type === type.Microphones;

            audioNode = new ReplayableAudioNode(audioStreamNode, format.avgBytesPerSec);
            await this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);
            this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

        } catch (error) {
            await this.privRequestSession.onStopRecognizing();
            throw error;
        }

        try {
            await conPromise;
        } catch (error) {
            await this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error as string);
            return;
        }

        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);

        if (!!this.privRecognizer.sessionStarted) {
            this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
        }

        void this.receiveMessage();
        const audioSendPromise = this.sendAudio(audioNode);

        audioSendPromise.catch(async (error: string): Promise<void> => {
            await this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        });

        return;
    }

    public async stopRecognizing(): Promise<void> {
        if (this.privRequestSession.isRecognizing) {
            try {
                await this.audioSource.turnOff();
                await this.sendFinalAudio();
                await this.privRequestSession.onStopRecognizing();
                await this.privRequestSession.turnCompletionPromise;
            } finally {
                await this.privRequestSession.dispose();
            }
        }
        return;
    }

    public async connect(): Promise<void> {
        await this.connectImpl();
        return Promise.resolve();
    }

    public connectAsync(cb?: Callback, err?: Callback): void {
        this.connectImpl().then((): void => {
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
                /* eslint-disable no-empty */
            } catch (error) {
            }
        });
    }

    protected disconnectOverride: () => Promise<void> = undefined;

    public async disconnect(): Promise<void> {
        await this.cancelRecognitionLocal(CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting");

        if (this.disconnectOverride !== undefined) {
            await this.disconnectOverride();
        }

        if (this.privConnectionPromise !== undefined) {
            try {
                await (await this.privConnectionPromise).dispose();
            } catch (error) {

            }
        }
        this.privConnectionPromise = undefined;
    }

    // Called when telemetry data is sent to the service.
    // Used for testing Telemetry capture.
    public static telemetryData: (json: string) => void;
    public static telemetryDataEnabled: boolean = true;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public sendMessage(message: string): Promise<void> {
        return;
    }

    public async sendNetworkMessage(path: string, payload: string | ArrayBuffer): Promise<void> {
        const type: MessageType = typeof payload === "string" ? MessageType.Text : MessageType.Binary;
        const contentType: string = typeof payload === "string" ? "application/json" : "";

        const connection: IConnection = await this.fetchConnection();
        return connection.send(new SpeechConnectionMessage(type, path, this.privRequestSession.requestId, contentType, payload));
    }

    public set activityTemplate(messagePayload: string) {
        this.privActivityTemplate = messagePayload;
    }

    public get activityTemplate(): string {
        return this.privActivityTemplate;
    }

    protected abstract processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void): Promise<boolean>;

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
                /* eslint-disable no-empty */
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
    protected async cancelRecognitionLocal(
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): Promise<void> {

        if (!!this.privRequestSession.isRecognizing) {
            await this.privRequestSession.onStopRecognizing();

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
            if (this.privIsDisposed) {
                // We're done.
                return;
            }

            let connection = await this.fetchConnection();
            const message = await connection.read();

            if (this.receiveMessageOverride !== undefined) {
                return this.receiveMessageOverride();
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
                        await this.sendTelemetryData();
                        if (this.privRequestSession.isSpeechEnded && this.privMustReportEndOfStream) {
                            this.privMustReportEndOfStream = false;
                            await this.cancelRecognitionLocal(CancellationReason.EndOfStream, CancellationErrorCode.NoError, undefined);
                        }
                        const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                        await this.privRequestSession.onServiceTurnEndResponse(this.privRecognizerConfig.isContinuousRecognition);
                        if (!this.privRecognizerConfig.isContinuousRecognition || this.privRequestSession.isSpeechEnded || !this.privRequestSession.isRecognizing) {
                            if (!!this.privRecognizer.sessionStopped) {
                                this.privRecognizer.sessionStopped(this.privRecognizer, sessionStopEventArgs);
                            }
                            return;
                        } else {
                            connection = await this.fetchConnection();
                            await this.sendPrePayloadJSON(connection);
                        }
                        break;

                    default:
                        if (!await this.processTypeSpecificMessages(connectionMessage)) {
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

    protected sendSpeechContext(connection: IConnection, generateNewRequestId: boolean): Promise<void> {
        const speechContextJson = this.speechContext.toJSON();
        if (generateNewRequestId) {
            this.privRequestSession.onSpeechContext();
        }

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

    protected sendPrePayloadJSONOverride: (connection: IConnection) => Promise<void> = undefined;

    // Encapsulated for derived service recognizers that need to send additional JSON
    protected async sendPrePayloadJSON(connection: IConnection, generateNewRequestId: boolean = true): Promise<void> {
        if (this.sendPrePayloadJSONOverride !== undefined) {
            return this.sendPrePayloadJSONOverride(connection);
        }

        await this.sendSpeechContext(connection, generateNewRequestId);
        await this.sendWaveHeader(connection);
        return;
    }

    protected async sendWaveHeader(connection: IConnection): Promise<void> {
        const format: AudioStreamFormatImpl = await this.audioSource.format;
        // this.writeBufferToConsole(format.header);
        return connection.send(new SpeechConnectionMessage(
            MessageType.Binary,
            "audio",
            this.privRequestSession.requestId,
            "audio/x-wav",
            format.header
        ));
    }

    protected postConnectImplOverride: (connection: Promise<IConnection>) => Promise<IConnection> = undefined;

    // Establishes a websocket connection to the end point.
    protected connectImpl(): Promise<IConnection> {
        if (this.privConnectionPromise !== undefined) {
            return this.privConnectionPromise.then((connection: IConnection): Promise<IConnection> => {
                if (connection.state() === ConnectionState.Disconnected) {
                    this.privConnectionId = null;
                    this.privConnectionPromise = undefined;
                    this.privServiceHasSentMessage = false;
                    return this.connectImpl();
                }
                return this.privConnectionPromise;
            }, (): Promise<IConnection> => {
                this.privConnectionId = null;
                this.privConnectionPromise = undefined;
                this.privServiceHasSentMessage = false;
                return this.connectImpl();
            });
        }

        this.privConnectionPromise = this.retryableConnect();

        // Attach an empty handler to allow the promise to run in the background while
        // other startup events happen. It'll eventually be awaited on.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.privConnectionPromise.catch((): void => { });

        if (this.postConnectImplOverride !== undefined) {
            return this.postConnectImplOverride(this.privConnectionPromise);
        }

        return this.privConnectionPromise;
    }

    protected configConnectionOverride: (connection: IConnection) => Promise<IConnection> = undefined;

    protected sendSpeechServiceConfig(connection: IConnection, requestSession: RequestSession, SpeechServiceConfigJson: string): Promise<void> {
        requestSession.onSpeechContext();
        // filter out anything that is not required for the service to work.
        if (ServiceRecognizerBase.telemetryDataEnabled !== true) {
            const withTelemetry: { context: { system: string } } = JSON.parse(SpeechServiceConfigJson) as { context: { system: string } };

            const replacement: any = {
                context: {
                    system: withTelemetry.context.system,
                },
            };

            SpeechServiceConfigJson = JSON.stringify(replacement);
        }

        if (this.privRecognizerConfig.parameters.getProperty("TranscriptionService_SingleChannel", "false").toLowerCase() === "true") {
            const json: { context: { DisableReferenceChannel: string; MicSpec: string } } = JSON.parse(SpeechServiceConfigJson) as { context: { DisableReferenceChannel: string; MicSpec: string } };
            json.context.DisableReferenceChannel = "True";
            json.context.MicSpec = "1_0_0";
            SpeechServiceConfigJson = JSON.stringify(json);
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

    protected async fetchConnection(): Promise<IConnection> {
        if (this.privConnectionConfigurationPromise !== undefined) {
            return this.privConnectionConfigurationPromise.then((connection: IConnection): Promise<IConnection> => {
                if (connection.state() === ConnectionState.Disconnected) {
                    this.privConnectionId = null;
                    this.privConnectionConfigurationPromise = undefined;
                    this.privServiceHasSentMessage = false;
                    return this.fetchConnection();
                }
                return this.privConnectionConfigurationPromise;
            }, (): Promise<IConnection> => {
                this.privConnectionId = null;
                this.privConnectionConfigurationPromise = undefined;
                this.privServiceHasSentMessage = false;
                return this.fetchConnection();
            });
        }

        this.privConnectionConfigurationPromise = this.configureConnection();
        return await this.privConnectionConfigurationPromise;
    }

    protected async sendAudio(audioStreamNode: IAudioStreamNode): Promise<void> {
        const audioFormat: AudioStreamFormatImpl = await this.audioSource.format;

        // The time we last sent data to the service.
        let nextSendTime: number = Date.now();

        // Max amount to send before we start to throttle
        const fastLaneSizeMs: string = this.privRecognizerConfig.parameters.getProperty("SPEECH-TransmitLengthBeforThrottleMs", "5000");
        const maxSendUnthrottledBytes: number = audioFormat.avgBytesPerSec / 1000 * parseInt(fastLaneSizeMs, 10);
        const startRecogNumber: number = this.privRequestSession.recogNumber;

        const readAndUploadCycle = async (): Promise<void> => {
            // If speech is done, stop sending audio.
            if (!this.privIsDisposed &&
                !this.privRequestSession.isSpeechEnded &&
                this.privRequestSession.isRecognizing &&
                this.privRequestSession.recogNumber === startRecogNumber) {

                const connection: IConnection = await this.fetchConnection();
                const audioStreamChunk: IStreamChunk<ArrayBuffer> = await audioStreamNode.read();
                // we have a new audio chunk to upload.
                if (this.privRequestSession.isSpeechEnded) {
                    // If service already recognized audio end then don't send any more audio
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

                if (0 !== sendDelay) {
                    await this.delay(sendDelay);
                }

                if (payload !== null) {
                    nextSendTime = Date.now() + (payload.byteLength * 1000 / (audioFormat.avgBytesPerSec * 2));
                }

                // Are we still alive?
                if (!this.privIsDisposed &&
                    !this.privRequestSession.isSpeechEnded &&
                    this.privRequestSession.isRecognizing &&
                    this.privRequestSession.recogNumber === startRecogNumber) {
                    connection.send(
                        new SpeechConnectionMessage(MessageType.Binary, "audio", this.privRequestSession.requestId, null, payload)
                    ).catch((): void => {
                        // eslint-disable-next-line @typescript-eslint/no-empty-function
                        this.privRequestSession.onServiceTurnEndResponse(this.privRecognizerConfig.isContinuousRecognition).catch((): void => { });
                    });

                    if (!audioStreamChunk?.isEnd) {
                        // this.writeBufferToConsole(payload);
                        // Regardless of success or failure, schedule the next upload.
                        // If the underlying connection was broken, the next cycle will
                        // get a new connection and re-transmit missing audio automatically.
                        return readAndUploadCycle();
                    } else {
                        // the audio stream has been closed, no need to schedule next
                        // read-upload cycle.
                        if (!this.privIsLiveAudio) {
                            this.privRequestSession.onSpeechEnded();
                        }
                    }
                }
            }
        };

        return readAndUploadCycle();
    }

    private async retryableConnect(): Promise<IConnection> {
        let isUnAuthorized: boolean = false;

        this.privAuthFetchEventId = createNoDashGuid();
        const sessionId: string = this.privRequestSession.sessionId;
        this.privConnectionId = (sessionId !== undefined) ? sessionId : createNoDashGuid();

        this.privRequestSession.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);
        let lastStatusCode: number = 0;
        let lastReason: string = "";

        while (this.privRequestSession.numConnectionAttempts <= this.privRecognizerConfig.maxRetryCount) {

            // Get the auth information for the connection. This is a bit of overkill for the current API surface, but leaving the plumbing in place to be able to raise a developer-customer
            // facing event when a connection fails to let them try and provide new auth information.
            const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);
            const auth: AuthInfo = await authPromise;

            await this.privRequestSession.onAuthCompleted(false);

            // Create the connection
            const connection: IConnection = this.privConnectionFactory.create(this.privRecognizerConfig, auth, this.privConnectionId);
            // Attach the telemetry handlers.
            this.privRequestSession.listenForServiceTelemetry(connection.events);

            // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
            // it'll stop sending events.
            connection.events.attach((event: ConnectionEvent): void => {
                this.connectionEvents.onEvent(event);
            });

            const response: ConnectionOpenResponse = await connection.open();
            // 200 == everything is fine.
            if (response.statusCode === 200) {
                await this.privRequestSession.onConnectionEstablishCompleted(response.statusCode);
                return Promise.resolve(connection);
            } else if (response.statusCode === 1006) {
                isUnAuthorized = true;
            }

            lastStatusCode = response.statusCode;
            lastReason = response.reason;

            this.privRequestSession.onRetryConnection();
        }

        await this.privRequestSession.onConnectionEstablishCompleted(lastStatusCode, lastReason);
        return Promise.reject(`Unable to contact server. StatusCode: ${lastStatusCode}, ${this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${lastReason}`);
    }

    private delay(delayMs: number): Promise<void> {
        return new Promise((resolve: () => void): number => this.privSetTimeout(resolve, delayMs));
    }

    private writeBufferToConsole(buffer: ArrayBuffer): void {
        let out: string = "Buffer Size: ";
        if (null === buffer) {
            out += "null";
        } else {
            const readView: Uint8Array = new Uint8Array(buffer);
            out += `${buffer.byteLength}\r\n`;
            for (let i: number = 0; i < buffer.byteLength; i++) {
                out += readView[i].toString(16).padStart(2, "0") + " ";
                if (((i + 1) % 16) === 0) {
                    // eslint-disable-next-line no-console
                    console.info(out);
                    out = "";
                }
            }
        }
        // eslint-disable-next-line no-console
        console.info(out);
    }

    private async sendFinalAudio(): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        await connection.send(new SpeechConnectionMessage(MessageType.Binary, "audio", this.privRequestSession.requestId, null, null));
        return;
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private async configureConnection(): Promise<IConnection> {
        const connection: IConnection = await this.connectImpl();
        if (this.configConnectionOverride !== undefined) {
            return this.configConnectionOverride(connection);
        }
        await this.sendSpeechServiceConfig(connection, this.privRequestSession, this.privRecognizerConfig.SpeechServiceConfig.serialize());
        await this.sendPrePayloadJSON(connection, false);
        return connection;
    }
}
