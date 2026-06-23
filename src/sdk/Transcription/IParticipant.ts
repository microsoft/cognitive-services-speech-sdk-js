// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { PropertyCollection } from "../Exports.js";

/**
 * Represents a user in a conversation.
 * Added in version 1.4.0
 */
export interface IUser {
    /** Gets the user's ID */
    readonly userId: string;
}

export class User implements IUser {
    private privUserId: string;

    public constructor(userId: string) {
        this.privUserId = userId;
    }

    public get userId(): string {
        return this.privUserId;
    }
}

export interface VoiceSignature {
    Version: number;
    Tag: string;
    Data: string;
}

export interface TranscriptionParticipant {
    /** The unique identifier for the participant. */
    readonly id: string;
    /** The participant's preferred spoken language. */
    readonly preferredLanguage: string;
    /** The participant's voice signature */
    readonly voice: string;
}

/**
 * Represents a participant in a meeting.
 * Added in version 1.4.0
 */
export interface IParticipant extends TranscriptionParticipant {
    /** Contains properties of the participant. */
    readonly properties: PropertyCollection;
}

export class Participant implements IParticipant {
    private privId: string;
    private privPreferredLanguage: string;
    private privVoice: string;
    private privProperties: PropertyCollection;

    public constructor(id: string, preferredLanguage: string, voice?: string) {
        this.privId = id;
        this.privPreferredLanguage = preferredLanguage;
        this.privVoice = voice;
        this.privProperties = new PropertyCollection();
    }

    public get id(): string {
        return this.privId;
    }

    public get preferredLanguage(): string {
        return this.privPreferredLanguage;
    }

    public get voice(): string {
        return this.privVoice;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public static From(id: string, language: string, voice: string): IParticipant {
        return new Participant(id, language, voice);
    }
}
