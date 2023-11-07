// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/* eslint-disable max-classes-per-file */
import { ConversationTranslationResult, SessionEventArgs } from "../../sdk/Exports.js";
import { IInternalParticipant } from "./ConversationTranslatorInterfaces.js";

export class MuteAllEventArgs extends SessionEventArgs {
    private privIsMuted: boolean;

    public constructor(isMuted: boolean, sessionId?: string) {
        super(sessionId);

        this.privIsMuted = isMuted;
    }

    public get isMuted(): boolean {
        return this.privIsMuted;
    }
}

export class LockRoomEventArgs extends SessionEventArgs {
    private privIsLocked: boolean;

    public constructor(isLocked: boolean, sessionId?: string) {
        super(sessionId);

        this.privIsLocked = isLocked;
    }

    public get isMuted(): boolean {
        return this.privIsLocked;
    }
}

export class ParticipantEventArgs extends SessionEventArgs {
    private privParticipant: IInternalParticipant;

    public constructor(participant: IInternalParticipant, sessionId?: string) {
        super(sessionId);
        this.privParticipant = participant;
    }

    public get participant(): IInternalParticipant {
        return this.privParticipant;
    }
}

export class ParticipantAttributeEventArgs extends SessionEventArgs {
    private privValue: boolean | number | string | string[];
    private privKey: string;
    private privParticipantId: string;

    public constructor(participantId: string, key: string, value: boolean | number | string |  string[], sessionId?: string) {
        super(sessionId);

        this.privKey = key;
        this.privValue = value;
        this.privParticipantId = participantId;
    }

    public get value(): boolean | number | string |  string[] {
        return this.privValue;
    }

    public get key(): string {
        return this.privKey;
    }
    public get id(): string {
        return this.privParticipantId;
    }
}

export class ParticipantsListEventArgs extends SessionEventArgs {

    private privRoomId: string;
    private privSessionToken: string;
    private privTranslateTo: string[];
    private privProfanityFilter: string;
    private privRoomProfanityFilter: string;
    private privIsRoomLocked: boolean;
    private privIsMuteAll: boolean;
    private privParticipants: IInternalParticipant[];

    public constructor(conversationId: string, token: string, translateTo: string[], profanityFilter: string,
                       roomProfanityFilter: string, isRoomLocked: boolean, isMuteAll: boolean, participants: IInternalParticipant[], sessionId?: string) {
        super(sessionId);
        this.privRoomId = conversationId;
        this.privSessionToken = token;
        this.privTranslateTo = translateTo;
        this.privProfanityFilter = profanityFilter;
        this.privRoomProfanityFilter = roomProfanityFilter;
        this.privIsRoomLocked = isRoomLocked;
        this.privIsRoomLocked = isMuteAll;
        this.privParticipants = participants;
    }
    public get sessionToken(): string {
        return this.privSessionToken;
    }

    public get conversationId(): string {
        return this.privRoomId;
    }

    public get translateTo(): string[] {
        return this.privTranslateTo;
    }

    public get profanityFilter(): string {
        return this.privProfanityFilter;
    }

    public get roomProfanityFilter(): string {
        return this.privRoomProfanityFilter;
    }

    public get isRoomLocked(): boolean {
        return this.privIsRoomLocked;
    }

    public get isMuteAll(): boolean {
        return this.privIsMuteAll;
    }

    public get participants(): IInternalParticipant[] {
        return this.privParticipants;
    }
}

export class ConversationReceivedTranslationEventArgs {
    private privPayload: ConversationTranslationResult;
    private privCommand: string;
    private privSessionId: string;

    public constructor(command: string, payload: ConversationTranslationResult,  sessionId?: string) {
        this.privPayload = payload;
        this.privCommand = command;
        this.privSessionId = sessionId;
    }

    public get payload(): ConversationTranslationResult {
        return this.privPayload;
    }

    public get command(): string {
        return this.privCommand;
    }

    public get sessionId(): string {
        return this.privSessionId;
    }
}
