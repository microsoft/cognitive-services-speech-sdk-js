// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import {
    BackgroundEvent,
    ConnectionMessage,
    createGuid,
    createNoDashGuid,
    Deferred,
    Events,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    MessageType,
    ServiceEvent,
} from "../common/Exports";
import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat";
import { PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";
import {
    ActivityReceivedEventArgs,
    CancellationErrorCode,
    CancellationReason,
    DialogServiceConnector,
    PropertyCollection,
    PropertyId,
    RecognitionEventArgs,
    ResultReason,
    SessionEventArgs,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechSynthesisOutputFormat,
} from "../sdk/Exports";
import { DialogServiceTurnStateManager } from "./DialogServiceTurnStateManager";
import {
    CancellationErrorCodePropertyName,
    EnumTranslation,
    ISpeechConfigAudioDevice,
    RecognitionStatus,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechDetected,
    SpeechHypothesis,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognitionMode, RecognizerConfig } from "./RecognizerConfig";
import { ActivityPayloadResponse } from "./ServiceMessages/ActivityResponsePayload";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

export class DialogServiceAdapter extends ServiceRecognizerBase {
    private privDialogServiceConnector: DialogServiceConnector;

    private privDialogIsDisposed: boolean;
    private privDialogAuthentication: IAuthentication;
    private privDialogAudioSource: IAudioSource;

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

        this.privDialogIsDisposed = false;
        this.agentConfigSent = false;
        this.privLastResult = null;
    }

    public isDisposed(): boolean {
        return this.privDialogIsDisposed;
    }

    public async sendMessage(message: string): Promise<void> {
        const interactionGuid: string = createGuid();
        const requestId: string = createNoDashGuid();

        const agentMessage: any = {
            context: {
                interactionId: interactionGuid
            },
            messagePayload: JSON.parse(message),
            version: 0.5
        };

        const agentMessageJson = JSON.stringify(agentMessage);
        const connection: IConnection = await this.fetchConnection();
        await connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "agent",
            requestId,
            "application/json",
            agentMessageJson));

    }

    protected async privDisconnect(): Promise<void> {
        await this.cancelRecognition(this.privRequestSession.sessionId,
            this.privRequestSession.requestId,
            CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting");

        this.terminateMessageLoop = true;
        this.agentConfigSent = false;
        return;
    }

    protected async processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        let result: SpeechRecognitionResult;
        let processed: boolean;

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.phrase":
                const speechPhrase: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);

                this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + speechPhrase.Offset + speechPhrase.Duration);

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
                const offset: number = hypothesis.Offset + this.privRequestSession.currentTurnAudioOffset;

                result = new SpeechRecognitionResult(
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    offset,
                    hypothesis.Language,
                    hypothesis.LanguageDetectionConfidence,
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                this.privRequestSession.onHypothesis(offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);

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

                    const pullAudioOutputStream: PullAudioOutputStreamImpl = turn.processActivityPayload(activityPayload, (SpeechSynthesisOutputFormat as any)[this.privDialogServiceConnector.properties.getProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, undefined)]);
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
    protected async cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): Promise<void> {

        this.terminateMessageLoop = true;

        if (!!this.privRequestSession.isRecognizing) {
            await this.privRequestSession.onStopRecognizing();
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
                    undefined, // Language
                    undefined, // Language Detection Confidence
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

        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privDialogAudioSource.events);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();

        const preAudioPromise: Promise<void> = this.sendPreAudioMessages();

        const node: IAudioStreamNode = await this.privDialogAudioSource.attach(this.privRequestSession.audioNodeId);
        const format: AudioStreamFormatImpl = await this.privDialogAudioSource.format;
        const deviceInfo: ISpeechConfigAudioDevice = await this.privDialogAudioSource.deviceInfo;

        const audioNode = new ReplayableAudioNode(node, format.avgBytesPerSec);
        await this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);

        this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

        try {
            await conPromise;
            await preAudioPromise;
        } catch (error) {
            await this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error);
            return Promise.resolve();
        }

        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);

        if (!!this.privRecognizer.sessionStarted) {
            this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
        }

        const audioSendPromise = this.sendAudio(audioNode);

        // /* tslint:disable:no-empty */
        audioSendPromise.then(() => { /*add? return true;*/ }, async (error: string) => {
            await this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
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
                const isDisposed: boolean = this.isDisposed();
                const terminateMessageLoop = (!this.isDisposed() && this.terminateMessageLoop);
                if (isDisposed || terminateMessageLoop) {
                    // We're done.
                    communicationCustodian.resolve(undefined);
                    return;
                }

                const connection: IConnection = await this.fetchConnection();
                const message: ConnectionMessage = await connection.read();

                if (!message) {
                    return loop();
                }

                const connectionMessage = SpeechConnectionMessage.fromConnectionMessage(message);

                switch (connectionMessage.path.toLowerCase()) {
                    case "turn.start":
                        {
                            const turnRequestId = connectionMessage.requestId.toUpperCase();
                            const audioSessionReqId = this.privRequestSession.requestId.toUpperCase();

                            // turn started by the service
                            if (turnRequestId !== audioSessionReqId) {
                                this.privTurnStateManager.StartTurn(turnRequestId);
                            } else {
                                this.privRequestSession.onServiceTurnStartResponse();
                            }
                        }
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
                        {
                            const turnEndRequestId = connectionMessage.requestId.toUpperCase();

                            const audioSessionReqId = this.privRequestSession.requestId.toUpperCase();

                            // turn started by the service
                            if (turnEndRequestId !== audioSessionReqId) {
                                this.privTurnStateManager.CompleteTurn(turnEndRequestId);
                            } else {
                                // Audio session turn

                                const sessionStopEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);
                                await this.privRequestSession.onServiceTurnEndResponse(false);

                                if (this.privRequestSession.isSpeechEnded) {
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

                return ret;
            } catch (error) {
                this.terminateMessageLoop = true;
                communicationCustodian.resolve();
            }
        };

        loop().catch((reason: string): void => {
            Events.instance.onEvent(new BackgroundEvent(reason));
        });

        return communicationCustodian.promise;
    }

    private async startMessageLoop(): Promise<void> {

        this.terminateMessageLoop = false;

        try {
            await this.receiveDialogMessageOverride();
        } catch (error) {
            await this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        }

        return Promise.resolve();
    }

    // Takes an established websocket connection to the endpoint and sends speech configuration information.
    private async configConnection(connection: IConnection): Promise<IConnection> {
        if (this.terminateMessageLoop) {
            this.terminateMessageLoop = false;
            return Promise.reject(`Connection to service terminated.`);
        }

        await this.sendSpeechServiceConfig(connection, this.privRequestSession, this.privRecognizerConfig.SpeechServiceConfig.serialize());
        await this.sendAgentConfig(connection);
        return connection;
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
                this.privRequestSession.requestId,
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
            this.privRequestSession.requestId,
            "application/json",
            agentContextJson));
    }

    private fireEventForResult(serviceResult: SimpleSpeechPhrase, properties: PropertyCollection): SpeechRecognitionEventArgs {
        const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(serviceResult.RecognitionStatus);

        const offset: number = serviceResult.Offset + this.privRequestSession.currentTurnAudioOffset;

        const result = new SpeechRecognitionResult(
            this.privRequestSession.requestId,
            resultReason,
            serviceResult.DisplayText,
            serviceResult.Duration,
            offset,
            serviceResult.Language,
            serviceResult.LanguageDetectionConfidence,
            undefined,
            JSON.stringify(serviceResult),
            properties);

        const ev = new SpeechRecognitionEventArgs(result, offset, this.privRequestSession.sessionId);
        return ev;
    }
}
