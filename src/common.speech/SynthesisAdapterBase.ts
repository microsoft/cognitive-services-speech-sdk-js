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
    SpeechSynthesisBookmarkEventArgs,
    SpeechSynthesisEventArgs,
    SpeechSynthesisResult,
    SpeechSynthesisVisemeEventArgs,
    SpeechSynthesisWordBoundaryEventArgs,
    SpeechSynthesizer,
} from "../sdk/Exports";
import {
    AgentConfig,
    CancellationErrorCodePropertyName,
    ISynthesisConnectionFactory,
    MetadataType,
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

    protected speakOverride: (ssml: string, requestId: string, sc: (e: SpeechSynthesisResult) => void, ec: (e: string) => void) => void = undefined;

    // Called when telemetry data is sent to the service.
    // Used for testing Telemetry capture.
    public static telemetryData: (json: string) => void;
    public static telemetryDataEnabled: boolean = true;

    public set activityTemplate(messagePayload: string) {
        this.privActivityTemplate = messagePayload;
    }
    public get activityTemplate(): string {
        return this.privActivityTemplate;
    }

    protected receiveMessageOverride: () => void = undefined;

    protected connectImplOverride: (isUnAuthorized: boolean) => void = undefined;

    protected configConnectionOverride: (connection: IConnection) => Promise<IConnection> = undefined;

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
    private privConnectionConfigurationPromise: Promise<IConnection> = undefined;

    // A promise for a connection, but one that has not had the speech context sent yet.
    // Do not consume directly, call fetchConnection instead.
    private privConnectionPromise: Promise<IConnection>;
    private privAuthFetchEventId: string;
    private privIsDisposed: boolean;
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privServiceEvents: EventSource<ServiceEvent>;
    private privSynthesisContext: SynthesisContext;
    private privAgentConfig: AgentConfig;
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
                        `${connectionClosedEvent.reason} websocket error code: ${connectionClosedEvent.statusCode}`);
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
        if (this.privConnectionConfigurationPromise !== undefined) {
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

            void this.receiveMessage();
        } catch (e) {
            this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, e as string);
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
                /* eslint-disable no-empty */
            } catch { }
        }

        if (!!this.privSuccessCallback) {
            try {
                this.privSuccessCallback(result);
                /* eslint-disable no-empty */
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): boolean {
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


            const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

            if (connectionMessage.requestId.toLowerCase() === this.privSynthesisTurn.requestId.toLowerCase()) {
                switch (connectionMessage.path.toLowerCase()) {
                    case "turn.start":
                        this.privSynthesisTurn.onServiceTurnStartResponse(connectionMessage.textBody);
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
                            switch (metadata.Type) {
                                case MetadataType.WordBoundary:
                                case MetadataType.SentenceBoundary:
                                    this.privSynthesisTurn.onTextBoundaryEvent(metadata);

                                    const wordBoundaryEventArgs: SpeechSynthesisWordBoundaryEventArgs = new SpeechSynthesisWordBoundaryEventArgs(
                                        metadata.Data.Offset,
                                        metadata.Data.Duration,
                                        metadata.Data.text.Text,
                                        metadata.Data.text.Length,
                                        metadata.Type === MetadataType.WordBoundary
                                            ? this.privSynthesisTurn.currentTextOffset : this.privSynthesisTurn.currentSentenceOffset,
                                        metadata.Data.text.BoundaryType);

                                    if (!!this.privSpeechSynthesizer.wordBoundary) {
                                        try {
                                            this.privSpeechSynthesizer.wordBoundary(this.privSpeechSynthesizer, wordBoundaryEventArgs);
                                        } catch (error) {
                                            // Not going to let errors in the event handler
                                            // trip things up.
                                        }
                                    }
                                    break;
                                case MetadataType.Bookmark:
                                    const bookmarkEventArgs: SpeechSynthesisBookmarkEventArgs = new SpeechSynthesisBookmarkEventArgs(
                                        metadata.Data.Offset,
                                        metadata.Data.Bookmark);

                                    if (!!this.privSpeechSynthesizer.bookmarkReached) {
                                        try {
                                            this.privSpeechSynthesizer.bookmarkReached(this.privSpeechSynthesizer, bookmarkEventArgs);
                                        } catch (error) {
                                            // Not going to let errors in the event handler
                                            // trip things up.
                                        }
                                    }
                                    break;
                                case MetadataType.Viseme:
                                    this.privSynthesisTurn.onVisemeMetadataReceived(metadata);
                                    if (metadata.Data.IsLastAnimation) {
                                        const visemeEventArgs: SpeechSynthesisVisemeEventArgs = new SpeechSynthesisVisemeEventArgs(
                                            metadata.Data.Offset,
                                            metadata.Data.VisemeId,
                                            this.privSynthesisTurn.getAndClearVisemeAnimation());

                                        if (!!this.privSpeechSynthesizer.visemeReceived) {
                                            try {
                                                this.privSpeechSynthesizer.visemeReceived(this.privSpeechSynthesizer, visemeEventArgs);
                                            } catch (error) {
                                                // Not going to let errors in the event handler
                                                // trip things up.
                                            }
                                        }
                                    }
                                    break;
                                case MetadataType.SessionEnd:
                                    this.privSynthesisTurn.onSessionEnd(metadata);
                                    break;
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
                                audioBuffer,
                                undefined,
                                this.privSynthesisTurn.extraProperties,
                                this.privSynthesisTurn.audioDuration
                            );
                            if (!!this.privSuccessCallback) {
                                this.privSuccessCallback(result);
                            }
                        } catch (error) {
                            if (!!this.privErrorCallback) {
                                this.privErrorCallback(error as string);
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

    protected sendSynthesisContext(connection: IConnection): Promise<void> {
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
        if (this.privConnectionPromise != null) {
            return this.privConnectionPromise.then((connection: IConnection): Promise<IConnection> => {
                if (connection.state() === ConnectionState.Disconnected) {
                    this.privConnectionId = null;
                    this.privConnectionPromise = null;
                    return this.connectImpl();
                }
                return this.privConnectionPromise;
            }, (): Promise<IConnection> => {
                this.privConnectionId = null;
                this.privConnectionPromise = null;
                return this.connectImpl();
            });
        }
        this.privAuthFetchEventId = createNoDashGuid();
        this.privConnectionId = createNoDashGuid();

        this.privSynthesisTurn.onPreConnectionStart(this.privAuthFetchEventId);

        const authPromise = isUnAuthorized ? this.privAuthentication.fetchOnExpiry(this.privAuthFetchEventId) : this.privAuthentication.fetch(this.privAuthFetchEventId);

        this.privConnectionPromise = authPromise.then(async (result: AuthInfo): Promise<IConnection> => {
            this.privSynthesisTurn.onAuthCompleted(false);

            const connection: IConnection = this.privConnectionFactory.create(this.privSynthesizerConfig, result, this.privConnectionId);

            // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
            // it'll stop sending events.
            connection.events.attach((event: ConnectionEvent): void => {
                this.connectionEvents.onEvent(event);
            });
            const response = await connection.open();
            if (response.statusCode === 200) {
                this.privSynthesisTurn.onConnectionEstablishCompleted(response.statusCode);
                return Promise.resolve(connection);
            } else if (response.statusCode === 403 && !isUnAuthorized) {
                return this.connectImpl(true);
            } else {
                this.privSynthesisTurn.onConnectionEstablishCompleted(response.statusCode);
                return Promise.reject(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privSynthesizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
            }
        }, (error: string): Promise<IConnection> => {
            this.privSynthesisTurn.onAuthCompleted(true);
            throw new Error(error);
        });

        // Attach an empty handler to allow the promise to run in the background while
        // other startup events happen. It'll eventually be awaited on.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        this.privConnectionPromise.catch((): void => { });

        return this.privConnectionPromise;
    }
    protected sendSpeechServiceConfig(connection: IConnection, SpeechServiceConfigJson: string): Promise<void> {
        if (SpeechServiceConfigJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "speech.config",
                this.privSynthesisTurn.requestId,
                "application/json",
                SpeechServiceConfigJson));
        }
    }

    protected sendSsmlMessage(connection: IConnection, ssml: string, requestId: string): Promise<void> {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "ssml",
            requestId,
            "application/ssml+xml",
            ssml));
    }

    private async fetchConnection(): Promise<IConnection> {
        if (this.privConnectionConfigurationPromise !== undefined) {
            return this.privConnectionConfigurationPromise.then((connection: IConnection): Promise<IConnection> => {
                if (connection.state() === ConnectionState.Disconnected) {
                    this.privConnectionId = null;
                    this.privConnectionConfigurationPromise = undefined;
                    return this.fetchConnection();
                }
                return this.privConnectionConfigurationPromise;
            }, (): Promise<IConnection> => {
                this.privConnectionId = null;
                this.privConnectionConfigurationPromise = undefined;
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
        await this.sendSpeechServiceConfig(connection, this.privSynthesizerConfig.SpeechSynthesisServiceConfig.serialize());
        return connection;
    }
}
