// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// eslint-disable-next-line max-classes-per-file
import {
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig
} from "../../common.speech/Exports";
import {
    BackgroundEvent,
    Events,
    Timeout
} from "../../common/Exports";
import { AudioConfigImpl } from "../../sdk/Audio/AudioConfig";
import { Contracts } from "../../sdk/Contracts";
import {
    AudioConfig,
    Connection,
    ConnectionEventArgs,
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    PropertyCollection,
    PropertyId,
    Recognizer,
    SessionEventArgs,
    SpeechTranslationConfig
} from "../../sdk/Exports";
import { SpeechTranslationConfigImpl } from "../../sdk/SpeechTranslationConfig";
import { ConversationImpl } from "../../sdk/Transcription/Conversation";
import { Callback, IConversation } from "../../sdk/Transcription/IConversation";
import { ConversationConnectionFactory } from "./ConversationConnectionFactory";
import { ConversationServiceAdapter } from "./ConversationServiceAdapter";
import {
    ConversationReceivedTranslationEventArgs,
    LockRoomEventArgs,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs
} from "./ConversationTranslatorEventArgs";
import {
    ConversationRecognizer,
} from "./ConversationTranslatorInterfaces";

export class ConversationRecognizerFactory {
    public static fromConfig(conversation: IConversation, speechConfig: SpeechTranslationConfig, audioConfig?: AudioConfig): ConversationRecognizer {
        return new ConversationTranslatorRecognizer(conversation, speechConfig, audioConfig);
    }
}

/**
 * Sends messages to the Conversation Translator websocket and listens for incoming events containing websocket messages.
 * Based off the recognizers in the SDK folder.
 */
export class ConversationTranslatorRecognizer extends Recognizer implements ConversationRecognizer {

    private privIsDisposed: boolean;
    private privSpeechRecognitionLanguage: string;
    private privConnection: Connection;
    private privConversation: ConversationImpl;
    private privTimeoutToken: any;
    private privSetTimeout: (cb: () => void, delay: number) => number;
    private privClearTimeout: (id: number) => void;

    public constructor(conversation: IConversation, speechConfig: SpeechTranslationConfig, audioConfig?: AudioConfig) {
        const serviceConfigImpl = speechConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(serviceConfigImpl, "speechConfig");
        const conversationImpl = conversation as ConversationImpl;
        Contracts.throwIfNull(conversationImpl, "conversationImpl");

        super(audioConfig, serviceConfigImpl.properties, new ConversationConnectionFactory());

        this.privConversation = conversationImpl;
        this.privIsDisposed = false;
        this.privProperties = serviceConfigImpl.properties.clone();
        this.privConnection = Connection.fromRecognizer(this);
        const webWorkerLoadType: string = this.privProperties.getProperty(PropertyId.WebWorkerLoadType, "on").toLowerCase();
        this.privSetTimeout = (webWorkerLoadType === "on" && typeof (Blob) !== "undefined" && typeof (Worker) !== "undefined") ? Timeout.setTimeout : setTimeout;
        this.privClearTimeout = (webWorkerLoadType === "on" && typeof (Blob) !== "undefined" && typeof (Worker) !== "undefined") ? Timeout.clearTimeout : clearTimeout;
    }

    public canceled: (sender: ConversationRecognizer, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: ConversationRecognizer, event: ConversationExpirationEventArgs) => void;
    public lockRoomCommandReceived: (sender: ConversationRecognizer, event: LockRoomEventArgs) => void;
    public muteAllCommandReceived: (sender: ConversationRecognizer, event: MuteAllEventArgs) => void;
    public participantJoinCommandReceived: (sender: ConversationRecognizer, event: ParticipantEventArgs) => void;
    public participantLeaveCommandReceived: (sender: ConversationRecognizer, event: ParticipantEventArgs) => void;
    public participantUpdateCommandReceived: (sender: ConversationRecognizer, event: ParticipantAttributeEventArgs) => void;
    public connectionOpened: (sender: ConversationRecognizer, event: SessionEventArgs) => void;
    public connectionClosed: (sender: ConversationRecognizer, event: SessionEventArgs) => void;
    public translationReceived: (sender: ConversationRecognizer, event: ConversationReceivedTranslationEventArgs) => void;
    public participantsListReceived: (sender: ConversationRecognizer, event: ParticipantsListEventArgs) => void;
    public participantsChanged: (sender: ConversationRecognizer, event: ConversationParticipantsChangedEventArgs) => void;

