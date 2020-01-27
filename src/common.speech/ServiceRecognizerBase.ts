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
    Promise,
    PromiseHelper,
    PromiseResult,
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
    protected privRequestSession: RequestSession;
    protected privConnectionId: string;
    protected privRecognizerConfig: RecognizerConfig;
    protected privRecognizer: Recognizer;

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

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        this.privIsDisposed = true;
        if (this.privConnectionConfigurationPromise) {
            this.privConnectionConfigurationPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose(reason);
            });
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

    public recognize(
        recoMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void,
    ): Promise<boolean> {

        if (this.recognizeOverride !== undefined) {
            return this.recognizeOverride(recoMode, successCallback, errorCallBack);
        }

        // Clear the existing configuration promise to force a re-transmission of config and context.
        this.privConnectionConfigurationPromise = null;
        this.privRecognizerConfig.recognitionMode = recoMode;

        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privAudioSource.events);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        this.connectImpl();

        return this.audioSource
            .attach(this.privRequestSession.audioNodeId)
            .continueWithPromise<boolean>((result: PromiseResult<IAudioStreamNode>) => {
                let audioNode: ReplayableAudioNode;

                if (result.isError) {
                    this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, result.error, successCallback);
                    return PromiseHelper.fromError<boolean>(result.error);
                } else {
                    audioNode = new ReplayableAudioNode(result.result, this.audioSource.format as AudioStreamFormatImpl);
                    this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);
                }

                return this.audioSource.deviceInfo.onSuccessContinueWithPromise<boolean>((deviceInfo: ISpeechConfigAudioDevice): Promise<boolean> => {
                    this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

                    return this.configureConnection()
                        .on((_: IConnection) => {
                            const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);

                            if (!!this.privRecognizer.sessionStarted) {
                                this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
                            }

                            const messageRetrievalPromise = this.receiveMessage(successCallback, errorCallBack);
                            const audioSendPromise = this.sendAudio(audioNode);

                            /* tslint:disable:no-empty */
                            audioSendPromise.on((_: boolean) => { }, (error: string) => {
                                this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error, successCallback);
                            });

                            const completionPromise = PromiseHelper.whenAll([messageRetrievalPromise, audioSendPromise]);

                            return completionPromise.on((r: boolean) => {
                                return true;
                            }, (error: string) => {
                                this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.RuntimeError, error, successCallback);
                            });

                        }, (error: string) => {
                            this.cancelRecognitionLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error, successCallback);
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

    public stopRecognizing(): void {
        if (this.privRequestSession.isRecognizing) {
            this.privRequestSession.onStopRecognizing();
            this.sendTelemetryData();
            this.audioSource.turnOff();
            this.sendFinalAudio();
            this.privRequestSession.dispose();
        }
    }

    public connect(): void {
        this.connectImpl().result();
    }

    protected disconnectOverride: () => any = undefined;

    public disconnect(): void {
        if (this.disconnectOverride !== undefined) {
            this.disconnectOverride();
            return;
        }

        this.cancelRecognitionLocal(CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting",
            undefined);

        if (this.privConnectionPromise.result().isCompleted) {
            if (!this.privConnectionPromise.result().isError) {
                this.privConnectionPromise.result().result.dispose();
                this.privConnectionPromise = null;
            }
        } else {
            this.privConnectionPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose();
            });
        }
    }

    // Called when telemetry data is sent to the service.
    // Used for testing Telemetry capture.
    public static telemetryData: (json: string) => void;
    public static telemetryDataEnabled: boolean = true;

    public sendMessage(message: string): void { }

    protected abstract processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void): boolean;

    protected sendTelemetryData = () => {
        const telemetryData = this.privRequestSession.getTelemetry();
        // console.warn("Telem: " + telemetryData);
        if (ServiceRecognizerBase.telemetryDataEnabled !== true ||
            this.privIsDisposed ||
            null === telemetryData) {
            return PromiseHelper.fromResult(true);
        }

        if (!!ServiceRecognizerBase.telemetryData) {
            try {
                ServiceRecognizerBase.telemetryData(telemetryData);
                /* tslint:disable:no-empty */
            } catch { }
        }

        return this.fetchConnection().onSuccessContinueWith((connection: IConnection): Promise<boolean> => {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "telemetry",
                this.privRequestSession.requestId,
                "application/json",
                telemetryData));
        });
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

    protected receiveMessageOverride: (sc?: (e: SpeechRecognitionResult) => void, ec?: (e: string) => void) => any = undefined;

    protected receiveMessage = (
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallBack: (e: string) => void,
    ): Promise<IConnection> => {
        return this.fetchConnection().on((connection: IConnection): Promise<IConnection> => {
            return connection.read()
                .onSuccessContinueWithPromise((message: ConnectionMessage) => {
                    if (this.receiveMessageOverride !== undefined) {
                        return this.receiveMessageOverride();
                    }
                    if (this.privIsDisposed || !this.privRequestSession.isRecognizing) {
                        // We're done.
                        return PromiseHelper.fromResult(undefined);
                    }

                    // indicates we are draining the queue and it came with no message;
                    if (!message) {
                        if (!this.privRequestSession.isRecognizing) {
                            return PromiseHelper.fromResult(true);
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
                                    this.cancelRecognitionLocal(CancellationReason.EndOfStream, CancellationErrorCode.NoError, undefined, successCallback);
                                }

                                const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                                this.privRequestSession.onServiceTurnEndResponse(this.privRecognizerConfig.isContinuousRecognition);

                                if (!this.privRecognizerConfig.isContinuousRecognition || this.privRequestSession.isSpeechEnded) {
                                    if (!!this.privRecognizer.sessionStopped) {
                                        this.privRecognizer.sessionStopped(this.privRecognizer, sessionStopEventArgs);
                                    }

                                    return PromiseHelper.fromResult(true);
                                } else {
                                    this.fetchConnection().onSuccessContinueWith((connection: IConnection) => {
                                        this.sendSpeechContext(connection);
                                        this.sendWaveHeader(connection);
                                    });
                                }
                                break;

                            default:

                                if (!this.processTypeSpecificMessages(
                                    connectionMessage,
                                    successCallback,
                                    errorCallBack)) {
                                    // here are some messages that the derived class has not processed, dispatch them to connect class
                                    if (!!this.privServiceEvents) {
                                        this.serviceEvents.onEvent(new ServiceEvent(connectionMessage.path.toLowerCase(), connectionMessage.textBody));
                                    }
                                }

                        }
                    }

                    return this.receiveMessage(successCallback, errorCallBack);
                });
        }, (error: string) => {
        });
    }

    protected sendSpeechContext = (connection: IConnection): Promise<boolean> => {
        const speechContextJson = this.speechContext.toJSON();

        if (speechContextJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.context",
                this.privRequestSession.requestId,
                "application/json",
                speechContextJson));
        }
        return PromiseHelper.fromResult(true);
    }

    protected sendWaveHeader(connection: IConnection): Promise<boolean> {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Binary,
            "audio",
            this.privRequestSession.requestId,
            null,
            this.audioSource.format.header
        ));
    }

    protected connectImplOverride: (isUnAuthorized: boolean) => any = undefined;

    // Establishes a websocket connection to the end point.
    protected connectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {

        if (this.connectImplOverride !== undefined) {
            return this.connectImplOverride(isUnAuthorized);
        }

        if (this.privConnectionPromise) {
            if (this.privConnectionPromise.result().isCompleted &&
                (this.privConnectionPromise.result().isError
                    || this.privConnectionPromise.result().result.state() === ConnectionState.Disconnected)) {
                this.privConnectionId = null;
                this.privConnectionPromise = null;
                return this.connectImpl();
            } else {
                return this.privConnectionPromise;
            }
        }

        this.privAuthFetchEventId = createNoDashGuid();
        this.privConnectionId = createNoDashGuid();

        this.privRequestSession.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);

        this.privConnectionPromise = authPromise
            .continueWithPromise((result: PromiseResult<AuthInfo>) => {
                if (result.isError) {
                    this.privRequestSession.onAuthCompleted(true, result.error);
                    throw new Error(result.error);
                } else {
                    this.privRequestSession.onAuthCompleted(false);
                }

                const connection: IConnection = this.privConnectionFactory.create(this.privRecognizerConfig, result.result, this.privConnectionId);

                this.privRequestSession.listenForServiceTelemetry(connection.events);

                // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
                // it'll stop sending events.
                connection.events.attach((event: ConnectionEvent) => {
                    this.connectionEvents.onEvent(event);
                });

                return connection.open().onSuccessContinueWithPromise((response: ConnectionOpenResponse): Promise<IConnection> => {
                    if (response.statusCode === 200) {
                        this.privRequestSession.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);
                        this.privRequestSession.onConnectionEstablishCompleted(response.statusCode);

                        return PromiseHelper.fromResult<IConnection>(connection);
                    } else if (response.statusCode === 403 && !isUnAuthorized) {
                        return this.connectImpl(true);
                    } else {
                        this.privRequestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                        return PromiseHelper.fromError<IConnection>(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
                    }
                });
            });

        return this.privConnectionPromise;
    }

    protected configConnectionOverride: () => any = undefined;

    protected fetchConnectionOverride: () => any = undefined;

    protected sendSpeechServiceConfig = (connection: IConnection, requestSession: RequestSession, SpeechServiceConfigJson: string): Promise<boolean> => {
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

        if (SpeechServiceConfigJson) { // && this.privConnectionId !== this.privSpeechServiceConfigConnectionId) {
          //  this.privSpeechServiceConfigConnectionId = this.privConnectionId;
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.config",
                requestSession.requestId,
                "application/json",
                SpeechServiceConfigJson));
        }

        return PromiseHelper.fromResult(true);
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

        const audioFormat: AudioStreamFormatImpl = this.privAudioSource.format as AudioStreamFormatImpl;

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
                this.fetchConnection().on((connection: IConnection) => {
                    audioStreamNode.read().on(
                        (audioStreamChunk: IStreamChunk<ArrayBuffer>) => {
                            // we have a new audio chunk to upload.
                            if (this.privRequestSession.isSpeechEnded) {
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

                                const uploaded: Promise<boolean> = connection.send(
                                    new SpeechConnectionMessage(
                                        MessageType.Binary, "audio", this.privRequestSession.requestId, null, payload));

                                if (!audioStreamChunk.isEnd) {
                                    uploaded.continueWith((_: PromiseResult<boolean>) => {
                                        // this.writeBufferToConsole(payload);
                                        // Regardless of success or failure, schedule the next upload.
                                        // If the underlying connection was broken, the next cycle will
                                        // get a new connection and re-transmit missing audio automatically.
                                        readAndUploadCycle();
                                    });
                                } else {
                                    // the audio stream has been closed, no need to schedule next
                                    // read-upload cycle.
                                    this.privRequestSession.onSpeechEnded();
                                    deferred.resolve(true);
                                }
                            }, sendDelay);
                        },
                        (error: string) => {
                            if (this.privRequestSession.isSpeechEnded) {
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

    private writeBufferToConsole(buffer: ArrayBuffer): void {
        let out: string = "Buffer Size: ";
        if (null === buffer) {
            out += "null";
        } else {
            const readView: Uint8Array = new Uint8Array(buffer);
            out += buffer.byteLength + "\r\n";
            for (let i: number = 0; i < buffer.byteLength; i++) {
                out += readView[i] + " ";
            }
        }
        // tslint:disable-next-line:no-console
        console.info(out);
    }

    private sendFinalAudio(): Promise<boolean> {
        const deferred = new Deferred<boolean>();

        this.fetchConnection().on((connection: IConnection) => {
            connection.send(new SpeechConnectionMessage(MessageType.Binary, "audio", this.privRequestSession.requestId, null, null)).on((_: boolean) => {
                deferred.resolve(true);
            }, (error: string) => {
                deferred.reject(error);
            });
        }, (error: string) => {
            deferred.reject(error);
        });

        return deferred.promise();
    }

    private fetchConnection = (): Promise<IConnection> => {
        if (this.fetchConnectionOverride !== undefined) {
            return this.fetchConnectionOverride();
        }

        return this.configureConnection();
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private configureConnection(): Promise<IConnection> {
        if (this.configConnectionOverride !== undefined) {
            return this.configConnectionOverride();
        }

        if (this.privConnectionConfigurationPromise) {
            if (this.privConnectionConfigurationPromise.result().isCompleted &&
                (this.privConnectionConfigurationPromise.result().isError
                    || this.privConnectionConfigurationPromise.result().result.state() === ConnectionState.Disconnected)) {

                this.privConnectionConfigurationPromise = null;
                return this.configureConnection();
            } else {
                return this.privConnectionConfigurationPromise;
            }
        }

        this.privConnectionConfigurationPromise = this.connectImpl().onSuccessContinueWithPromise((connection: IConnection): Promise<IConnection> => {
            return this.sendSpeechServiceConfig(connection, this.privRequestSession, this.privRecognizerConfig.SpeechServiceConfig.serialize())
                .onSuccessContinueWithPromise((_: boolean) => {
                    return this.sendSpeechContext(connection).onSuccessContinueWithPromise((_: boolean) => {
                        return this.sendWaveHeader(connection).onSuccessContinueWith((_: boolean) => {
                            return connection;
                        });
                    });
                });
        });

        return this.privConnectionConfigurationPromise;
    }
}
