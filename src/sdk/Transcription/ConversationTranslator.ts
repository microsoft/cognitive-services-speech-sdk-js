// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { ConversationConnectionConfig } from "../../common.speech/Exports";
import { IDisposable, IErrorMessages } from "../../common/Exports";
import { Contracts } from "../Contracts";
import {
    AudioConfig,
    CancellationErrorCode,
    CancellationReason,
    Connection,
    ConnectionEventArgs,
    ProfanityOption,
    PropertyCollection,
    PropertyId,
    Recognizer,
    SessionEventArgs,
    SpeechTranslationConfig,
    TranslationRecognitionCanceledEventArgs,
    TranslationRecognitionEventArgs,
    TranslationRecognizer
} from "../Exports";
import { ConversationImpl } from "./Conversation";
import {
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    Participant,
} from "./Exports";
import { Callback, IConversation } from "./IConversation";
import { IConversationTranslator } from "./IConversationTranslator";

export enum SpeechState {
    Inactive, Connecting, Connected
}

/***
 * Join, leave or connect to a conversation.
 */
export class ConversationTranslator implements IConversationTranslator, IDisposable {

    private privSpeechRecognitionLanguage: string;
    private privProperties: PropertyCollection;
    private privAudioConfig: AudioConfig;
    private privSpeechTranslationConfig: SpeechTranslationConfig;
    private privTranslationRecognizerConnection: Connection;
    private privIsDisposed: boolean = false;
    private privTranslationRecognizer: TranslationRecognizer;
    private privIsSpeaking: boolean = false;
    private privConversation: ConversationImpl;
    private privSpeechState: SpeechState = SpeechState.Inactive;
    private privErrors: IErrorMessages = ConversationConnectionConfig.restErrors;
    private privPlaceholderKey: string = "abcdefghijklmnopqrstuvwxyz012345";
    private privPlaceholderRegion: string = "westus";

    public constructor(audioConfig?: AudioConfig) {
        this.privProperties = new PropertyCollection();
        this.privAudioConfig = audioConfig;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public get speechRecognitionLanguage(): string {
        return this.privSpeechRecognitionLanguage;
    }

    public get participants(): Participant[] {
        return this.privConversation?.participants;
    }

    public canceled: (sender: IConversationTranslator, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: IConversationTranslator, event: ConversationExpirationEventArgs) => void;
    public participantsChanged: (sender: IConversationTranslator, event: ConversationParticipantsChangedEventArgs) => void;
    public sessionStarted: (sender: IConversationTranslator, event: SessionEventArgs) => void;
    public sessionStopped: (sender: IConversationTranslator, event: SessionEventArgs) => void;
    public textMessageReceived: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribed: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribing: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;

    /**
     * Join a conversation. If this is the host, pass in the previously created Conversation object.
     * @param conversation
     * @param nickname
     * @param lang
     * @param cb
     * @param err
     */
    public joinConversationAsync(conversation: IConversation, nickname: string, cb?: Callback, err?: Callback): void;
    public joinConversationAsync(conversationId: string, nickname: string, lang: string, cb?: Callback, err?: Callback): void;
    public joinConversationAsync(conversation: any, nickname: string, param1?: string | Callback, param2?: Callback, param3?: Callback): void {

        try {

            if (typeof conversation === "string") {

                Contracts.throwIfNullOrUndefined(conversation, this.privErrors.invalidArgs.replace("{arg}", "conversation id"));
                Contracts.throwIfNullOrWhitespace(nickname, this.privErrors.invalidArgs.replace("{arg}", "nickname"));

                if (!!this.privConversation) {
                    this.handleError(new Error(this.privErrors.permissionDeniedStart), param3);
                }

                let lang: string = param1 as string;
                if (lang === undefined || lang === null || lang === "") { lang = ConversationConnectionConfig.defaultLanguageCode; }

                // create a placecholder config
                this.privSpeechTranslationConfig = SpeechTranslationConfig.fromSubscription(
                    this.privPlaceholderKey,
                    this.privPlaceholderRegion);
                this.privSpeechTranslationConfig.setProfanity(ProfanityOption.Masked);
                this.privSpeechTranslationConfig.addTargetLanguage(lang);
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage], lang);
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Name], nickname);

