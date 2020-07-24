// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig
} from "../../common.speech/Exports";
import {
    BackgroundEvent,
    Events
} from "../../common/Exports";
import { AudioConfigImpl } from "../../sdk/Audio/AudioConfig";
import { Contracts } from "../../sdk/Contracts";
import {
    AudioConfig,
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    PropertyCollection,
    Recognizer,
    SessionEventArgs,
    SpeechTranslationConfig
} from "../../sdk/Exports";
import { SpeechTranslationConfigImpl } from "../../sdk/SpeechTranslationConfig";
import { Callback } from "../../sdk/Transcription/IConversation";
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
    ConversationTranslatorCommandTypes,
    ConversationTranslatorMessageTypes,
    IChangeNicknameCommand,
    IEjectParticipantCommand,
    IInstantMessageCommand,
    IInternalConversation,
    ILockConversationCommand,
    IMuteAllCommand,
    IMuteCommand
} from "./ConversationTranslatorInterfaces";
import { PromiseToEmptyCallback } from "./ConversationUtils";

/**
 * Sends messages to the Conversation Translator websocket and listens for incoming events containing websocket messages.
 * Based off the recognizers in the SDK folder.
 */
export class ConversationTranslatorRecognizer extends Recognizer implements ConversationRecognizer {

    private privIsDisposed: boolean;
    private privSpeechRecognitionLanguage: string;
    private privRoom: IInternalConversation;

    public constructor(speechConfig: SpeechTranslationConfig, audioConfig?: AudioConfig) {
        const serviceConfigImpl = speechConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(serviceConfigImpl, "speechConfig");

        super(audioConfig, serviceConfigImpl.properties, new ConversationConnectionFactory());

        this.privIsDisposed = false;
        this.privProperties = serviceConfigImpl.properties.clone();

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

    public set conversation(value: IInternalConversation) {
        this.privRoom = value;
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
            this.privReco.connectAsync(cb, err);
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
     * Disconnect from the recognizer
     */
    public disconnect(cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            this.privRoom = undefined;
            this.privReco.disconnect().then(() => {
                if (!!cb) {
                    cb();
                }
            }, (error: string) => {
                if (!!err) {
                    err(error);
                }
            });
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }
            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Send the text message command to the websocket
     * @param conversationId
     * @param participantId
     * @param message
     */
    public sendMessageRequest(message: string, cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
            Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");
            Contracts.throwIfNullOrWhitespace(message, "message");

            const command: IInstantMessageCommand = {
                // tslint:disable-next-line: object-literal-shorthand
                participantId: this.privRoom.participantId,
                roomId: this.privRoom.roomId,
                text: message,
                type: ConversationTranslatorMessageTypes.instantMessage
            };

            this.sendMessage(JSON.stringify(command), cb, err);

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Send the lock conversation command to the websocket
     * @param conversationId
     * @param participantId
     * @param isLocked
     */
    public sendLockRequest(isLocked: boolean, cb?: () => void, err?: (e: string) => void): void {

        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
            Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");
            Contracts.throwIfNullOrUndefined(isLocked, "isLocked");

            const command: ILockConversationCommand = {
                command: ConversationTranslatorCommandTypes.setLockState,
                // tslint:disable-next-line: object-literal-shorthand
                participantId: this.privRoom.participantId,
                roomid: this.privRoom.roomId,
                type: ConversationTranslatorMessageTypes.participantCommand,
                value: isLocked
            };

            this.sendMessage(JSON.stringify(command), cb, err);
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
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
    public sendMuteAllRequest(isMuted: boolean, cb?: () => void, err?: (e: string) => void): void {

        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
            Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");
            Contracts.throwIfNullOrUndefined(isMuted, "isMuted");

            const command: IMuteAllCommand = {
                command: ConversationTranslatorCommandTypes.setMuteAll,
                // tslint:disable-next-line: object-literal-shorthand
                participantId: this.privRoom.participantId, // the id of the host
                roomid: this.privRoom.roomId,
                type: ConversationTranslatorMessageTypes.participantCommand,
                value: isMuted
            };

            this.sendMessage(JSON.stringify(command), cb, err);
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Send the mute participant command to the websocket
     * @param conversationId
     * @param participantId
     * @param isMuted
     */
    public sendMuteRequest(participantId: string, isMuted: boolean, cb?: () => void, err?: (e: string) => void): void {

        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
            Contracts.throwIfNullOrWhitespace(participantId, "participantId");
            Contracts.throwIfNullOrUndefined(isMuted, "isMuted");

            const command: IMuteCommand = {
                command: ConversationTranslatorCommandTypes.setMute,
                // tslint:disable-next-line: object-literal-shorthand
                participantId: participantId, // the id of the participant
                roomid: this.privRoom.roomId,
                type: ConversationTranslatorMessageTypes.participantCommand,
                value: isMuted
            };

            this.sendMessage(JSON.stringify(command), cb, err);
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Send the eject participant command to the websocket
     * @param conversationId
     * @param participantId
     */
    public sendEjectRequest(participantId: string, cb?: () => void, err?: (e: string) => void): void {

        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
            Contracts.throwIfNullOrWhitespace(participantId, "participantId");

            const command: IEjectParticipantCommand = {
                command: ConversationTranslatorCommandTypes.ejectParticipant,
                // tslint:disable-next-line: object-literal-shorthand
                participantId: participantId,
                roomid: this.privRoom.roomId,
                type: ConversationTranslatorMessageTypes.participantCommand,
            };

            this.sendMessage(JSON.stringify(command), cb, err);

            if (!!cb) {
                try {
                    cb();
                } catch (e) {
                    if (!!err) {
                        err(e);
                    }
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

            // Destroy the recognizer.
            this.dispose(true).catch((reason: string): void => {
                Events.instance.onEvent(new BackgroundEvent(reason));
            });

        }
    }

    /**
     * Send the mute participant command to the websocket
     * @param conversationId
     * @param participantId
     * @param isMuted
     */
    public sendChangeNicknameRequest(nickname: string, cb?: () => void, err?: (e: string) => void): void {

        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
            Contracts.throwIfNullOrWhitespace(nickname, "nickname");

            const command: IChangeNicknameCommand = {
                command: ConversationTranslatorCommandTypes.changeNickname,
                nickname,
                // tslint:disable-next-line: object-literal-shorthand
                participantId: this.privRoom.participantId, // the id of the host
                roomid: this.privRoom.roomId,
                type: ConversationTranslatorMessageTypes.participantCommand,
                value: nickname
            };

            this.sendMessage(JSON.stringify(command), cb, err);

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
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
        Contracts.throwIfDisposed(this.privIsDisposed);
        await this.dispose(true);
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
            this.privIsDisposed = true;
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
        PromiseToEmptyCallback(withAsync.sendMessageAsync(msg), cb, err);
    }

}
