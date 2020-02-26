// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the payload for incoming list of participants
 */
export interface IParticipantsListPayloadResponse {
    roomid: string;
    id: string;
    command: string;
    participants: IParticipantPayloadResponse[];
    token: string;
    translateTo: string[];
    profanityFilter: string;
    roomProfanityFilter: string;
    roomLocked: boolean;
    muteAll: boolean;
    type: string;
}

/**
 * Defines the payload for incoming participant
 */
export interface IParticipantPayloadResponse {
    nickname: string;
    locale: string;
    usetts: boolean;
    ismuted: boolean;
    ishost: boolean;
    participantId: string;
    avatar?: string;
}

export class ParticipantsListPayloadResponse implements IParticipantsListPayloadResponse {
    private privParticipantsPayloadResponse: IParticipantsListPayloadResponse;

    private constructor(json: string) {
        this.privParticipantsPayloadResponse = JSON.parse(json);
    }

    public static fromJSON(json: string): ParticipantsListPayloadResponse {
        return new ParticipantsListPayloadResponse(json);
    }

    public get roomid(): string {
        return this.privParticipantsPayloadResponse.roomid;
    }

    public get id(): string {
        return this.privParticipantsPayloadResponse.id;
    }

    public get command(): string {
        return this.privParticipantsPayloadResponse.command;
    }

    public get participants(): IParticipantPayloadResponse[] {
        return this.privParticipantsPayloadResponse.participants;
    }

    public get token(): string {
        return this.privParticipantsPayloadResponse.token;
    }

    public get translateTo(): string[] {
        return this.privParticipantsPayloadResponse.translateTo;
    }

    public get profanityFilter(): string {
        return this.privParticipantsPayloadResponse.profanityFilter;
    }

    public get roomProfanityFilter(): string {
        return this.privParticipantsPayloadResponse.roomProfanityFilter;
    }

    public get roomLocked(): boolean {
        return this.privParticipantsPayloadResponse.roomLocked;
    }

    public get muteAll(): boolean {
        return this.privParticipantsPayloadResponse.muteAll;
    }

    public get type(): string {
        return this.privParticipantsPayloadResponse.type;
    }

}

// tslint:disable-next-line: max-classes-per-file
export class ParticipantPayloadResponse implements IParticipantPayloadResponse {

    private privParticipantPayloadResponse: IParticipantPayloadResponse;

    private constructor(json: string) {
        this.privParticipantPayloadResponse = JSON.parse(json);
    }

    public static fromJSON(json: string): ParticipantPayloadResponse {
        return new ParticipantPayloadResponse(json);
    }

    public get nickname(): string {
        return this.privParticipantPayloadResponse.nickname;
    }

    public get locale(): string {
        return this.privParticipantPayloadResponse.locale;
    }

    public get usetts(): boolean {
        return this.privParticipantPayloadResponse.usetts;
    }

    public get ismuted(): boolean {
        return this.privParticipantPayloadResponse.ismuted;
    }

    public get ishost(): boolean {
        return this.privParticipantPayloadResponse.ishost;
    }

    public get participantId(): string {
        return this.privParticipantPayloadResponse.participantId;
    }

    public get avatar(): string {
        return this.privParticipantPayloadResponse.avatar;
    }
}
