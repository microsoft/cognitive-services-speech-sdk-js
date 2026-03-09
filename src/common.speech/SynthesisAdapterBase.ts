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
} from "../common/Exports.js";
import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat.js";
import {
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechSynthesisBookmarkEventArgs,
    SpeechSynthesisResult,
    SpeechSynthesisVisemeEventArgs,
    SpeechSynthesisWordBoundaryEventArgs,
    Synthesizer,
} from "../sdk/Exports.js";
import { SpeechSynthesisRequest } from "../sdk/SpeechSynthesisRequest.js";
import {
    AgentConfig,
    CancellationErrorCodePropertyName,
    ISynthesisConnectionFactory,
    ISynthesisMetadata,
    MetadataType,
    SynthesisAudioMetadata,
    SynthesisContext,
    SynthesisTurn,
    SynthesizerConfig
} from "./Exports.js";
import { AuthInfo, IAuthentication } from "./IAuthentication.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

export abstract class SynthesisAdapterBase implements IDisposable {
    protected privSynthesisTurn: SynthesisTurn;
    protected privConnectionId: string;
    protected privSynthesizerConfig: SynthesizerConfig;
    protected privSynthesizer: Synthesizer;
    protected privSuccessCallback: (e: SpeechSynthesisResult) => void;
    protected privErrorCallback: (e: string) => void;

    public get synthesizerConfig(): SynthesizerConfig {
        return this.privSynthesizerConfig;
    }

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
    protected privSynthesisContext: SynthesisContext;
    private privAgentConfig: AgentConfig;
    private privActivityTemplate: string;
    protected privAudioOutputFormat: AudioOutputFormatImpl;
    private privSessionAudioDestination: IAudioDestination;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig,
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
        this.privSessionAudioDestination = audioDestination;
        this.privSynthesisTurn = new SynthesisTurn();
        this.privConnectionEvents = new EventSource<ConnectionEvent>();
        this.privServiceEvents = new EventSource<ServiceEvent>();
        this.privSynthesisContext = new SynthesisContext();
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
            ssml = this.privSynthesizer.buildSsml(text);
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
            this.onSynthesisStarted(requestId);

