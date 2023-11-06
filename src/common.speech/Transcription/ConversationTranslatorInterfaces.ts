// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionEventArgs,
    ConversationExpirationEventArgs,
    ConversationTranslationCanceledEventArgs,
    SessionEventArgs,
    } from "../../sdk/Exports.js";
// import { ConversationClient } from "./ConversationConnection";
import {
    ConversationReceivedTranslationEventArgs,
    LockRoomEventArgs,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs } from "./ConversationTranslatorEventArgs.js";

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
    // the mute flag has been set at conversation level and only the host can speak
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
    // set programmatically
    isHost: boolean;
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
    profanity?: boolean;
    preferredLanguage?: string;
    translateToLanguages?: string[];
    voice?: string;
}

/** Users participating in the conversation */
export class InternalParticipants {

    public constructor(public participants: IInternalParticipant[] = [], public meId?: string) {

    }

    /**
     * Add or update a participant
     * @param value
     */
    public addOrUpdateParticipant(value: IInternalParticipant): IInternalParticipant {
        if (value === undefined) {
            return;
        }

        const exists: number = this.getParticipantIndex(value.id);
        if (exists > -1) {
            this.participants.splice(exists, 1, value);
        } else {
            this.participants.push(value);
        }

        // ensure it was added ok
        return this.getParticipant(value.id);
    }

    /**
     * Find the participant's position in the participants list.
     * @param id
     */
    public getParticipantIndex(id: string): number {
        return this.participants.findIndex((p: IInternalParticipant): boolean => p.id === id);
    }

    /**
     * Find the participant by id.
     * @param id
     */
    public getParticipant(id: string): IInternalParticipant {
        return this.participants.find((p: IInternalParticipant): boolean => p.id === id);
    }

    /**
     * Remove a participant from the participants list.
     */
    public deleteParticipant(id: string): void {
        this.participants = this.participants.filter((p: IInternalParticipant): boolean => p.id !== id);
    }

    /**
     * Helper to return the conversation host.
     */
    public get host(): IInternalParticipant {
        return this.participants.find((p: IInternalParticipant): boolean => p.isHost === true );
    }

    /**
     * Helper to return the current user.
     */
    public get me(): IInternalParticipant {
        return this.getParticipant(this.meId);
    }
}

/**
 * Recognizer for handling Conversation Translator websocket messages
 */
export interface ConversationRecognizer {
    isDisposed(): boolean;
    sendRequest: (command: string, cb?: () => void, err?: (e: string) => void) => void;
    cancelSpeech?: () => Promise<void>;
    close?: () => Promise<void>;
    conversationExpiration?: (sender: ConversationRecognizer, event: ConversationExpirationEventArgs) => void;
    connected?: (e: ConnectionEventArgs) => void;
    disconnected?: (e: ConnectionEventArgs) => void;
    canceled?: (sender: ConversationRecognizer, event: ConversationTranslationCanceledEventArgs) => void;
    connectionOpened?: (sender: ConversationRecognizer, event: SessionEventArgs) => void;
    connectionClosed?: (sender: ConversationRecognizer, event: SessionEventArgs) => void;
    participantsListReceived?: (sender: ConversationRecognizer, event: ParticipantsListEventArgs) => void;
    translationReceived?: (sender: ConversationRecognizer, event: ConversationReceivedTranslationEventArgs) => void;
    lockRoomCommandReceived?: (sender: ConversationRecognizer, event: LockRoomEventArgs) => void;
    muteAllCommandReceived?: (sender: ConversationRecognizer, event: MuteAllEventArgs) => void;
    participantJoinCommandReceived?: (sender: ConversationRecognizer, event: ParticipantEventArgs) => void;
    participantLeaveCommandReceived?: (sender: ConversationRecognizer, event: ParticipantEventArgs) => void;
    participantUpdateCommandReceived?: (sender: ConversationRecognizer, event: ParticipantAttributeEventArgs) => void;
    connect?: (token: string, cb?: () => void, err?: (e: string) => void) => void;
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
 * Change nickname command
 */
export interface IChangeNicknameCommand extends ICommandMessage {
    roomid: string;
    participantId: string;
    nickname: string;
    value: string;
}

/**
 * List of command message types
 */
export const ConversationTranslatorMessageTypes = {
    command: "command",
    final: "final",
    info: "info",
    instantMessage: "instant_message",
    keepAlive: "keep_alive",
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
