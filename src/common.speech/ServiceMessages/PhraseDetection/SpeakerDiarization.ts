//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The speaker diarization mode
 */
export enum SpeakerDiarizationMode {
    None = "None",
    Identity = "Identity",
    Anonymous = "Anonymous"
}

/**
 * The identity provider
 */
export enum IdentityProvider {
    CallCenter = "CallCenter"
}

/**
 * The speaker diarization configuration
 */
export interface SpeakerDiarization {
    /**
     * The mode
     */
    mode?: SpeakerDiarizationMode;

    /**
     * The identity provider
     */
    identityProvider?: IdentityProvider;

    /**
     * A token that identifies a diarization session across reconnects
     */
    audioSessionId?: string;

    /**
     * The audio offset measured in msec to apply to the audio stream in case this is a session reconnect
     */
    audioOffsetMs?: number;

    /**
     * If set to true the diarization will be performed on the intermediate results
     */
    diarizeIntermediates?: boolean;
}
