// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConversationConnectionFactory } from "../../common.speech/ConversationTranslator/ConversationConnectionFactory";
import {
    ConversationTranslatorCommandTypes,
    ConversationTranslatorMessageTypes,
    IEjectParticipantCommand,
    IInstantMessageCommand,
    ILockConversationCommand,
    IMuteAllCommand,
    IMuteCommand } from "../../common.speech/ConversationTranslator/ConversationTranslatorInterfaces";
import {
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig
} from "../../common.speech/Exports";
import { AudioConfigImpl } from "../../sdk/Audio/AudioConfig";
import { Contracts } from "../../sdk/Contracts";
import { AudioConfig,
    ConversationExpirationEventArgs,
    ConversationTranslationCanceledEventArgs,
    PropertyCollection,
    Recognizer,
    SessionEventArgs,
    SpeechTranslationConfig } from "../../sdk/Exports";
import { SpeechTranslationConfigImpl } from "../../sdk/SpeechTranslationConfig";
import { ConversationServiceAdapter } from "./ConversationServiceAdapter";
import {
    ConversationReceivedTranslationEventArgs,
    LockRoomEventArgs,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs } from "./ConversationTranslatorEventArgs";
import { IConversationTranslatorRecognizer } from "./ConversationTranslatorInterfaces";

/**
 * Sends messages to the Conversation Translator websocket and listens for incoming events containing websocket messages.
 * Based off the recognizers in the SDK folder.
 */
export class ConversationTranslatorRecognizer extends Recognizer implements IConversationTranslatorRecognizer {

    private privIsDisposed: boolean;
    private privSpeechRecognitionLanguage: string;

    public constructor(speechConfig: SpeechTranslationConfig, audioConfig?: AudioConfig) {
        const serviceConfigImpl = speechConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(speechConfig, "speechConfig");

        super(audioConfig, serviceConfigImpl.properties, new ConversationConnectionFactory());

        this.privIsDisposed = false;
        this.privProperties = serviceConfigImpl.properties.clone();

    }

    public canceled: (sender: IConversationTranslatorRecognizer, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: IConversationTranslatorRecognizer, event: ConversationExpirationEventArgs) => void;
    public lockRoomCommandReceived: (sender: IConversationTranslatorRecognizer, event: LockRoomEventArgs) => void;
    public muteAllCommandReceived: (sender: IConversationTranslatorRecognizer, event: MuteAllEventArgs) => void;
    public participantJoinCommandReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantEventArgs) => void;
    public participantLeaveCommandReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantEventArgs) => void;
    public participantUpdateCommandReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantAttributeEventArgs) => void;
    public connectionOpened: (sender: IConversationTranslatorRecognizer, event: SessionEventArgs) => void;
    public connectionClosed: (sender: IConversationTranslatorRecognizer, event: SessionEventArgs) => void;
    public translationReceived: (sender: IConversationTranslatorRecognizer, event: ConversationReceivedTranslationEventArgs) => void;
    public participantsListReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantsListEventArgs) => void;

    /**
     * Connect to the recognizer
     * @param token
     */
    public connect(token: string, cb?: () => void, err?: (e: string) => void): void {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.privReco.conversationTranslatorToken = token;
        this.privReco.connect();

        if (!!cb) {
            cb();
        }
    }

    /**
     * Disconnect from the recognizer
     */
    public disconnect(): void {
        this.privReco.disconnect();
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

    /**
     * Send the text message command to the websocket
     * @param conversationId
     * @param participantId
     * @param message
     */
    public sendMessageRequest(conversationId: string, participantId: string, message: string): void {

        Contracts.throwIfNullOrWhitespace(conversationId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");
        Contracts.throwIfNullOrWhitespace(message, "message");

        const command: IInstantMessageCommand = {
            // tslint:disable-next-line: object-literal-shorthand
            participantId: participantId,
            roomId: conversationId,
            text: message,
            type: ConversationTranslatorMessageTypes.instantMessage
        };

        this.sendMessage(command);
    }

    /**
     * Send the lock conversation command to the websocket
     * @param conversationId
     * @param participantId
     * @param isLocked
     */
    public sendLockRequest(conversationId: string, participantId: string, isLocked: boolean): void {

        Contracts.throwIfNullOrWhitespace(conversationId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");
        Contracts.throwIfNullOrUndefined(isLocked, "isLocked");

        const command: ILockConversationCommand = {
            command: ConversationTranslatorCommandTypes.setLockState,
            // tslint:disable-next-line: object-literal-shorthand
            participantId: participantId,
            roomid: conversationId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: isLocked
        };

        this.sendMessage(command);
    }

    /**
     * Send the mute all participants command to the websocket
     * @param conversationId
     * @param participantId
     * @param isMuted
     */
    public sendMuteAllRequest(conversationId: string, participantId: string, isMuted: boolean): void {

        Contracts.throwIfNullOrWhitespace(conversationId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");
        Contracts.throwIfNullOrUndefined(isMuted, "isMuted");

        const command: IMuteAllCommand = {
            command: ConversationTranslatorCommandTypes.setMuteAll,
            // tslint:disable-next-line: object-literal-shorthand
            participantId: participantId, // the id of the host
            roomid: conversationId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: isMuted
        };

        this.sendMessage(command);
    }

    /**
     * Send the mute participant command to the websocket
     * @param conversationId
     * @param participantId
     * @param isMuted
     */
    public sendMuteRequest(conversationId: string, participantId: string, isMuted: boolean): void {

        Contracts.throwIfNullOrWhitespace(conversationId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");
        Contracts.throwIfNullOrUndefined(isMuted, "isMuted");

        const command: IMuteCommand = {
            command: ConversationTranslatorCommandTypes.setMute,
            // tslint:disable-next-line: object-literal-shorthand
            participantId: participantId, // the id of the participant
            roomid: conversationId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: isMuted
        };

        this.sendMessage(command);
    }

    /**
     * Send the eject participant command to the websocket
     * @param conversationId
     * @param participantId
     */
    public sendEjectRequest(conversationId: string, participantId: string): void {

        Contracts.throwIfNullOrWhitespace(conversationId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");

        const command: IEjectParticipantCommand = {
            command: ConversationTranslatorCommandTypes.ejectParticipant,
            // tslint:disable-next-line: object-literal-shorthand
            participantId: participantId,
            roomid: conversationId,
            type: ConversationTranslatorMessageTypes.participantCommand,
        };

        this.sendMessage(command);
    }

    /**
     * Close and dispose the recognizer
     */
    public close(): void {
        Contracts.throwIfDisposed(this.privIsDisposed);

        this.dispose(true);
    }

    /**
     * Dispose the recognizer
     * @param disposing
     */
    protected dispose(disposing: boolean): boolean {
        if (this.privIsDisposed) {
            return;
        }

        if (disposing) {
            // this.implRecognizerStop();
            this.privIsDisposed = true;
            super.dispose(disposing);
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

    /**
     * Takes the outgoing message and stringifies it for submission to the websocket
     * @param message
     */
    private sendMessage(message: any): void {

        // validate the current state and silently fail
        if (undefined === message) { return; }
        if (undefined === this.privReco) { return; }

        // send the message
        this.privReco.sendMessage(JSON.stringify(message));
    }
}