                const endpoint: string = this.privProperties.getProperty(PropertyId.ConversationTranslator_Host);
                if (endpoint) {
                    this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Host], endpoint);
                }
                const speechEndpointHost: string = this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Host);
                if (speechEndpointHost) {
                    this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Host], speechEndpointHost);
                }

                // join the conversation
                this.privConversation = new ConversationImpl(this.privSpeechTranslationConfig);
                this.privConversation.conversationTranslator = this;

                this.privConversation.joinConversationAsync(
                    conversation,
                    nickname,
                    lang,
                    ((result: string) => {

                        if (!result) {
                            this.handleError(new Error(this.privErrors.permissionDeniedConnect), param3);
                        }

                        this.privSpeechTranslationConfig.authorizationToken = result;

                        // connect to the ws
                        this.privConversation.startConversationAsync(
                            (() => {
                                this.handleCallback(param2, param3);
                            }),
                            ((error: any) => {
                                this.handleError(error, param3);
                            }));

                    }),
                    ((error: any) => {
                        this.handleError(error, param3);
                    }));

            } else if (typeof conversation === "object") {

                Contracts.throwIfNullOrUndefined(conversation, this.privErrors.invalidArgs.replace("{arg}", "conversation id"));
                Contracts.throwIfNullOrWhitespace(nickname, this.privErrors.invalidArgs.replace("{arg}", "nickname"));

                // save the nickname
                this.privProperties.setProperty(PropertyId.ConversationTranslator_Name, nickname);
                // ref the conversation object
                this.privConversation = conversation as ConversationImpl;
                // ref the conversation translator object
                this.privConversation.conversationTranslator = this;

                Contracts.throwIfNullOrUndefined(this.privConversation, this.privErrors.permissionDeniedConnect);
                Contracts.throwIfNullOrUndefined(this.privConversation.room.token, this.privErrors.permissionDeniedConnect);

                this.privSpeechTranslationConfig = conversation.config;

                this.handleCallback(param1 as Callback, param2);
            } else {
                this.handleError(
                    new Error(this.privErrors.invalidArgs.replace("{arg}", "invalid conversation type")),
                    param2);
            }

        } catch (error) {
            this.handleError(error, typeof param1 === "string" ? param3 : param2);
        }
    }

    /**
     * Leave the conversation
     * @param cb
     * @param err
     */
    public leaveConversationAsync(cb?: Callback, err?: Callback): void {

        try {

            // stop the speech websocket
            this.cancelSpeech();

            // stop the websocket
            this.privConversation.endConversationAsync(
                (() => {
                    // https delete request
                    this.privConversation.deleteConversationAsync(
                        (() => {
                            this.handleCallback(cb, err);
                            this.dispose();
                        }),
                        ((error: any) => {
                            this.handleError(error, err);
                        }));
                }),
                ((error: any) => {
                    this.handleError(error, err);
                }));

        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Send a text message
     * @param message
     * @param cb
     * @param err
     */
    public sendTextMessageAsync(message: string, cb?: Callback, err?: Callback): void {

        try {
            Contracts.throwIfNullOrUndefined(this.privConversation, this.privErrors.permissionDeniedSend);
            Contracts.throwIfNullOrWhitespace(message, this.privErrors.invalidArgs.replace("{arg}", message));

            this.privConversation?.sendTextMessageAsync(message, cb, err);
        } catch (error) {

            this.handleError(error, err);
        }
    }

    /**
     * Start speaking
     * @param cb
     * @param err
     */
    public startTranscribingAsync(cb?: Callback, err?: Callback): void {

        try {
            Contracts.throwIfNullOrUndefined(this.privConversation, this.privErrors.permissionDeniedSend);
            Contracts.throwIfNullOrUndefined(this.privConversation.room.token, this.privErrors.permissionDeniedConnect);

            if (!this.canSpeak) {
                this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
            }

            if (this.privTranslationRecognizer === undefined) {
                this.connectTranslatorRecognizer(
                    (() => {
                        this.startContinuousRecognition(
                            (() => {
                                this.privIsSpeaking = true;
                                this.handleCallback(cb, err);
                            }),
                            ((error: any) => {

                                this.privIsSpeaking = false;
                                // this.fireCancelEvent(error);
                                this.cancelSpeech();
                                this.handleError(error, err);
                            }));
                    }),
                    ((error: any) => {
                        this.handleError(error, err);
                    }));
            } else {
                this.startContinuousRecognition(
                    (() => {
                        this.privIsSpeaking = true;
                        this.handleCallback(cb, err);
                    }),
                    ((error: any) => {
                        this.privIsSpeaking = false;
                        // this.fireCancelEvent(error);
                        this.cancelSpeech();

                        this.handleError(error, err);
                    }));
            }

        } catch (error) {

            this.handleError(error, err);

            this.cancelSpeech();

        }
    }

    /**
     * Stop speaking
     * @param cb
     * @param err
     */
    public stopTranscribingAsync(cb?: Callback, err?: Callback): void {

        try {
            if (!this.privIsSpeaking) {
                // stop speech
                this.cancelSpeech();
                this.handleCallback(cb, err);
                return;
            }

            // stop the recognition but leave the websocket open
            this.privIsSpeaking = false;
            this.privTranslationRecognizer?.stopContinuousRecognitionAsync(() => {
                this.handleCallback(cb, err);
            }, (error: any) => {
                this.handleError(error, err);
                this.cancelSpeech();
            });

        } catch (error) {
            this.handleError(error, err);
            this.cancelSpeech();
        }
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        if (this.isDisposed && !this.privIsSpeaking) {
            return;
        }
        this.cancelSpeech();
        this.privIsDisposed = true;
        this.privSpeechTranslationConfig?.close();
        this.privSpeechRecognitionLanguage = undefined;
        this.privProperties = undefined;
        this.privAudioConfig = undefined;
        this.privSpeechTranslationConfig = undefined;
        this.privConversation?.dispose();
        this.privConversation = undefined;
    }

    /**
     * Connect to the speech translation recognizer.
     * Currently there is no language validation performed before sending the SpeechLanguage code to the service.
     * If it's an invalid language the raw error will be: 'Error during WebSocket handshake: Unexpected response code: 400'
     * e.g. pass in 'fr' instead of 'fr-FR', or a text-only language 'cy'
     * @param cb
     * @param err
     */
    private connectTranslatorRecognizer(cb?: Callback, err?: Callback): void {

        try {

            if (this.privAudioConfig === undefined) {
                this.privAudioConfig = AudioConfig.fromDefaultMicrophoneInput();
            }

            // clear the temp subscription key if it's a participant joining
            if (this.privSpeechTranslationConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key])
                === this.privPlaceholderKey) {
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Key], "");
            }

            // TODO
            const token: string = encodeURIComponent(this.privConversation.room.token);

            let endpointHost: string = this.privSpeechTranslationConfig.getProperty(
                PropertyId[PropertyId.SpeechServiceConnection_Host], ConversationConnectionConfig.speechHost);
            endpointHost = endpointHost.replace("{region}", this.privConversation.room.cognitiveSpeechRegion);

            const url: string = `wss://${endpointHost}${ConversationConnectionConfig.speechPath}?${ConversationConnectionConfig.configParams.token}=${token}`;

            this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Endpoint], url);

            this.privTranslationRecognizer = new TranslationRecognizer(this.privSpeechTranslationConfig, this.privAudioConfig);
            this.privTranslationRecognizerConnection = Connection.fromRecognizer(this.privTranslationRecognizer);
            this.privTranslationRecognizerConnection.connected = this.onSpeechConnected;
            this.privTranslationRecognizerConnection.disconnected = this.onSpeechDisconnected;
            this.privTranslationRecognizer.recognized = this.onSpeechRecognized;
            this.privTranslationRecognizer.recognizing = this.onSpeechRecognizing;
            this.privTranslationRecognizer.canceled = this.onSpeechCanceled;
            this.privTranslationRecognizer.sessionStarted = this.onSpeechSessionStarted;
            this.privTranslationRecognizer.sessionStopped = this.onSpeechSessionStopped;

            this.handleCallback(cb, err);

        } catch (error) {

            this.handleError(error, err);

            this.cancelSpeech();
            // this.fireCancelEvent(error); ?

        }
    }

    /**
     * Handle the start speaking request
     * @param cb
     * @param err
     */
    private startContinuousRecognition(cb?: Callback, err?: Callback): void {
        this.privTranslationRecognizer.startContinuousRecognitionAsync(cb, err);
    }

    /** Recognizer callbacks */
    private onSpeechConnected = (e: ConnectionEventArgs) => {
        this.privSpeechState = SpeechState.Connected;
    }

    private onSpeechDisconnected = (e: ConnectionEventArgs) => {
        this.privSpeechState = SpeechState.Inactive;
        this.cancelSpeech();
    }

    private onSpeechRecognized = (r: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
        // TODO: add support for getting recognitions from here if own speech

        // if there is an error connecting to the conversation service from the speech service the error will be returned in the ErrorDetails field.
        if (e.result?.errorDetails) {
            this.cancelSpeech();
            // TODO: format the error message contained in 'errorDetails'
            this.fireCancelEvent(e.result.errorDetails);
        }
    }

    private onSpeechRecognizing = (r: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
        // TODO: add support for getting recognitions from here if own speech
    }

    private onSpeechCanceled = (r: TranslationRecognizer, e: TranslationRecognitionCanceledEventArgs) => {
        if (this.privSpeechState !== SpeechState.Inactive) {
            try {
                this.cancelSpeech();
            } catch (error) {
                this.privSpeechState = SpeechState.Inactive;
            }
        }
    }

    private onSpeechSessionStarted = (r: Recognizer, e: SessionEventArgs) => {
        this.privSpeechState = SpeechState.Connected;

    }

    private onSpeechSessionStopped = (r: Recognizer, e: SessionEventArgs) => {
        this.privSpeechState = SpeechState.Inactive;
    }

    /**
     * Fire a cancel event
     * @param error
     */
    private fireCancelEvent(error: any): void {
        try {
            if (!!this.canceled) {
                const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                    error?.reason ?? CancellationReason.Error,
                    error?.errorDetails ?? error,
                    error?.errorCode ?? CancellationErrorCode.RuntimeError,
                    undefined,
                    error?.sessionId);

                this.canceled(this, cancelEvent);
            }
        } catch (e) {
            //
        }
    }

    /**
     * Cancel the speech websocket
     */
    private cancelSpeech(): void {
        try {
            this.privIsSpeaking = false;
            this.privTranslationRecognizer?.stopContinuousRecognitionAsync();
            this.privTranslationRecognizerConnection?.closeConnection();
            this.privTranslationRecognizerConnection = undefined;
            this.privTranslationRecognizer = undefined;
            this.privSpeechState = SpeechState.Inactive;
        } catch (e) {
            // ignore the error
        }
    }

    private get canSpeak(): boolean {

        // is there a Conversation websocket available
        if (!this.privConversation.isConnected) {
            return false;
        }

        // is the user already speaking
        if (this.privIsSpeaking || this.privSpeechState === SpeechState.Connected || this.privSpeechState === SpeechState.Connecting) {
            return false;
        }

        // is the user muted
        if (this.privConversation.isMutedByHost) {
            return false;
        }

        return true;
    }

    private handleCallback(cb: Callback, err: Callback): void {
        if (!!cb) {
            try {
                cb();
            } catch (e) {
                if (!!err) {
                    err(e);
                }
            }
            cb = undefined;
        }
    }

    private handleError(error: any, err: Callback): void {
        if (!!err) {
            if (error instanceof Error) {
                const typedError: Error = error as Error;
                err(typedError.name + ": " + typedError.message);

            } else {
                err(error);
            }
        }
    }
}