    public set connected(cb: (e: ConnectionEventArgs) => void) {
        this.privConnection.connected = cb;
    }

    public set disconnected(cb: (e: ConnectionEventArgs) => void) {
        this.privConnection.disconnected = cb;
    }

    /**
     * Return the speech language used by the recognizer
     */
    public get speechRecognitionLanguage(): string {
        return this.privSpeechRecognitionLanguage;
    }

    /**
     * Return the properties for the recognizer
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    /**
     * Connect to the recognizer
     * @param token
     */
    public connect(token: string, cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(token, "token");
            this.privReco.conversationTranslatorToken = token;
            this.resetConversationTimeout();
            this.privReco.connectAsync(cb, err);
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error as string);
                }
            }
        }
    }

    /**
     * Disconnect from the recognizer
     */
    public disconnect(cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            if (this.privTimeoutToken !== undefined) {
               // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
               this.privClearTimeout(this.privTimeoutToken);
            }
            this.privReco.disconnect().then((): void => {
                if (!!cb) {
                    cb();
                }
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
            });
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error as string);
                }
            }
            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Send the mute all participants command to the websocket
     * @param conversationId
     * @param participantId
     * @param isMuted
     */
    public sendRequest(command: string, cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            this.sendMessage(command, cb, err);
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error as string);
                }
            }

            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Close and dispose the recognizer
     */
    public async close(): Promise<void> {
        if (!this.privIsDisposed) {
            if (!!this.privConnection) {
                this.privConnection.closeConnection();
                this.privConnection.close();
            }
            this.privConnection = undefined;
            await this.dispose(true);
        }
    }

    /**
     * Dispose the recognizer
     * @param disposing
     */
    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privIsDisposed) {
            return;
        }
        if (disposing) {
            if (this.privTimeoutToken !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                this.privClearTimeout(this.privTimeoutToken);
            }
            this.privIsDisposed = true;
            if (!!this.privConnection) {
                this.privConnection.closeConnection();
                this.privConnection.close();
                this.privConnection = undefined;
            }
            await super.dispose(disposing);
        }
    }

    /**
     * Create the config for the recognizer
     * @param speechConfig
     */
    protected createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(speechConfig, this.privProperties);
    }

    /**
     * Create the service recognizer.
     * The audio source is redundnant here but is required by the implementation.
     * @param authentication
     * @param connectionFactory
     * @param audioConfig
     * @param recognizerConfig
     */
    protected createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase {

        const audioSource: AudioConfigImpl = audioConfig as AudioConfigImpl;

        return new ConversationServiceAdapter(authentication, connectionFactory, audioSource, recognizerConfig, this);
    }

    private sendMessage(msg: string, cb?: Callback, err?: Callback): void {
        const withAsync = this.privReco as ConversationServiceAdapter;
        const PromiseToEmptyCallback = <T>(promise: Promise<T>, cb?: Callback, err?: Callback): void => {
            if (promise !== undefined) {
                promise.then((): void => {
                    try {
                        if (!!cb) {
                            cb();
                        }
                    } catch (e) {
                        if (!!err) {
                            err(`'Unhandled error on promise callback: ${e as string}'`);
                        }
                    }
                }, (reason: any): void => {
                    try {
                        if (!!err) {
                            err(reason);
                        }
                        // eslint-disable-next-line no-empty
                    } catch (error) { }
                });
            } else {
                if (!!err) {
                    err("Null promise");
                }
            }
        };

        PromiseToEmptyCallback(withAsync.sendMessageAsync(msg), cb, err);
        this.resetConversationTimeout();
    }

    private resetConversationTimeout(): void {
        if (this.privTimeoutToken !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            this.privClearTimeout(this.privTimeoutToken);
        }

        this.privTimeoutToken = this.privSetTimeout((): void => {
            this.sendRequest(this.privConversation.getKeepAlive());
        }, 60000);
    }

}
