// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { ConversationConnection, ConversationTranslatorConfig, IInternalConversation } from "../../common.speech/Exports";
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
    RecognitionEventArgs,
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
import { ParticipantChangedReason } from "./ParticipantChangedReason";

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
        return this.privConversation?.connection?.participants;
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
            Contracts.throwIfNullOrUndefined(conversation, "conversation");
            Contracts.throwIfNullOrUndefined(nickname, "nickname");

            if (this.privConversation) {
                this.privConversation.close();
                this.privConversation = undefined;
                this.privSpeechTranslationConfig.close();
                this.privSpeechTranslationConfig = undefined;
            }

            if (typeof conversation === "string") {

                if (lang === undefined) { lang = ConversationTranslatorConfig.defaultLanguageCode; }

                // create a placecholder config
                this.privSpeechTranslationConfig = SpeechTranslationConfig.fromSubscription("abcdefghijklmnopqrstuvwxyz012345", "westus");
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

                this.privConversation.joinConversationAsync(
                    conversation,
                    nickname,
                    lang,
                    ((result: IInternalConversation) => {

                        this.privSpeechTranslationConfig.authorizationToken = result.cognitiveSpeechAuthToken;

                        // connect to the ws
                        this.privConversation.startConversationAsync(() => {
                            this.addEvents();

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
                        });

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

                Contracts.throwIfNullOrUndefined(this.privConversation.connection, "conversation not available");
                Contracts.throwIfNullOrUndefined(this.privConversation.room.token, "missing credentials");

                this.privSpeechTranslationConfig = conversation.config;


                this.addEvents();
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
            this.privConversation.deleteConversationAsync();

            if (!!cb) {
            cb();
            }

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
     */
    public sendTextMessageAsync(message: string): void {
        if (!!this.privConversation) {
            this.privConversation.connection.sendTextMessage(message);
        }
    }

    /**
     * Start speaking
     */
    public startTranscribingAsync(): void {
        this.startSpeaking();
    }

    /**
     * Stop speaking
     */
    public stopTranscribingAsync(): void {
        this.stopSpeaking();
    }

    /**
     * Connect to the speech translation recognizer.
     * Currently there is no language validation performed before sending the SpeechLanguage code to the service.
     * If it's an invalid language the raw error will be: 'Error during WebSocket handshake: Unexpected response code: 400'
     * e.g. pass in 'fr' instead of 'fr-FR', or a text-only language 'cy'
     */
    public connectTranslatorRecognizer(): void {

        try {

            Contracts.throwIfNullOrUndefined(this.privConversation.room.token, "Missing credentials");

            if (this.privAudioConfig === undefined) {
                this.privAudioConfig = AudioConfig.fromDefaultMicrophoneInput();
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
                // ?
            };
            this.privTranslationRecognizerConnection.disconnected = (e: ConnectionEventArgs) => {
                this.cancel();
            };
            this.privTranslationRecognizer.recognized = (r: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
                // ignore
            };

            this.privTranslationRecognizer.recognizing = (r: TranslationRecognizer, e: TranslationRecognitionEventArgs) => {
                // ignore
            };

            this.privTranslationRecognizer.canceled = (r: TranslationRecognizer, e: TranslationRecognitionCanceledEventArgs) => {
                // fire a cancel event

                if (!!this.canceled) {

                    const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                        e.reason,
                        e.errorDetails,
                        e.errorCode,
                        undefined,
                        e.sessionId);

                    this.canceled(this, cancelEvent);
                }

                this.cancel();
            };

            this.privTranslationRecognizer.sessionStarted = (r: Recognizer, e: SessionEventArgs) => {
                // ignore
            };

            this.privTranslationRecognizer.sessionStopped = (r: Recognizer, e: SessionEventArgs) => {
                // TODO: very rarely get this event?
                // fire a cancel event

                if (!!this.canceled) {

                    const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                        CancellationReason.EndOfStream,
                        undefined,
                        undefined,
                        CancellationErrorCode.NoError,
                        undefined);

                    this.canceled(this, cancelEvent);
                }

                // this.cancelSpeech();
            };

            this.privTranslationRecognizer.speechEndDetected = (r: Recognizer, e: RecognitionEventArgs) => {
                // ignore
            };

            this.privTranslationRecognizer.speechStartDetected = (r: Recognizer, e: RecognitionEventArgs) => {
                // ignore
            };

        } catch (e) {
            // tslint:disable-next-line: no-console
            // console.log(e);

            // raise a cancellation event for speech errors, don't stop the conversation websocket
            if (!!this.canceled) {

                const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                    e?.reason ?? CancellationReason.Error,
                    e?.errorDetails ?? e,
                    e?.errorCode ?? CancellationErrorCode.RuntimeError,
                    undefined,
                    e?.sessionId);

                this.canceled(this, cancelEvent);
            }

            this.cancelSpeech();
        }
    }

    /**
     * Handle the start speaking request
     */
    public startSpeaking(): void {
        // TODO: fail silently if speak not supported currently
        if (!this.canSpeak()) { return; }

        if (this.privTranslationRecognizer === undefined) {
            this.connectTranslatorRecognizer();
            if (this.privTranslationRecognizer !== undefined) {
                this.startContinuousRecognition();
            }
        } else {
            this.startContinuousRecognition();
        }
    }

    /**
     * Handle the stop speaking request
     */
    public stopSpeaking(): void {
        if (this.privTranslationRecognizer === undefined) { return; }

        if (!this.privIsSpeaking) {
            this.cancelSpeech();
            return;
        }

        // stop the recognition but leave the websocket open
        this.privIsSpeaking = false;
        this.privTranslationRecognizer.stopContinuousRecognitionAsync(() => {

            // Is a cancel event sent here?
            if (!!this.canceled) {

                const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                    CancellationReason.EndOfStream,
                    undefined,
                    undefined,
                    CancellationErrorCode.NoError,
                    undefined);

                this.canceled(this, cancelEvent);
            }

        }, (error: any) => {

            if (!!this.canceled) {

                const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                    CancellationReason.Error,
                    error,
                    undefined,
                    CancellationErrorCode.RuntimeError,
                    undefined);

                this.canceled(this, cancelEvent);
            }

            this.cancelSpeech();
        });
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        if (this.isDisposed) {
            return;
        }
        this.privIsDisposed = true;
        this.privSpeechTranslationConfig?.close();
        this.privSpeechRecognitionLanguage = undefined;
        this.privProperties = undefined;
        this.privAudioConfig = undefined;
        this.privSpeechTranslationConfig = undefined;
        this.privConversation = undefined;
    }

    private startContinuousRecognition(): void {
        this.privTranslationRecognizer.startContinuousRecognitionAsync(
            () => { this.onStartContinuousRecognitionSuccess(); },
            (error: any) => { this.onStartContinuousRecognitionFailure(error); });
    }

    private onStartContinuousRecognitionSuccess(): void {
        this.privIsSpeaking = true;
    }

    private onStartContinuousRecognitionFailure(error: any): void {
        this.privIsSpeaking = false;
        if (!!this.canceled) {

            const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                CancellationReason.Error,
                error,
                undefined,
                CancellationErrorCode.RuntimeError,
                undefined);

            this.canceled(this, cancelEvent);
        }

        this.cancelSpeech();
    }

    private cancelSpeech(): void {
        try {
            this.privIsSpeaking = false;
            this.privTranslationRecognizer?.stopContinuousRecognitionAsync();
            this.privTranslationRecognizer?.close();
            this.privTranslationRecognizerConnection?.close();
            this.privTranslationRecognizerConnection = undefined;
        } catch (e) {
            // ignore the error
        }
    }

    private cancel(): void {

        this.cancelSpeech();
        this.dispose();
    }

    private canSpeak(): boolean {

        if (!this.privConversation.connection.isConnected) {
            return false;
        }

        if (this.privIsSpeaking) {
            return false;
        }

        if (this.privConversation.connection.isMutedByHost) {
            return false;
        }

        return true;
    }

    private addEvents(): void {

        Contracts.throwIfNullOrUndefined(this.privConversation, "conversation");
        Contracts.throwIfNullOrUndefined(this.privConversation.connection, "connection");

        this.privConversation.connection.canceled = ((sender: ConversationConnection, event: ConversationTranslationCanceledEventArgs) => {
            if (!!this.canceled) {
                this.canceled(this, event);
            }
            this.cancel();
        });
        this.privConversation.connection.conversationExpiration = ((sender: ConversationConnection, event: ConversationExpirationEventArgs) => {
            if (!!this.conversationExpiration) {
                this.conversationExpiration(this, event);
            }
        });
        this.privConversation.connection.participantsChanged = ((sender: ConversationConnection, event: ConversationParticipantsChangedEventArgs) => {
            try {
                if (!!this.participantsChanged) {
                    this.participantsChanged(this, event);
                }

                if (event.reason === ParticipantChangedReason.LeftConversation) {
                    // check the id
                    event.participants.forEach( (p: Participant) => {
                        if ((p.id === this.privConversation?.connection?.me?.id) || (p.id === this.privConversation?.connection?.host?.id)) {
                            // the current user or the host is leaving
                            this.privConversation.deleteConversationAsync();
                            this.cancel();
                        }
                    });
                }
            } catch (e) {
                //
            }
        });
        this.privConversation.connection.sessionStarted = ((sender: ConversationConnection, event: SessionEventArgs) => {
            if (!!this.sessionStarted) {
                this.sessionStarted(this, event);
            }
        });
        this.privConversation.connection.sessionStopped = ((sender: ConversationConnection, event: SessionEventArgs) => {
            if (!!this.sessionStarted) {
                this.sessionStopped(this, event);
            }
            this.cancel();
        });
        this.privConversation.connection.textMessageReceived = ((sender: ConversationConnection, event: ConversationTranslationEventArgs) => {
            if (!!this.textMessageReceived) {
                this.textMessageReceived(this, event);
            }
        });
        this.privConversation.connection.transcribed = ((sender: ConversationConnection, event: ConversationTranslationEventArgs) => {
            if (!!this.transcribed) {
                this.transcribed(this, event);
            }
        });
        this.privConversation.connection.transcribing = ((sender: ConversationConnection, event: ConversationTranslationEventArgs) => {
            if (!!this.transcribing) {
                this.transcribing(this, event);
            }
        });
    }

}
