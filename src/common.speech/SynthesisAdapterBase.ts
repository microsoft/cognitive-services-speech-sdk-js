// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    ConnectionClosedEvent,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionOpenResponse,
    ConnectionState,
    createNoDashGuid,
    EventSource,
    IAudioDestination,
    IConnection,
    IDisposable,
    MessageType,
    Promise,
    PromiseHelper,
    PromiseResult,
    ServiceEvent,
} from "../common/Exports";
import {AudioOutputFormatImpl} from "../sdk/Audio/AudioOutputFormat";
import {
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechSynthesisEventArgs,
    SpeechSynthesisResult,
    SpeechSynthesisWordBoundaryEventArgs,
    SpeechSynthesizer,
} from "../sdk/Exports";
import {Callback} from "../sdk/Transcription/IConversation";
import {
    AgentConfig,
    CancellationErrorCodePropertyName,
    DynamicGrammarBuilder,
    RequestSession,
    SpeechContext,
    SynthesisAudioMetadata,
    SynthesisTurn,
} from "./Exports";
import {AuthInfo, IAuthentication} from "./IAuthentication";
import {ISynthesisConnectionFactory} from "./ISynthesisConnectionFactory";
import {SpeechConnectionMessage} from "./SpeechConnectionMessage.Internal";
import {SynthesizerConfig} from "./SynthesizerConfig";

export class SynthesisAdapterBase implements IDisposable {
    protected privRequestSession: RequestSession;
    protected privSynthesisTurn: SynthesisTurn;
    protected privConnectionId: string;
    protected privSynthesizerConfig: SynthesizerConfig;
    protected privSpeechSynthesizer: SpeechSynthesizer;
    protected privSuccessCallback: (e: SpeechSynthesisResult) => void;
    protected privErrorCallback: (e: string) => void;

    public get synthesisContext(): SpeechContext {
        return this.privSpeechContext;
    }

    public get dynamicGrammar(): DynamicGrammarBuilder {
        return this.privDynamicGrammar;
    }

    public get agentConfig(): AgentConfig {
        return this.privAgentConfig;
    }

    public get connectionEvents(): EventSource<ConnectionEvent> {
        return this.privConnectionEvents;
    }

    public get serviceEvents(): EventSource<ServiceEvent> {
        return this.privServiceEvents;
    }

    protected speakOverride: (ssml: string, requestId: string, sc: (e: SpeechSynthesisResult) => void, ec: (e: string) => void) => any = undefined;

    // Called when telemetry data is sent to the service.
    // Used for testing Telemetry capture.
    public static telemetryData: (json: string) => void;
    public static telemetryDataEnabled: boolean = true;

    public set activityTemplate(messagePayload: string) { this.privActivityTemplate = messagePayload; }
    public get activityTemplate(): string { return this.privActivityTemplate; }

    protected receiveMessageOverride: () => any = undefined;

    protected connectImplOverride: (isUnAuthorized: boolean) => any = undefined;

    protected configConnectionOverride: () => any = undefined;

    protected fetchConnectionOverride: () => any = undefined;

