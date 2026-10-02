// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Inline commit: helpers for reading the commit token the service echoes back.
// Kept free of imports so that both the SDK result classes and the service
// recognizers can use them without introducing module cycles.

export const ClientAudioMetadataPropertyName: string = "clientAudioMetadata";
export const CommitTokenHeaderName: string = "X-Client-Commit-Token";
export const CommitChannelIndexHeaderName: string = "X-Client-Commit-Channel-Index";

// Defensive cap on the size of the echoed metadata object.
const MaxClientAudioMetadataSize: number = 4096;
const MaxCommitToken: number = 0xFFFFFFFF;

/**
 * Returns the commit token in the clientAudioMetadata of a parsed phrase object,
 * or 0 if there is none (the result is not a commit acknowledgment).
 */
export const commitTokenFromPhrase = (phrase: unknown): number => {
    if (phrase === null || typeof phrase !== "object") {
        return 0;
    }

    const metadata: unknown = (phrase as { [key: string]: unknown })[ClientAudioMetadataPropertyName];
    if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
        return 0;
    }

    if (JSON.stringify(metadata).length > MaxClientAudioMetadataSize) {
        return 0;
    }

    const value: unknown = (metadata as { [key: string]: unknown })[CommitTokenHeaderName];
    if (typeof value !== "string" || !/^[0-9]+$/.test(value)) {
        return 0;
    }

    const token: number = parseInt(value, 10);
    return token <= MaxCommitToken ? token : 0;
};

/**
 * Returns the commit token in a phrase JSON string, or 0 if there is none.
 */
export const commitTokenFromJson = (json: string): number => {
    // Cheap pre-check so ordinary results are not parsed again.
    if (!json || json.indexOf(ClientAudioMetadataPropertyName) < 0) {
        return 0;
    }

    try {
        return commitTokenFromPhrase(JSON.parse(json));
    } catch {
        return 0;
    }
};
