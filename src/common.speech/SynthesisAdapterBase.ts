// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    ConnectionClosedEvent,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionState,
    createNoDashGuid,
    EventSource,
    IAudioDestination,
    IConnection,
    IDisposable,
    MessageType,
    ServiceEvent,
} from "../common/Exports";
import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat";
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
import {
    AgentConfig,
    CancellationErrorCodePropertyName,
    ISynthesisConnectionFactory,
    SynthesisAudioMetadata,
    SynthesisContext,
    SynthesisTurn,
    SynthesizerConfig
} from "./Exports";
import { AuthInfo, IAuthentication } from "./IAuthentication";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class SynthesisAdapterBase implements IDisposable {
    protected privSynthesisTurn: SynthesisTurn;
    protected privConnectionId: string;
    protected privSynthesizerConfig: SynthesizerConfig;
    protected privSpeechSynthesizer: SpeechSynthesizer;
    protected privSuccessCallback: (e: SpeechSynthesisResult) => void;
    protected privErrorCallback: (e: string) => void;

    public get synthesisContext(): SynthesisContext {
        return this.privSynthesisContext;
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

    protected configConnectionOverride: (connection: IConnection) => any = undefined;

    public set audioOutputFormat(format: AudioOutputFormatImpl) {
        this.privAudioOutputFormat = format;
        this.privSynthesisTurn.audioOutputFormat = format;
        if (this.privSessionAudioDestination !== undefined) {
            this.privSessionAudioDestination.format = format;
        }
        if (this.synthesisContext !== undefined) {
            this.synthesisContext.audioOutputFormat = format;
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
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privServiceEvents: EventSource<ServiceEvent>;
    private privSynthesisContext: SynthesisContext;
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

        this.privAuthentication = authentication;
        this.privConnectionFactory = connectionFactory;
        this.privSynthesizerConfig = synthesizerConfig;
        this.privIsDisposed = false;
        this.privSpeechSynthesizer = speechSynthesizer;
        this.privSessionAudioDestination = audioDestination;
        this.privSynthesisTurn = new SynthesisTurn();
        this.privConnectionEvents = new EventSource<ConnectionEvent>();
        this.privServiceEvents = new EventSource<ServiceEvent>();
        this.privSynthesisContext = new SynthesisContext(this.privSpeechSynthesizer);
        this.privAgentConfig = new AgentConfig();

        this.connectionEvents.attach((connectionEvent: ConnectionEvent): void => {
            if (connectionEvent.name === "ConnectionClosedEvent") {
                const connectionClosedEvent = connectionEvent as ConnectionClosedEvent;
                if (connectionClosedEvent.statusCode !== 1000) {
                    this.cancelSynthesisLocal(CancellationReason.Error,
                        connectionClosedEvent.statusCode === 1007 ? CancellationErrorCode.BadRequestParameters : CancellationErrorCode.ConnectionFailure,
                        connectionClosedEvent.reason + " websocket error code: " + connectionClosedEvent.statusCode);
                }
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

    public async dispose(reason?: string): Promise<void> {
        this.privIsDisposed = true;
        if (this.privSessionAudioDestination !== undefined) {
            this.privSessionAudioDestination.close();
        }
        if (this.privConnectionConfigurationPromise) {
            const connection: IConnection = await this.privConnectionConfigurationPromise;
            await connection.dispose(reason);
        }
    }

    public async connect(): Promise<void> {
        await this.connectImpl();
    }

    public async sendNetworkMessage(path: string, payload: string | ArrayBuffer): Promise<void> {
        const type: MessageType = typeof payload === "string" ? MessageType.Text : MessageType.Binary;
        const contentType: string = typeof payload === "string" ? "application/json" : "";

        const connection: IConnection = await this.fetchConnection();
        return connection.send(new SpeechConnectionMessage(type, path, this.privSynthesisTurn.requestId, contentType, payload));
    }

    public async Speak(
        text: string,
        isSSML: boolean,
        requestId: string,
        successCallback: (e: SpeechSynthesisResult) => void,
        errorCallBack: (e: string) => void,
        audioDestination: IAudioDestination,
    ): Promise<void> {

        let ssml: string;

        if (isSSML) {
            ssml = text;
        } else {
            ssml = this.privSpeechSynthesizer.buildSsml(text);
        }

        if (this.speakOverride !== undefined) {
            return this.speakOverride(ssml, requestId, successCallback, errorCallBack);
        }

        this.privSuccessCallback = successCallback;
        this.privErrorCallback = errorCallBack;

        this.privSynthesisTurn.startNewSynthesis(requestId, text, isSSML, audioDestination);

        try {
            await this.connectImpl();
            const connection: IConnection = await this.fetchConnection();
            await this.sendSynthesisContext(connection);
            await this.sendSsmlMessage(connection, ssml, requestId);
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
        } catch (e) {
            this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, e);
            return Promise.reject(e);
        }
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

    protected async receiveMessage(): Promise<void> {
        try {
            const connection: IConnection = await this.fetchConnection();
            const message: ConnectionMessage = await connection.read();

            if (this.receiveMessageOverride !== undefined) {
                return this.receiveMessageOverride();
            }
            if (this.privIsDisposed) {
                // We're done.
                return;
            }

            // indicates we are draining the queue and it came with no message;
            if (!message) {
                if (!this.privSynthesisTurn.isSynthesizing) {
                    return;
                } else {
                    return this.receiveMessage();
                }
            }

            this.privServiceHasSentMessage = true;

            const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

            if (connectionMessage.requestId.toLowerCase() === this.privSynthesisTurn.requestId.toLowerCase()) {
                switch (connectionMessage.path.toLowerCase()) {
                    case "turn.start":
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
                            const audioBuffer: ArrayBuffer = await this.privSynthesisTurn.getAllReceivedAudioWithHeader();
                            result = new SpeechSynthesisResult(
                                this.privSynthesisTurn.requestId,
                                ResultReason.SynthesizingAudioCompleted,
                                audioBuffer
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

        } catch (e) {
            // TODO: What goes here?
        }
    }

    protected sendSynthesisContext = (connection: IConnection): Promise<void> => {
        const synthesisContextJson = this.synthesisContext.toJSON();

        if (synthesisContextJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "synthesis.context",
                this.privSynthesisTurn.requestId,
                "application/json",
                synthesisContextJson));
        }
        return;
    }

    protected connectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {
        if (this.privConnectionPromise) {
            return this.privConnectionPromise.then((connection: IConnection): Promise<IConnection> => {
                if (connection.state() === ConnectionState.Disconnected) {
                    this.privConnectionId = null;
                    this.privConnectionPromise = null;
                    this.privServiceHasSentMessage = false;
                    return this.connectImpl();
                }
                return this.privConnectionPromise;
            }, (error: string): Promise<IConnection> => {
                this.privConnectionId = null;
                this.privConnectionPromise = null;
                this.privServiceHasSentMessage = false;
                return this.connectImpl();
            });
        }
        this.privAuthFetchEventId = createNoDashGuid();
        this.privConnectionId = createNoDashGuid();

        this.privSynthesisTurn.onPreConnectionStart(this.privAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);

        this.privConnectionPromise = authPromise.then(async (result: AuthInfo) => {
            await this.privSynthesisTurn.onAuthCompleted(false);

            const connection: IConnection = this.privConnectionFactory.create(this.privSynthesizerConfig, result, this.privConnectionId);

            // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
            // it'll stop sending events.
            connection.events.attach((event: ConnectionEvent) => {
                this.connectionEvents.onEvent(event);
            });
            const response = await connection.open();
            if (response.statusCode === 200) {
                await this.privSynthesisTurn.onConnectionEstablishCompleted(response.statusCode);
                return Promise.resolve(connection);
            } else if (response.statusCode === 403 && !isUnAuthorized) {
                return this.connectImpl(true);
            } else {
                await this.privSynthesisTurn.onConnectionEstablishCompleted(response.statusCode, response.reason);
                return Promise.reject(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privSynthesizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
            }
        }, async (error: string): Promise<IConnection> => {
            await this.privSynthesisTurn.onAuthCompleted(true, error);
            throw new Error(error);
        });

        // Attach an empty handler to allow the promise to run in the background while
        // other startup events happen. It'll eventually be awaited on.
        this.privConnectionPromise.catch(() => { });

        return this.privConnectionPromise;
    }
    protected sendSpeechServiceConfig = (connection: IConnection, SpeechServiceConfigJson: string): Promise<void> => {
        if (SpeechServiceConfigJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.config",
                this.privSynthesisTurn.requestId,
                "application/json",
                SpeechServiceConfigJson));
        }
    }

    protected sendSsmlMessage = (connection: IConnection, ssml: string, requestId: string): Promise<void> => {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "ssml",
            requestId,
            "application/ssml+xml",
            ssml));
    }

    private async fetchConnection(): Promise<IConnection> {
        if (this.privConnectionConfigurationPromise) {
            return this.privConnectionConfigurationPromise.then((connection: IConnection): Promise<IConnection> => {
                if (connection.state() === ConnectionState.Disconnected) {
                    this.privConnectionId = null;
                    this.privConnectionConfigurationPromise = null;
                    this.privServiceHasSentMessage = false;
                    return this.fetchConnection();
                }
                return this.privConnectionConfigurationPromise;
            }, (error: string): Promise<IConnection> => {
                this.privConnectionId = null;
                this.privConnectionConfigurationPromise = null;
                this.privServiceHasSentMessage = false;
                return this.fetchConnection();
            });
        }
        this.privConnectionConfigurationPromise = this.configureConnection();
        return await this.privConnectionConfigurationPromise;
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private async configureConnection(): Promise<IConnection> {
        const connection: IConnection = await this.connectImpl();
        if (this.configConnectionOverride !== undefined) {
            return this.configConnectionOverride(connection);
        }
        await this.sendSpeechServiceConfig(connection, this.privSynthesizerConfig.SpeechServiceConfig.serialize());
        return connection;
    }
}