            void this.receiveMessage();
        } catch (e) {
            this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, e as string);
            return Promise.reject(e);
        }
    }

    public async stopSpeaking(): Promise<void> {
        await this.connectImpl();
        const connection: IConnection = await this.fetchConnection();

        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "synthesis.control",
            this.privSynthesisTurn.requestId,
            "application/json",
            JSON.stringify({
                action: "stop"
            })
        ));
    }

    /**
     * Performs text streaming synthesis using a SpeechSynthesisRequest.
     * Text pieces are sent over WebSocket as they arrive via the request's input stream.
     */
    public async SpeakStream(
        request: SpeechSynthesisRequest,
        requestId: string,
        successCallback: (e: SpeechSynthesisResult) => void,
        errorCallBack: (e: string) => void,
        audioDestination: IAudioDestination,
    ): Promise<void> {

        this.privSuccessCallback = successCallback;
        this.privErrorCallback = errorCallBack;

        this.privSynthesisTurn.startNewSynthesis(requestId, "", false, audioDestination);

        try {
            await this.connectImpl();
            const connection: IConnection = await this.fetchConnection();

            // Send synthesis.context with streaming input section embedded
            await this.sendStreamingSynthesisContext(connection, request, requestId);

            this.onSynthesisStarted(requestId);

            // Set up text piece callback - each piece is sent as a text.piece message
            request.onTextPiece = (text: string): void => {
                this.sendTextPiece(connection, text, requestId).catch((e: unknown): void => {
                    this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, e as string);
                });
            };

            // Set up close callback - sends the finish signal
            request.onClose = (): void => {
                this.sendTextStreamEnd(connection, requestId).catch((e: unknown): void => {
                    this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, e as string);
                });
            };

            void this.receiveMessage();
        } catch (e) {
            this.cancelSynthesisLocal(CancellationReason.Error, CancellationErrorCode.ConnectionFailure, e as string);
            return Promise.reject(e);
        }
    }

    // Cancels synthesis.
    protected cancelSynthesis(
        requestId: string,
        _cancellationReason: CancellationReason,
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

        this.onSynthesisCancelled(result);

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
    protected processTypeSpecificMessages(_connectionMessage: SpeechConnectionMessage): boolean {
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
                            this.onSynthesizing(connectionMessage.binaryBody);
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
                                    this.onWordBoundary(wordBoundaryEventArgs);
                                    break;
                                case MetadataType.Bookmark:
                                    const bookmarkEventArgs: SpeechSynthesisBookmarkEventArgs = new SpeechSynthesisBookmarkEventArgs(
                                        metadata.Data.Offset,
                                        metadata.Data.Bookmark);
                                    this.onBookmarkReached(bookmarkEventArgs);
                                    break;
                                case MetadataType.Viseme:
                                    this.privSynthesisTurn.onVisemeMetadataReceived(metadata);
                                    if (metadata.Data.IsLastAnimation) {
                                        const visemeEventArgs: SpeechSynthesisVisemeEventArgs = new SpeechSynthesisVisemeEventArgs(
                                            metadata.Data.Offset,
                                            metadata.Data.VisemeId,
                                            this.privSynthesisTurn.getAndClearVisemeAnimation());
                                        this.onVisemeReceived(visemeEventArgs);
                                    }
                                    break;
                                case MetadataType.AvatarSignal:
                                    this.onAvatarEvent(metadata);
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
                            result = await this.privSynthesisTurn.constructSynthesisResult();
                            this.onSynthesisCompleted(result);
                            if (!!this.privSuccessCallback) {
                                this.privSuccessCallback(result);
                            }
                        } catch (error) {
                            if (!!this.privErrorCallback) {
                                this.privErrorCallback(error as string);
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
        this.setSynthesisContextSynthesisSection();
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

    protected abstract setSynthesisContextSynthesisSection(): void;

    protected setSpeechConfigSynthesisSection(): void {
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

            const connection: IConnection = await this.privConnectionFactory.create(this.privSynthesizerConfig, result, this.privConnectionId);

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
                return Promise.reject(
                    `Unable to contact server. StatusCode: ${response.statusCode},
                    ${this.privSynthesizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Url)} Reason: ${response.reason}`);
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

    /**
     * Sends the synthesis.context message for text streaming mode.
     * Includes the standard audio/language sections plus an input section
     * with bidirectionalStreamingMode, voice name, and per-request properties.
     */
    protected async sendStreamingSynthesisContext(
        connection: IConnection,
        request: SpeechSynthesisRequest,
        requestId: string
    ): Promise<void> {
        // Build the standard synthesis context first
        this.setSynthesisContextSynthesisSection();

        // Build the streaming input section
        const inputSection: { [key: string]: any } = {
            bidirectionalStreamingMode: true,
        };

        // Add voice name and language from synthesizer properties
        const voiceName = this.privSynthesizerConfig.parameters.getProperty(
            PropertyId.SpeechServiceConnection_SynthVoice, "");
        const language = this.privSynthesizerConfig.parameters.getProperty(
            PropertyId.SpeechServiceConnection_SynthLanguage, "en-US");

        if (voiceName) {
            inputSection.voiceName = voiceName;
        }
        inputSection.language = language;

        // Add per-request voice properties
        const pitch = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_Pitch, undefined);
        const rate = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_Rate, undefined);
        const volume = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_Volume, undefined);
        const style = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_Style, undefined);
        const temperature = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_Temperature, undefined);
        const customLexiconUrl = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_CustomLexiconUrl, undefined);
        const preferLocales = request.properties.getProperty(PropertyId.SpeechSynthesisRequest_PreferLocales, undefined);

        if (pitch !== undefined) {
            inputSection.pitch = pitch;
        }
        if (rate !== undefined) {
            inputSection.rate = rate;
        }
        if (volume !== undefined) {
            inputSection.volume = volume;
        }
        if (style !== undefined) {
            inputSection.style = style;
        }
        if (temperature !== undefined) {
            inputSection.temperature = temperature;
        }
        if (customLexiconUrl !== undefined) {
            inputSection.customLexiconUrl = customLexiconUrl;
        }
        if (preferLocales !== undefined) {
            inputSection.preferLocales = preferLocales;
        }

        // Add the input section to the synthesis context
        const existingSynthesis = this.privSynthesisContext.getSection<Record<string, unknown>>("synthesis") ?? {};
        this.privSynthesisContext.setSection("synthesis", {
            ...existingSynthesis,
            input: inputSection,
        } as Record<string, unknown>);

        const synthesisContextJson = this.privSynthesisContext.toJSON();
        if (synthesisContextJson) {
            return connection.send(new SpeechConnectionMessage(
                MessageType.Text,
                "synthesis.context",
                requestId,
                "application/json",
                synthesisContextJson));
        }
    }

    /**
     * Sends a text piece for streaming synthesis.
     * Path: text.piece, Content-Type: text/plain, Body: raw text
     */
    protected async sendTextPiece(connection: IConnection, text: string, requestId: string): Promise<void> {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "text.piece",
            requestId,
            "text/plain",
            text));
    }

    /**
     * Sends the end-of-stream signal for text streaming synthesis.
     * Path: text.end, Content-Type: text/plain, Body: empty
     */
    protected async sendTextStreamEnd(connection: IConnection, requestId: string): Promise<void> {
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "text.end",
            requestId,
            "text/plain",
            ""));
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
        this.setSpeechConfigSynthesisSection();
        await this.sendSpeechServiceConfig(connection, this.privSynthesizerConfig.SpeechServiceConfig.serialize());
        return connection;
    }

    protected onAvatarEvent(_metadata: ISynthesisMetadata): void {
        return;
    }

    protected onSynthesisStarted(_requestId: string): void {
        return;
    }

    protected onSynthesizing(_audio: ArrayBuffer): void {
        return;
    }

    protected onSynthesisCancelled(_result: SpeechSynthesisResult): void {
        return;
    }

    protected onSynthesisCompleted(_result: SpeechSynthesisResult): void {
        return;
    }

    protected onWordBoundary(_wordBoundaryEventArgs: SpeechSynthesisWordBoundaryEventArgs): void {
        return;
    }

    protected onVisemeReceived(_visemeEventArgs: SpeechSynthesisVisemeEventArgs): void {
        return;
    }

    protected onBookmarkReached(_bookmarkEventArgs: SpeechSynthesisBookmarkEventArgs): void {
        return;
    }

}