    public set audioOutputFormat(format: AudioOutputFormatImpl) {
        this.privAudioOutputFormat = format;
        this.privSynthesisTurn.audioOutputFormat = format;
        if (this.privSessionAudioDestination !== undefined) {
            this.privSessionAudioDestination.format = format;
        }
    }
    private privAuthentication: IAuthentication;
    private privConnectionFactory: ISynthesisConnectionFactory;

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
    private privAudioOutputFormat: AudioOutputFormatImpl;
    private privSessionAudioDestination: IAudioDestination;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig,
        speechSynthesizer: SpeechSynthesizer,
        audioDestination: IAudioDestination) {

        if (!authentication) {
            throw new ArgumentNullError("authentication");
        }

        if (!connectionFactory) {
            throw new ArgumentNullError("connectionFactory");
        }

        if (!synthesizerConfig) {
            throw new ArgumentNullError("synthesizerConfig");
        }

        this.privMustReportEndOfStream = false;
        this.privAuthentication = authentication;
        this.privConnectionFactory = connectionFactory;
        this.privSynthesizerConfig = synthesizerConfig;
        this.privIsDisposed = false;
        this.privSpeechSynthesizer = speechSynthesizer;
        this.privSessionAudioDestination = audioDestination;
        this.privSynthesisTurn = new SynthesisTurn();
        this.privConnectionEvents = new EventSource<ConnectionEvent>();
        this.privServiceEvents = new EventSource<ServiceEvent>();
        this.privDynamicGrammar = new DynamicGrammarBuilder();
        this.privSpeechContext = new SpeechContext(this.privDynamicGrammar);
        this.privAgentConfig = new AgentConfig();

        this.connectionEvents.attach((connectionEvent: ConnectionEvent): void => {
            if (connectionEvent.name === "ConnectionClosedEvent") {
                const connectionClosedEvent = connectionEvent as ConnectionClosedEvent;
                this.cancelSynthesisLocal(CancellationReason.Error,
                    connectionClosedEvent.statusCode === 1007 ? CancellationErrorCode.BadRequestParameters : CancellationErrorCode.ConnectionFailure,
                    connectionClosedEvent.reason + " websocket error code: " + connectionClosedEvent.statusCode);
            }
        });
    }

    public static addHeader(audio: ArrayBuffer, format: AudioOutputFormatImpl): ArrayBuffer {
        if (!format.hasHeader) {
            return audio;
        }
        format.updateHeader(audio.byteLength);
        const tmp = new Uint8Array(audio.byteLength + format.header.byteLength);
        tmp.set(new Uint8Array(format.header), 0);
        tmp.set(new Uint8Array(audio), format.header.byteLength);
        return tmp.buffer;
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        this.privIsDisposed = true;
        if (this.privSessionAudioDestination !== undefined) {
            this.privSessionAudioDestination.close();
        }
        if (this.privConnectionConfigurationPromise) {
            this.privConnectionConfigurationPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose(reason);
            });
        }
    }

    public connect(): void {
        this.connectImpl().result();
    }

    public connectAsync(cb?: Callback, err?: Callback): void {
        this.connectImpl().continueWith((promiseResult: PromiseResult<IConnection>) => {
            try {
                if (promiseResult.isError) {
                    if (!!err) {
                        err(promiseResult.error);
                    }
                } else if (promiseResult.isCompleted) {
                    if (!!cb) {
                        cb();
                    }
                }
            } catch (e) {
                if (!!err) {
                    err(e);
                }
            }
        });
    }

    public Speak(
        text: string,
        isSSML: boolean,
        requestId: string,
        successCallback: (e: SpeechSynthesisResult) => void,
        errorCallBack: (e: string) => void,
        audioDestination: IAudioDestination,
    ): Promise<boolean> {

        let ssml: string;

        if (isSSML) {
            ssml = text;
        } else {
            ssml = SpeechSynthesizer.buildSsml(text, this.privSynthesizerConfig.parameters);
        }

        if (this.speakOverride !== undefined) {
            return this.speakOverride(ssml, requestId, successCallback, errorCallBack);
        }

        this.privSuccessCallback = successCallback;
        this.privErrorCallback = errorCallBack;

        this.privSynthesisTurn.startNewSynthesis(requestId, text, isSSML, audioDestination);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        this.connectImpl();

        return this.fetchConnection().onSuccessContinueWithPromise<boolean>((connection: IConnection) => {
            return this.sendSynthesisContext(connection).continueWithPromise<boolean>((result: PromiseResult<boolean>): Promise<boolean> => {
                if (result.isError) {
                    this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, result.error);
                    return PromiseHelper.fromError(result.error);
                }
                return this.sendSsmlMessage(connection, ssml, requestId).continueWithPromise<boolean>((result: PromiseResult<boolean>): Promise<boolean> => {
                    if (result.isError) {
                        this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, result.error);
                        return PromiseHelper.fromError(result.error);
                    }

                    const synthesisStartEventArgs: SpeechSynthesisEventArgs = new SpeechSynthesisEventArgs(
                        new SpeechSynthesisResult(
                            requestId,
                            ResultReason.SynthesizingAudioStarted,
                        )
                    );

                    if (!!this.privSpeechSynthesizer.synthesisStarted) {
                        this.privSpeechSynthesizer.synthesisStarted(this.privSpeechSynthesizer, synthesisStartEventArgs);
                    }

                    const messageRetrievalPromise = this.receiveMessage();
                    return PromiseHelper.fromResult(true);
                });
            });
        });
    }

    // Cancels synthesis.
    protected cancelSynthesis(
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {
        const properties: PropertyCollection = new PropertyCollection();
        properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);
        const result: SpeechSynthesisResult = new SpeechSynthesisResult(
            requestId,
            ResultReason.Canceled,
            undefined,
            error,
            properties
        );

        if (!!this.privSpeechSynthesizer.SynthesisCanceled) {
            const cancelEvent: SpeechSynthesisEventArgs = new SpeechSynthesisEventArgs(result);
            try {
                this.privSpeechSynthesizer.SynthesisCanceled(this.privSpeechSynthesizer, cancelEvent);
                /* tslint:disable:no-empty */
            } catch { }
        }

        if (!!this.privSuccessCallback) {
            try {
                this.privSuccessCallback(result);
                this.privSuccessCallback = undefined;
                /* tslint:disable:no-empty */
            } catch { }
        }
    }

    // Cancels synthesis.
    protected cancelSynthesisLocal(
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {

        if (!!this.privSynthesisTurn.isSynthesizing) {
            this.privSynthesisTurn.onStopSynthesizing();

            this.cancelSynthesis(
                this.privSynthesisTurn.requestId,
                cancellationReason,
                errorCode,
                error);
        }
    }

    protected processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechSynthesisResult) => void,
        errorCallBack?: (e: string) => void): boolean {
        return true;
    }

    protected receiveMessage = (): Promise<IConnection> => {
        return this.fetchConnection().on((connection: IConnection): Promise<IConnection> => {
            return connection.read()
                .onSuccessContinueWithPromise((message: ConnectionMessage) => {

                    if (this.receiveMessageOverride !== undefined) {
                        return this.receiveMessageOverride();
                    }
                    if (this.privIsDisposed) {
                        // We're done.
                        return PromiseHelper.fromResult(undefined);
                    }

                    // indicates we are draining the queue and it came with no message;
                    if (!message) {
                        if (!this.privSynthesisTurn.isSynthesizing) {
                            return PromiseHelper.fromResult(true);
                        } else {
                            return this.receiveMessage();
                        }
                    }

                    this.privServiceHasSentMessage = true;

                    const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

                    if (connectionMessage.requestId.toLowerCase() === this.privSynthesisTurn.requestId.toLowerCase()) {
                        switch (connectionMessage.path.toLowerCase()) {
                            case "turn.start":
                                this.privMustReportEndOfStream = true;
                                this.privSynthesisTurn.onServiceTurnStartResponse();
                                break;
                            case "response":
                                this.privSynthesisTurn.onServiceResponseMessage(connectionMessage.textBody);
                                break;
                            case "audio":
                                if (this.privSynthesisTurn.streamId.toLowerCase() === connectionMessage.streamId.toLowerCase()
                                && !!connectionMessage.binaryBody) {
                                    this.privSynthesisTurn.onAudioChunkReceived(connectionMessage.binaryBody);
                                    if (!!this.privSpeechSynthesizer.synthesizing) {
                                        try {
                                            const audioWithHeader = SynthesisAdapterBase.addHeader(connectionMessage.binaryBody, this.privSynthesisTurn.audioOutputFormat);
                                            const ev: SpeechSynthesisEventArgs = new SpeechSynthesisEventArgs(
                                                new SpeechSynthesisResult(
                                                    this.privSynthesisTurn.requestId,
                                                    ResultReason.SynthesizingAudio,
                                                    audioWithHeader));
                                            this.privSpeechSynthesizer.synthesizing(this.privSpeechSynthesizer, ev);
                                        } catch (error) {
                                            // Not going to let errors in the event handler
                                            // trip things up.
                                        }
                                    }
                                    if (this.privSessionAudioDestination !== undefined) {
                                        this.privSessionAudioDestination.write(connectionMessage.binaryBody);
                                    }
                                }
                                break;
                            case "audio.metadata":
                                const metadataList = SynthesisAudioMetadata.fromJSON(connectionMessage.textBody).Metadata;
                                for (const metadata of metadataList) {
                                    if (metadata.Type.toLowerCase() === "WordBoundary".toLowerCase()) {

                                        this.privSynthesisTurn.onWordBoundaryEvent(metadata.Data.text.Text);

                                        const ev: SpeechSynthesisWordBoundaryEventArgs = new SpeechSynthesisWordBoundaryEventArgs(
                                            metadata.Data.Offset,
                                            metadata.Data.text.Text,
                                            metadata.Data.text.Length,
                                            this.privSynthesisTurn.currentTextOffset);

                                        if (!!this.privSpeechSynthesizer.wordBoundary) {
                                            try {
                                                this.privSpeechSynthesizer.wordBoundary(this.privSpeechSynthesizer, ev);
                                            } catch (error) {
                                                // Not going to let errors in the event handler
                                                // trip things up.
                                            }
                                        }
                                    }
                                }
                                break;
                            case "turn.end":
                                this.privSynthesisTurn.onServiceTurnEndResponse();
                                let result: SpeechSynthesisResult;
                                try {
                                    result = new SpeechSynthesisResult(
                                        this.privSynthesisTurn.requestId,
                                        ResultReason.SynthesizingAudioCompleted,
                                        this.privSynthesisTurn.allReceivedAudioWithHeader
                                    );
                                    if (!!this.privSuccessCallback) {
                                        this.privSuccessCallback(result);
                                    }
                                } catch (error) {
                                    if (!!this.privErrorCallback) {
                                        this.privErrorCallback(error);
                                    }
                                }
                                if (this.privSpeechSynthesizer.synthesisCompleted) {
                                    try {
                                        this.privSpeechSynthesizer.synthesisCompleted(
                                            this.privSpeechSynthesizer,
                                            new SpeechSynthesisEventArgs(result)
                                        );
                                    } catch (e) {
                                        // Not going to let errors in the event handler
                                        // trip things up.
                                    }
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
                });
        }, (error: string) => {
        });
    }

    protected sendSynthesisContext = (connection: IConnection): Promise<boolean> => {
        const synthesisContextJson = JSON.stringify(this.buildSynthesisContext());

        if (synthesisContextJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "synthesis.context",
                this.privSynthesisTurn.requestId,
                "application/json",
                synthesisContextJson));
        }
        return PromiseHelper.fromResult(true);
    }

    // Establishes a websocket connection to the end point.
    protected connectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {

        if (this.connectImplOverride !== undefined) {
            return this.connectImplOverride(isUnAuthorized);
        }

        if (this.privConnectionPromise) {
            if (this.privConnectionPromise.result().isCompleted &&
                (this.privConnectionPromise.result().isError
                    || this.privConnectionPromise.result().result.state() === ConnectionState.Disconnected) &&
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

        this.privSynthesisTurn.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);

        this.privConnectionPromise = authPromise
            .continueWithPromise((result: PromiseResult<AuthInfo>) => {
                if (result.isError) {
                    // this.privRequestSession.onAuthCompleted(true, result.error);
                    throw new Error(result.error);
                } else {
                    // this.privRequestSession.onAuthCompleted(false);
                }

                const connection: IConnection = this.privConnectionFactory.create(this.privSynthesizerConfig, result.result, this.privConnectionId);

                // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
                // it'll stop sending events.
                connection.events.attach((event: ConnectionEvent) => {
                    this.connectionEvents.onEvent(event);
                });

                return connection.open().onSuccessContinueWithPromise((response: ConnectionOpenResponse): Promise<IConnection> => {
                    if (response.statusCode === 200) {
                        this.privSynthesisTurn.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);
                        this.privSynthesisTurn.onConnectionEstablishCompleted(response.statusCode);

                        return PromiseHelper.fromResult<IConnection>(connection);
                    } else if (response.statusCode === 403 && !isUnAuthorized) {
                        return this.connectImpl(true);
                    } else {
                        this.privSynthesisTurn.onConnectionEstablishCompleted(response.statusCode, response.reason);
                        return PromiseHelper.fromError<IConnection>(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privSynthesizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
                    }
                });
            });

        return this.privConnectionPromise;
    }

    protected sendSpeechServiceConfig = (connection: IConnection, SpeechServiceConfigJson: string): Promise<boolean> => {

        if (SpeechServiceConfigJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.config",
                this.privSynthesisTurn.requestId,
                "application/json",
                SpeechServiceConfigJson));
        }

        return PromiseHelper.fromResult(true);
    }

    protected sendSsmlMessage = (connection: IConnection, ssml: string, requestId: string): Promise<boolean> => {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "ssml",
            requestId,
            "application/ssml+xml",
            ssml));
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
            return this.sendSpeechServiceConfig(connection, this.privSynthesizerConfig.SpeechServiceConfig.serialize())
                .onSuccessContinueWith((_: boolean) => {
                    return connection;
                });
        });

        return this.privConnectionConfigurationPromise;
    }

    private buildSynthesisContext(): ISynthesisContext {
        return {
            synthesis: {
                audio: {
                    metadataOptions: {
                        sentenceBoundaryEnabled: false,
                        wordBoundaryEnabled: (!!this.privSpeechSynthesizer.wordBoundary),
                    },
                    outputFormat: "raw-16khz-16bit-mono-pcm"
                }
            }
        };
    }
}

interface ISynthesisContext {
    synthesis: {
        audio: {
            outputFormat: string,
            metadataOptions: {
                wordBoundaryEnabled: boolean,
                sentenceBoundaryEnabled: boolean,
            }
        }
    };
}
