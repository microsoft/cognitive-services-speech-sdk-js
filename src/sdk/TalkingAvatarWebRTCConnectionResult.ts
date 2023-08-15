// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ResultReason,
    PropertyCollection,
    SynthesisResult
} from "./Exports";

/**
 * Defines the talking avatar WebRTC connection result.
 * @class TalkingAvatarWebRTCConnectionResult
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change in the future.
 */
export class TalkingAvatarWebRTCConnectionResult extends SynthesisResult {
    private readonly privSDPAnswer: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} SDPAnswer - The SDP answer of WebRTC connection.
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    public constructor(SDPAnswer?: string, resultId?: string, reason?: ResultReason, errorDetails?: string, properties?: PropertyCollection) {
        super(resultId, reason, errorDetails, properties);
        this.privSDPAnswer = SDPAnswer;
    }

    /**
     * Specifies SDP (Session Description Protocol) answer of WebRTC connection.
     * @member TalkingAvatarWebRTCConnectionResult.prototype.SDPAnswer
     * @function
     * @public
     * @returns {string} Specifies the SDP answer of WebRTC connection.
     */
    public get SDPAnswer(): string {
        return this.privSDPAnswer;
    }
}
