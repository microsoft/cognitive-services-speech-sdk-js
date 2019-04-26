// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import {
    ArgumentNullError,
    ConnectionEvent,
    ConnectionState,
    createNoDashGuid,
    Deferred,
    EventSource,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    IDisposable,
    IStreamChunk,
    MessageType
} from "../common/Exports";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";
import {
    CancellationErrorCode,
    CancellationReason,
    PropertyId,
    RecognitionEventArgs,
    Recognizer,
    SessionEventArgs,
    SpeechRecognitionResult
} from "../sdk/Exports";
import {
    DynamicGrammarBuilder,
    ISpeechConfigAudioDevice,
    RecognitionMode,
    RequestSession,
    SpeechContext,
    SpeechDetected
} from "./Exports";
import { AuthInfo, IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export abstract class ServiceRecognizerBase implements IDisposable {
    private privAuthentication: IAuthentication;
    private privConnectionFactory: IConnectionFactory;
    private privAudioSource: IAudioSource;

    // A promise for a configured connection.
    // Do not consume directly, call fethConnection instead.
    private privConnectionConfigurationPromise: Promise<IConnection>;
    private privConfiguredConnection: IConnection;

    // A promise for a connection, but one that has not had the speech context sent yet.
    // Do no consume directly, call fetchConnection instead.
    private privConnectionPromise: Promise<IConnection>;
    private privConnection: IConnection;

    private privConnectionId: string;
    private privAuthFetchEventId: string;
    private privIsDisposed: boolean;
    private privRecognizer: Recognizer;
    private privMustReportEndOfStream: boolean;
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privSpeechContext: SpeechContext;
    private privDynamicGrammar: DynamicGrammarBuilder;
    protected privRequestSession: RequestSession;
    protected privRecognizerConfig: RecognizerConfig;

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
        this.privDynamicGrammar = new DynamicGrammarBuilder();
        this.privSpeechContext = new SpeechContext(this.privDynamicGrammar);
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

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        this.privIsDisposed = true;
        if (this.privConnectionConfigurationPromise) {
            this.privConnectionConfigurationPromise.then((connection: IConnection) => {
                connection.dispose(reason);
            });
        }
    }

    public get connectionEvents(): EventSource<ConnectionEvent> {
        return this.privConnectionEvents;
    }

    public get recognitionMode(): RecognitionMode {
        return this.privRecognizerConfig.recognitionMode;
    }

    public async recognize(
        recoMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void,
    ): Promise<boolean> {
        // Clear the existing configuration promise to force a re-transmission of config and context.
        this.privConnectionConfigurationPromise = null;
        this.privRecognizerConfig.recognitionMode = recoMode;

        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privAudioSource.events);

        try {
            const audioStreamNode = await this.audioSource.attach(this.privRequestSession.audioNodeId);
            const audioNode = new ReplayableAudioNode(audioStreamNode, (this.audioSource.format as AudioStreamFormatImpl));

            this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);

            return this.audioSource.deviceInfo.then(async (deviceInfo: ISpeechConfigAudioDevice) => {
                this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };
                try {
                    await this.configureConnection();
                    if (!!this.privRecognizer.sessionStarted) {
                        const sessionStartEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                        this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
                    }
                    const messageRetrievalPromise = this.receiveMessage(successCallback, errorCallBack);
                    const audioSendPromise = this.sendAudio(audioNode);
                    try {
                        await Promise.all([messageRetrievalPromise, audioSendPromise]);
                    } catch (error) {
                        this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error, successCallback);
                    }
                } catch (error1) {
                    this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error1, successCallback);
                }
                try {
                    await this.privRequestSession.completionPromise;
                } catch (error2) {
                    this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error2, successCallback);
                }
                return Promise.resolve(true);
            });
        } catch (error3) {
            this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error3, successCallback);
            return Promise.reject(error3);
        }
    }

    public stopRecognizing(): void {
        if (this.privRequestSession.isRecognizing) {
            this.privRequestSession.onStopRecognizing();
            this.sendTelemetryData();
            this.audioSource.turnOff();
            this.sendFinalAudio();
            this.privRequestSession.dispose();
        }
    }

    public async connect(): Promise<void> {
        await this.connectImpl();
    }

    public async disconnect(): Promise<void> {
        this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.NoError, "Disconnecting", undefined);

        try {
            const connection = await this.privConnectionPromise;
            connection.dispose();
            // tslint:disable-next-line: no-empty
        } catch { }
    }

    // Called when telemetry data is sent to the service.
    // Used for testing Telemetry capture.
    public static telemetryData: (json: string) => void;
    public static telemetryDataEnabled: boolean = true;

    protected abstract processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void): void;

    protected sendTelemetryData = async (): Promise<boolean> => {
        const telemetryData = this.privRequestSession.getTelemetry();
        // console.warn("Telem: " + telemetryData);
        if (ServiceRecognizerBase.telemetryDataEnabled !== true ||
            this.privIsDisposed ||
            null === telemetryData) {
            return Promise.resolve(true);
        }

        if (!!ServiceRecognizerBase.telemetryData) {
            try {
                ServiceRecognizerBase.telemetryData(telemetryData);
                /* tslint:disable:no-empty */
            } catch { }
        }

        const connection = await this.fetchConnection();
        return connection.send(new SpeechConnectionMessage(MessageType.Text, "telemetry", this.privRequestSession.requestId, "application/json", telemetryData));
    }

    // Cancels recognition.
    protected abstract cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string,
        cancelRecoCallback: (r: SpeechRecognitionResult) => void): void;

    // Cancels recognition.
    protected cancelRecognitionLocal(
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string,
        cancelRecoCallback: (r: SpeechRecognitionResult) => void): void {

        if (!!this.privRequestSession.isRecognizing) {
            this.privRequestSession.onStopRecognizing();
            this.sendTelemetryData();

            this.cancelRecognition(
                this.privRequestSession.sessionId,
                this.privRequestSession.requestId,
                cancellationReason,
                errorCode,
                error,
                cancelRecoCallback);
        }
    }

    private fetchConnection = (): Promise<IConnection> => {
        return this.configureConnection();
    }

    // Establishes a websocket connection to the end point.
    private async connectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {
        if (this.privConnectionPromise && (!this.privConnection || this.privConnection.state() !== ConnectionState.Disconnected)) {
            return this.privConnectionPromise;
        }

        this.privConnection = undefined;
        this.privAuthFetchEventId = createNoDashGuid();
        this.privConnectionId = createNoDashGuid();

        this.privRequestSession.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);

        this.privConnectionPromise = authPromise.then(async (authInfo: AuthInfo) => {
            this.privRequestSession.onAuthCompleted(false);

            const connection: IConnection = this.privConnectionFactory.create(this.privRecognizerConfig, authInfo, this.privConnectionId);

            this.privRequestSession.listenForServiceTelemetry(connection.events);

            // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
            // it'll stop sending events.
            connection.events.attach((event: ConnectionEvent) => {
                this.connectionEvents.onEvent(event);
            });

            const response = await connection.open();

            if (response.statusCode === 200) {
                this.privRequestSession.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);
                this.privRequestSession.onConnectionEstablishCompleted(response.statusCode);
                this.privConnection = connection;

                return Promise.resolve(connection);
            } else if (response.statusCode === 403 && !isUnAuthorized) {
                return this.connectImpl(true);
            } else {
                this.privRequestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                return Promise.reject(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
            }
        }, (error: string) => {
            this.privRequestSession.onAuthCompleted(true, error);
            throw new Error(error);
        });

        return this.privConnectionPromise;
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private async configureConnection(): Promise<IConnection> {
        if (this.privConnectionConfigurationPromise && (!this.privConfiguredConnection || this.privConfiguredConnection.state() !== ConnectionState.Disconnected)) {
            return this.privConnectionConfigurationPromise;
        }

        this.privConfiguredConnection = undefined;

        this.privConnectionConfigurationPromise = this.connectImpl().then(async (connection: IConnection): Promise<IConnection> => {
            await this.sendSpeechServiceConfig(connection, this.privRecognizerConfig.SpeechServiceConfig.serialize());
            await this.sendSpeechContext(connection);
            this.privConfiguredConnection = connection;
            return connection;
        });

        return this.privConnectionConfigurationPromise;
    }

    private receiveMessage = async (
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void,
    ): Promise<IConnection> => {
        try {
            const connection = await this.fetchConnection();
            const message = await connection.read();
            if (this.privIsDisposed || !this.privRequestSession.isRecognizing) {
                // We're done.
                return Promise.resolve(undefined);
            }
            // indicates we are draining the queue and it came with no message;
            if (!message) {
                if (!this.privRequestSession.isRecognizing) {
                    return Promise.resolve(connection);
                } else {
                    return this.receiveMessage(successCallback, errorCallBack);
                }
            }
            const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);
            if (connectionMessage.requestId.toLowerCase() === this.privRequestSession.requestId.toLowerCase()) {
                switch (connectionMessage.path.toLowerCase()) {
                    case "turn.start":
                        this.privMustReportEndOfStream = true;
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
                        this.sendTelemetryData();
                        if (this.privRequestSession.isSpeechEnded && this.privMustReportEndOfStream) {
                            this.privMustReportEndOfStream = false;
                            this.cancelRecognitionLocal(CancellationReason.EndOfStream, CancellationErrorCode.NoError, undefined, successCallback);
                        }
                        const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                        this.privRequestSession.onServiceTurnEndResponse(this.privRecognizerConfig.isContinuousRecognition);
                        if (!this.privRecognizerConfig.isContinuousRecognition || this.privRequestSession.isSpeechEnded) {
                            if (!!this.privRecognizer.sessionStopped) {
                                this.privRecognizer.sessionStopped(this.privRecognizer, sessionStopEventArgs);
                            }
                            return Promise.resolve(connection);
                        } else {
                            this.fetchConnection().then((connection1: IConnection) => this.sendSpeechContext(connection1));
                        }
                    default:
                        this.processTypeSpecificMessages(connectionMessage, successCallback, errorCallBack);
                }
            }
            return this.receiveMessage(successCallback, errorCallBack);
        } catch (error) { }
    }

    private sendSpeechServiceConfig = async (connection: IConnection, speechServiceConfigJson: string): Promise<boolean> => {
        // filter out anything that is not required for the service to work.
        if (ServiceRecognizerBase.telemetryDataEnabled !== true) {
            const withTelemetry = JSON.parse(speechServiceConfigJson);

            const replacement: any = {
                context: {
                    system: withTelemetry.context.system
                }
            };

            speechServiceConfigJson = JSON.stringify(replacement);
        }

        if (speechServiceConfigJson) { // && this.privConnectionId !== this.privSpeechServiceConfigConnectionId) {
            return connection.send(new SpeechConnectionMessage(MessageType.Text, "speech.config", this.privRequestSession.requestId, "application/json", speechServiceConfigJson));
        }

        return Promise.resolve(true);
    }

    private sendSpeechContext = async (connection: IConnection): Promise<boolean> => {
        const speechContextJson = this.speechContext.toJSON();

        if (speechContextJson) {
            return connection.send(new SpeechConnectionMessage(MessageType.Text, "speech.context", this.privRequestSession.requestId, "application/json", speechContextJson));
        }

        return Promise.resolve(true);
    }

    private async sendFinalAudio(): Promise<boolean> {
        const connection = await this.fetchConnection();

        return connection.send(new SpeechConnectionMessage(MessageType.Binary, "audio", this.privRequestSession.requestId, null, null));
    }

    private sendAudio = (audioStreamNode: IAudioStreamNode): Promise<void> => {
        // NOTE: Home-baked promises crash ios safari during the invocation
        // of the error callback chain (looks like the recursion is way too deep, and
        // it blows up the stack). The following construct is a stop-gap that does not
        // bubble the error up the callback chain and hence circumvents this problem.
        // TODO: rewrite with ES6 promises.
        const deferred = new Deferred<void>();

        // The time we last sent data to the service.
        let lastSendTime: number = Date.now();

        const audioFormat: AudioStreamFormatImpl = this.privAudioSource.format as AudioStreamFormatImpl;

        const readAndUploadCycle = () => {
            // If speech is done, stop sending audio.
            if (!this.privIsDisposed && !this.privRequestSession.isSpeechEnded && this.privRequestSession.isRecognizing) {
                this.fetchConnection().then((connection: IConnection) => {
                    audioStreamNode.read().then(async (audioStreamChunk: IStreamChunk<ArrayBuffer>) => {
                        // we have a new audio chunk to upload.
                        if (this.privRequestSession.isSpeechEnded) {
                            // If service already recognized audio end then dont send any more audio
                            deferred.resolve();
                            return;
                        }

                        const payload = (audioStreamChunk.isEnd) ? null : audioStreamChunk.buffer;
                        const uploaded = connection.send(
                            new SpeechConnectionMessage(MessageType.Binary, "audio", this.privRequestSession.requestId, null, payload));

                        if (!audioStreamChunk.isEnd) {
                            // Caculate any delay to the audio stream needed. /2 to allow 2x real time transmit rate max.
                            const minSendTime = ((payload.byteLength / audioFormat.avgBytesPerSec) / 2) * 1000;
                            const delay = Math.max(0, (lastSendTime - Date.now() + minSendTime));

                            try {
                                await uploaded;
                            } finally {
                                // Regardless of success or failure, schedule the next upload.
                                // If the underlying connection was broken, the next cycle will
                                // get a new connection and re-transmit missing audio automatically.
                                setTimeout(() => {
                                    lastSendTime = Date.now();
                                    readAndUploadCycle();
                                }, delay);
                            }
                        } else {
                            // the audio stream has been closed, no need to schedule next read-upload cycle.
                            this.privRequestSession.onSpeechEnded();
                            deferred.resolve();
                        }
                    }, (error: string) => {
                        if (this.privRequestSession.isSpeechEnded) {
                            // For whatever reason, Reject is used to remove queue subscribers inside
                            // the Queue.DrainAndDispose invoked from DetachAudioNode down below, which
                            // means that sometimes things can be rejected in normal circumstances, without
                            // any errors.
                            deferred.resolve();
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
    }
}
