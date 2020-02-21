// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { ConversationTranslatorConfig, IInternalConversation } from "../../common.speech/Exports";
import { IDisposable } from "../../common/Exports";
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
    TranslationRecognizer } from "../Exports";
import { ConversationImpl } from "./Conversation";
import {
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    Participant,
 } from "./Exports";
import { IConversationTranslator } from "./IConversationTranslator";

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

    public canceled: (sender: ConversationTranslator, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: ConversationTranslator, event: ConversationExpirationEventArgs) => void;
    public participantsChanged: (sender: ConversationTranslator, event: ConversationParticipantsChangedEventArgs) => void;
    public sessionStarted: (sender: ConversationTranslator, event: SessionEventArgs) => void;
    public sessionStopped: (sender: ConversationTranslator, event: SessionEventArgs) => void;
    public textMessageReceived: (sender: ConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribed: (sender: ConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribing: (sender: ConversationTranslator, event: ConversationTranslationEventArgs) => void;

    /**
     * Join a conversation. If this is the host, pass in the previously created Conversation object.
     * @param conversation
     * @param nickname
     * @param lang
     * @param cb
     * @param err
     */
    public joinConversationAsync(conversation: any, nickname: any, lang?: any, cb?: () => void, err?: (e: string) => void): void {

        try {
            Contracts.throwIfNullOrWhitespace(conversation, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "conversation id"));
            Contracts.throwIfNullOrWhitespace(nickname, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "nickname"));

            if (this.privConversation) {
                this.privConversation.dispose();
                this.privConversation = undefined;
                this.privSpeechTranslationConfig.close();
                this.privSpeechTranslationConfig = undefined;
            }

            if (typeof conversation === "string") {

                if (lang === undefined || lang === null || lang === "") { lang = ConversationTranslatorConfig.defaultLanguageCode; }

                // create a placecholder config
                this.privSpeechTranslationConfig = SpeechTranslationConfig.fromSubscription(
                    ConversationTranslatorConfig.auth.placeholderSubscriptionKey,
                    ConversationTranslatorConfig.auth.placeholderRegion);
                this.privSpeechTranslationConfig.setProfanity(ProfanityOption.Masked);
                this.privSpeechTranslationConfig.addTargetLanguage(lang);
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage], lang);
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Name], nickname);

                const endpoint: string = this.privProperties.getProperty(PropertyId.ConversationTranslator_Host);
                if (endpoint) {
                    this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Host], endpoint);
                }
                const speechEndpointHost: string = this.privProperties.getProperty(PropertyId.ConversationTranslator_SpeechHost);
                if (speechEndpointHost) {
                    this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_SpeechHost], speechEndpointHost);
                }

                // join the conversation
                this.privConversation = new ConversationImpl(this.privSpeechTranslationConfig);
                this.privConversation.conversationTranslator = this;

                this.privConversation.joinConversationAsync(
                    conversation,
                    nickname,
                    lang,
                    ((result: IInternalConversation) => {

                        this.privSpeechTranslationConfig.authorizationToken = result.cognitiveSpeechAuthToken;

                        // connect to the ws
                        this.privConversation.startConversationAsync(
                            (() => {

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
                            }),
                            ((error: any) => {
                                if (!!err) {
                                    if (error instanceof Error) {
                                        const typedError: Error = error as Error;
                                        err(typedError.name + ": " + typedError.message);
                                    } else {
                                        err(error);
                                    }
                                }
                            }));

                     }),
                    ((error: any) => {
                        if (!!err) {
                            if (error instanceof Error) {
                                const typedError: Error = error as Error;
                                err(typedError.name + ": " + typedError.message);
                            } else {
                                err(error);
                            }
                        }
                     }));

            } else if (typeof conversation === "object") {

                this.privConversation = conversation as ConversationImpl;
                this.privConversation.conversationTranslator = this;

                Contracts.throwIfNullOrUndefined(this.privConversation, ConversationTranslatorConfig.strings.permissionDeniedConnect);
                Contracts.throwIfNullOrUndefined(this.privConversation.room.token, ConversationTranslatorConfig.strings.permissionDeniedConnect);

                this.privSpeechTranslationConfig = conversation.config;

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

        } catch (error) {
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

    /**
     * Leave the conversation
     * @param cb
     * @param err
     */
    public leaveConversationAsync(cb?: () => void, err?: (e: string) => void): void {

        try {

            // stop the speech websocket
            this.cancelSpeech();

            // stop the websocket
            this.privConversation.endConversationAsync(cb, err);

            // https delete request
            this.privConversation.deleteConversationAsync(
                (() => {
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
                }),
                ((error: any) => {
                    if (!!err) {
                        if (error instanceof Error) {
                            const typedError: Error = error as Error;
                            err(typedError.name + ": " + typedError.message);
                        } else {
                            err(error);
                        }
                    }
                }));

            this.dispose();

        } catch (error) {
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

    /**
     * Send a text message
     * @param message
     * @param cb
     * @param err
     */
    public sendTextMessageAsync(message: string, cb?: () => void, err?: (e: string) => void): void {

        Contracts.throwIfNullOrUndefined(this.privConversation, ConversationTranslatorConfig.strings.permissionDeniedSend);
        Contracts.throwIfNullOrWhitespace(message, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", message));

        this.privConversation?.sendTextMessageAsync(message, cb, err);
    }

    /**
     * Start speaking
     * @param cb
     * @param err
     */
    public startTranscribingAsync(cb?: () => void, err?: (e: string) => void): void {

        Contracts.throwIfNullOrUndefined(this.privConversation, ConversationTranslatorConfig.strings.permissionDeniedSend);
        Contracts.throwIfNullOrUndefined(this.privConversation.room.token, ConversationTranslatorConfig.strings.permissionDeniedConnect);
        Contracts.throwIfNullOrUndefined(!this.canSpeak(), ConversationTranslatorConfig.strings.permissionDeniedSend);

        if (this.privTranslationRecognizer === undefined) {
            this.connectTranslatorRecognizer(
                (() => {
                    this.startContinuousRecognition(
                    (() => {
                        this.privIsSpeaking = true;

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
                    }),
                    ((error: any) => {

                        this.privIsSpeaking = false;
                        this.fireCancelEvent(error);
                        this.cancelSpeech();
                        if (!!err) {
                            if (error instanceof Error) {
                                const typedError: Error = error as Error;
                                err(typedError.name + ": " + typedError.message);
                            } else {
                                err(error);
                            }
                        }
                    }));
                }),
                ((error: any) => {
                    if (!!err) {
                        if (error instanceof Error) {
                            const typedError: Error = error as Error;
                            err(typedError.name + ": " + typedError.message);
                        } else {
                            err(error);
                        }
                    }
                }));
        } else {
            this.startContinuousRecognition(
                (() => {
                    this.privIsSpeaking = true;

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
                }),
                ((error: any) => {
                    this.privIsSpeaking = false;
                    this.fireCancelEvent(error);
                    this.cancelSpeech();

                    if (!!err) {
                        if (error instanceof Error) {
                            const typedError: Error = error as Error;
                            err(typedError.name + ": " + typedError.message);
                        } else {
                            err(error);
                        }
                    }
                }));
        }
    }

    /**
     * Stop speaking
     * @param cb
     * @param err
     */
    public stopTranscribingAsync(cb?: () => void, err?: (e: string) => void): void {

        Contracts.throwIfNullOrUndefined(this.privConversation, ConversationTranslatorConfig.strings.permissionDeniedSend);
        Contracts.throwIfNullOrUndefined(this.privTranslationRecognizer, ConversationTranslatorConfig.strings.permissionDeniedSend);

        if (!this.privIsSpeaking) {
            this.cancelSpeech();
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
            return;
        }

        // stop the recognition but leave the websocket open
        this.privIsSpeaking = false;
        this.privTranslationRecognizer.stopContinuousRecognitionAsync(() => {
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
        }, (error: any) => {

            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }
            this.cancelSpeech();
        });
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
    private connectTranslatorRecognizer(cb?: () => void, err?: (e: string) => void): void {

        try {

            if (this.privAudioConfig === undefined) {
                this.privAudioConfig = AudioConfig.fromDefaultMicrophoneInput();
            }

            // clear the temp subscription key if it's a participant joining
            if (this.privSpeechTranslationConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key])
                    === ConversationTranslatorConfig.auth.placeholderSubscriptionKey) {
                this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Key], "");
            }

            const token: string = encodeURIComponent(this.privConversation.room.token);

            let endpointHost: string = this.privSpeechTranslationConfig.getProperty(
                PropertyId[PropertyId.ConversationTranslator_SpeechHost], ConversationTranslatorConfig.speechHost);
            endpointHost = endpointHost.replace("{region}", this.privConversation.room.cognitiveSpeechRegion);

            const url: string = `wss://${endpointHost}${ConversationTranslatorConfig.speechPath}?${ConversationTranslatorConfig.params.token}=${token}`;

            this.privSpeechTranslationConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Endpoint], url);

            this.privTranslationRecognizer = new TranslationRecognizer(this.privSpeechTranslationConfig, this.privAudioConfig);
            this.privTranslationRecognizerConnection = Connection.fromRecognizer(this.privTranslationRecognizer);
            this.privTranslationRecognizerConnection.connected = (e: ConnectionEventArgs) => {
                // set internal flag
            };
            this.privTranslationRecognizerConnection.disconnected = (e: ConnectionEventArgs) => {
                // set internal flag
                this.cancelSpeech();
            };
            this.privTranslationRecognizer.recognized = (r: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
                // ignore
                // add support for getting recognitions from here if own speech
            };

            this.privTranslationRecognizer.recognizing = (r: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
                // ignore
                // add support for getting recognitions from here if own speech
            };

            this.privTranslationRecognizer.canceled = (r: TranslationRecognizer, e: TranslationRecognitionCanceledEventArgs) => {
                // set internal flag

                try {
                    this.cancelSpeech();
                    this.fireCancelEvent(e); // ?
                } catch (error) {
                    //
                }

            };

            this.privTranslationRecognizer.sessionStarted = (r: Recognizer, e: SessionEventArgs) => {
                // ignore
                 // set internal flag
            };

            this.privTranslationRecognizer.sessionStopped = (r: Recognizer, e: SessionEventArgs) => {
                // TODO: very rarely get this event?
                // fire a cancel event
                 // set internal flag

            };

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

        } catch (error) {

            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            this.cancelSpeech();
            // this.fireCancelEvent(error);

        }
    }

    /**
     * Handle the start speaking request
     * @param cb
     * @param err
     */
    private startContinuousRecognition(cb?: () => void, err?: (e: string) => void): void {
        this.privTranslationRecognizer.startContinuousRecognitionAsync(cb, err);
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
        } catch (e) {
            // ignore the error
        }
    }

    private cancel(): void {

        this.cancelSpeech();
        this.dispose();
    }

    private canSpeak(): boolean {

        // is there a Conversation websocket available
        if (!this.privConversation.isConnected) {
            return false;
        }

        // is the user already speaking
        if (this.privIsSpeaking) {
            return false;
        }

        // is the user muted
        if (this.privConversation.isMutedByHost) {
            return false;
        }

        return true;
    }

}
