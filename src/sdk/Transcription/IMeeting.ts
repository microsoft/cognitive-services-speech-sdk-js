// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, SpeechTranslationConfig } from "../Exports.js";
import { TranscriptionParticipant } from "./IParticipant.js";

export type Callback = (result?: any) => void;

/**
 * Manages meetings.
 */
export interface IMeeting {

    config: SpeechTranslationConfig;

    /**
     * Gets/sets authorization token used to communicate with the service.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     * expires, the caller needs to refresh it by calling this setter with a new valid token.
     * Otherwise, the recognizer will encounter errors during recognition.
     */
    authorizationToken: string;

    /** Gets the unique identifier for the current meeting. */
    readonly meetingId: string;

    /** Gets the collection of properties and their values defined for this instance. */
    readonly properties: PropertyCollection;

    /** Gets the language name that is used for recognition. */
    readonly speechRecognitionLanguage: string;

}

export interface MeetingProperties {
    [key: string]: any;
    id?: string;
    attendees?: TranscriptionParticipant[];
    record?: string;
}

export interface MeetingInfo {
    id: string;
    participants: TranscriptionParticipant[];
    meetingProperties: MeetingProperties;
}
