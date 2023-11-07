
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    RestConfigBase
} from "../../common.browser/RestConfigBase.js";

export class ConversationConnectionConfig extends RestConfigBase {

    private static readonly privHost: string = "dev.microsofttranslator.com";
    private static readonly privRestPath: string = "/capito/room";
    private static readonly privApiVersion: string = "2.0";
    private static readonly privDefaultLanguageCode: string = "en-US";
    private static readonly privClientAppId: string = "FC539C22-1767-4F1F-84BC-B4D811114F15";
    private static readonly privWebSocketPath: string = "/capito/translate";
    private static readonly privTranscriptionEventKeys: string[] = ["iCalUid", "callId", "organizer", "FLAC", "MTUri", "DifferentiateGuestSpeakers", "audiorecording", "Threadid", "OrganizerMri", "OrganizerTenantId", "UserToken"];

    public static get host(): string {
        return ConversationConnectionConfig.privHost;
    }

    public static get apiVersion(): string {
        return ConversationConnectionConfig.privApiVersion;
    }

    public static get clientAppId(): string {
        return ConversationConnectionConfig.privClientAppId;
    }

    public static get defaultLanguageCode(): string {
        return ConversationConnectionConfig.privDefaultLanguageCode;
    }

    public static get restPath(): string {
        return ConversationConnectionConfig.privRestPath;
    }

    public static get webSocketPath(): string {
        return ConversationConnectionConfig.privWebSocketPath;
    }

    public static get transcriptionEventKeys(): string[] {
        return ConversationConnectionConfig.privTranscriptionEventKeys;
    }
}
