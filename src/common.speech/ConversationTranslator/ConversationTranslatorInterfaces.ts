// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    SessionEventArgs } from "../../sdk/Exports";
// import { ConversationClient } from "./ConversationConnection";
import {
    ConversationReceivedTranslationEventArgs,
    LockRoomEventArgs,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs } from "./ConversationTranslatorEventArgs";

/**
 * Internal conversation data
 */
export interface IInternalConversation {
    // the token to use for connecting to the Speech Service
    cognitiveSpeechAuthToken: string;
    // the region to use for connecting to the Speech Service
    cognitiveSpeechRegion: string;
    // the unique id of the user who started or joined the Conversation
    participantId: string;
    // a descriptive name for the Conversation
    name: string;
    // a descriptive name for the Conversation
    description: string;
    // the speech model ID for custom speech
    speechModel: string;
    // represents the level of speech supported in the Conversation (0: everyone can speak, 2: only host can speak, 3: no-one can speak)
    modalities: number;
    // ?
    isApproved: boolean;
    // the mute flag has been set at room level and only the host can speak
    isMuted: boolean;
    // the 5 character conversation Id
    roomId: string;
    // the hex color string to represent a user. If there are many users this hex color may be reused (?).
    avatar: string;
    // the token to use when calling the websocket
    token: string;
    // used for tracking the session and help with troubleshooting problems in the logs
    correlationId: string;
    // extracted from the headers
    requestId: string;
}

/**
 * The user who is participating in the conversation.
 */
export interface IInternalParticipant {
    avatar?: string;
    displayName?: string;
    id?: string;
    isHost?: boolean;
    isMuted?: boolean;
    isUsingTts?: boolean;
    preferredLanguage?: string;
}

/** Users participating in the conversation */
export class InternalParticipants {

    constructor(public participants: IInternalParticipant[] = [], public meId?: string) {

    }

    public addOrUpdateParticipant(value: IInternalParticipant): void {
        if (value === undefined) {
            return;
        }

        const exists: number = this.getParticipantIndex(value.id);
        if (exists > -1) {
            this.participants.splice(exists, 1, value);
        } else {
            this.participants.push(value);
        }
    }

    public getParticipantIndex(id: string): number {
        return this.participants.findIndex((p: IInternalParticipant) => p.id === id);
    }

    public getParticipant(id: string): IInternalParticipant {
        return this.participants.find((p: IInternalParticipant) => p.id === id);
    }

    public deleteParticipant(id: string): void {
        this.participants = this.participants.filter((p: IInternalParticipant) => p.id !== id);
    }

    public get host(): IInternalParticipant {
        return this.participants.find((p: IInternalParticipant) => p.isHost === true );
    }

    public get me(): IInternalParticipant {
        return this.getParticipant(this.meId);
    }
}

/**
 * Recognizer for handling Conservation Translator websocket messages
 */
export interface IConversationTranslatorRecognizer {
    canceled: (sender: IConversationTranslatorRecognizer, event: ConversationTranslationCanceledEventArgs) => void;
    connectionOpened: (sender: IConversationTranslatorRecognizer, event: SessionEventArgs) => void;
    connectionClosed: (sender: IConversationTranslatorRecognizer, event: SessionEventArgs) => void;
    participantsListReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantsListEventArgs) => void;
    translationReceived: (sender: IConversationTranslatorRecognizer, event: ConversationReceivedTranslationEventArgs) => void;
    lockRoomCommandReceived: (sender: IConversationTranslatorRecognizer, event: LockRoomEventArgs) => void;
    muteAllCommandReceived: (sender: IConversationTranslatorRecognizer, event: MuteAllEventArgs) => void;
    participantJoinCommandReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantEventArgs) => void;
    participantLeaveCommandReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantEventArgs) => void;
    participantUpdateCommandReceived: (sender: IConversationTranslatorRecognizer, event: ParticipantAttributeEventArgs) => void;
}

/**
 * Wrapper for managing the connections to the Conversation and Speech websockets.
 */
export interface IConversationConnection {

    isConnected: boolean;
    isMutedByHost: boolean;
    participants: IInternalParticipant[];

