// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

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
 * Represents a participant in a conversation.
 * Added in version 1.4.0
 */
export interface IParticipant extends TranscriptionParticipant {
    /** Gets the colour of the user's avatar as an HTML hex string (e.g. FF0000 for red). */
    readonly avatar: string;
    /**
     * The participant's display name. Please note that there may be more than one participant
     * with the same name. You can use <see cref="Id"/> property to tell them apart.
     */
    readonly displayName: string;
    /** Gets whether or not this participant is the host. */
    readonly isHost: boolean;
    /** Gets whether or not this participant is muted. */
    readonly isMuted: boolean;
    /** Gets whether or not the participant is using Text To Speech (TTS). */
    readonly isUsingTts: boolean;
    /** Contains properties of the participant. */
    readonly properties: PropertyCollection;
}

export class Participant implements IParticipant {
    private privAvatar: string;
    private privDisplayName: string;
    private privId: string;
    private privIsHost: boolean;
    private privIsMuted: boolean;
    private privIsUsingTts: boolean;
    private privPreferredLanguage: string;
    private privVoice: string;
    private privProperties: PropertyCollection;

    public constructor(id: string, avatar: string, displayName: string, isHost: boolean, isMuted: boolean, isUsingTts: boolean, preferredLanguage: string, voice?: string) {
        this.privId = id;
        this.privAvatar = avatar;
        this.privDisplayName = displayName;
        this.privIsHost = isHost;
        this.privIsMuted = isMuted;
        this.privIsUsingTts = isUsingTts;
        this.privPreferredLanguage = preferredLanguage;
        this.privVoice = voice;
        this.privProperties = new PropertyCollection();
    }

    public get avatar(): string {
        return this.privAvatar;
    }

    public get displayName(): string {
        return this.privDisplayName;
    }

    public get id(): string {
        return this.privId;
    }

    public get preferredLanguage(): string {
        return this.privPreferredLanguage;
    }

    public get isHost(): boolean {
        return this.privIsHost;
    }

    public get isMuted(): boolean {
        return this.privIsMuted;
    }

    public get isUsingTts(): boolean {
        return this.privIsUsingTts;
    }

    public get voice(): string {
        return this.privVoice;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public static From(id: string, language: string, voice: string): IParticipant {
        return new Participant(id, "", id, false, false, false, language, voice);
    }
}
