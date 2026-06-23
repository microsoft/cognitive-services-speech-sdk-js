
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    RestConfigBase
} from "../../common.browser/RestConfigBase.js";

export class ConversationConnectionConfig extends RestConfigBase {

    private static readonly privDefaultLanguageCode: string = "en-US";
    private static readonly privTranscriptionEventKeys: string[] = ["iCalUid", "callId", "organizer", "FLAC", "MTUri", "DifferentiateGuestSpeakers", "audiorecording", "Threadid", "OrganizerMri", "OrganizerTenantId", "UserToken"];

    public static get defaultLanguageCode(): string {
        return ConversationConnectionConfig.privDefaultLanguageCode;
    }

    public static get transcriptionEventKeys(): string[] {
        return ConversationConnectionConfig.privTranscriptionEventKeys;
    }
}