    connect(room: IInternalConversation): void;
    disconnect(): void;
    sendTextMessage(message: string): void;
    toggleLockRoom(isLocked: boolean): void;
    toggleMuteAll(isMuted: boolean): void;
    toggleMuteParticipant(participantId: string, isMuted: boolean): void;
    ejectParticpant(participantId: string): void;
    // startSpeaking(): void;
    // stopSpeaking(): void;
    // onEvent(): void;
    canceled: (sender: IConversationConnection, event: ConversationTranslationCanceledEventArgs) => void;
    conversationExpiration: (sender: IConversationConnection, event: ConversationExpirationEventArgs) => void;
    participantsChanged: (sender: IConversationConnection, event: ConversationParticipantsChangedEventArgs) => void;
    sessionStarted: (sender: IConversationConnection, event: SessionEventArgs) => void;
    sessionStopped: (sender: IConversationConnection, event: SessionEventArgs) => void;
    textMessageReceived: (sender: IConversationConnection, event: ConversationTranslationEventArgs) => void;
    transcribed: (sender: IConversationConnection, event: ConversationTranslationEventArgs) => void;
    transcribing: (sender: IConversationConnection, event: ConversationTranslationEventArgs) => void;

}

/**
 * Error message returned from the Conversation Translator websocket
 */
export interface IConversationResponseErrorMessage {
    code: string;
    message: string;
}

/**
 * Error returned from the Conversation Translator websocket
 */
export interface IConversationResponseError {
    error: IConversationResponseErrorMessage;
}

/**
 * Base message command
 */
export interface IClientMessage {
    type: any;
}

/**
 * Command message
 */
export interface ICommandMessage extends IClientMessage {
    command?: string;
}

/**
 * Text message command
 */
export interface IInstantMessageCommand extends ICommandMessage {
    roomId: string;
    nickname?: string;
    participantId: string;
    text: string;
}

/**
 * Lock command
 */
export interface ILockConversationCommand extends ICommandMessage {
    id?: string; // incoming ws
    nickname?: string; // incoming ws
    participantId: string; // host - incoming ws
    roomid: string;
    value: boolean;
}

/**
 * Mute all command
 */
export interface IMuteAllCommand extends ICommandMessage {
    roomid: string;
    nickname?: string;  // incoming ws
    participantId: string; // host
    value: boolean;
    id?: string; // incoming ws
}

/**
 * Mute participant command
 */
export interface IMuteCommand extends ICommandMessage {
    roomid: string;
    nickname?: string;
    participantId: string; // participant
    value: boolean;
    id?: string; // incoming ws
}

/**
 * Remove participant command
 */
export interface IEjectParticipantCommand extends ICommandMessage {
    roomid: string;
    participantId: string; // participant
}

/**
 * List of command message types
 */
export const ConversationTranslatorMessageTypes = {
    command: "command",
    final: "final",
    info: "info",
    instantMessage: "instant_message",
    partial: "partial",
    participantCommand: "participant_command",
    translatedMessage: "translated_message"
};

/**
 * List of command types
 */
export const ConversationTranslatorCommandTypes = {
    changeNickname: "ChangeNickname",
    disconnectSession: "DisconnectSession",
    ejectParticipant: "EjectParticipant",
    instant_message: "instant_message",
    joinSession: "JoinSession",
    leaveSession: "LeaveSession",
    participantList: "ParticipantList",
    roomExpirationWarning: "RoomExpirationWarning",
    setLockState: "SetLockState",
    setMute: "SetMute",
    setMuteAll: "SetMuteAll",
    setProfanityFiltering: "SetProfanityFiltering",
    setTranslateToLanguages: "SetTranslateToLanguages",
    setUseTTS: "SetUseTTS"
};

/**
 * HTTP request helper
 */
export interface IRequestOptions {
    headers?: {[key: string]: string};
    ignoreCache?: boolean;
    timeout?: number;
}

/**
 * HTTP response helper
 */
export interface IResponse {
    ok: boolean;
    status: number;
    statusText: string;
    data: string;
    json: <T>() => T;
    headers: string;
}
