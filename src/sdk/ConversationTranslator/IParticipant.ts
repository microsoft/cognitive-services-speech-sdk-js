// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection } from "../Exports";

/**
 * Represents a user in a conversation.
 * Added in version 1.4.0
 */
export interface IUser {
    /** Gets the user's ID */
    readonly userId: string;
}

/**
 * Represents a participant in a conversation.
 * Added in version 1.4.0
 */
export interface IParticipant {
    /** Gets the colour of the user's avatar as an HTML hex string (e.g. FF0000 for red). */
    readonly avatar: string;
    /**
     * The participant's display name. Please note that there may be more than one participant
     * with the same name. You can use <see cref="Id"/> property to tell them apart.
     */
    readonly displayName: string;
    /** The unique identifier for the participant. */
    readonly id: string;
    /** Gets whether or not this participant is the host. */
    readonly isHost: boolean;
    /** Gets whether or not this participant is muted. */
    readonly isMuted: boolean;
    /** Gets whether or not the participant is using Text To Speech (TTS). */
    readonly isUsingTts: boolean;
    /** The participant's preferred spoken language. */
    readonly preferredLanguage: string;
    /** Contains properties of the participant. */
    readonly properties: PropertyCollection;
}
