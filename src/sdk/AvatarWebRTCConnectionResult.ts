// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ResultReason,
    PropertyCollection,
    SynthesisResult
} from "./Exports.js";

/**
 * Defines the avatar WebRTC connection result.
 * @class AvatarWebRTCConnectionResult
 * Added in version 1.33.0
 *
 * @experimental This feature is experimental and might change in the future.
 */
export class AvatarWebRTCConnectionResult extends SynthesisResult {
    private readonly privSDPAnswer: RTCSessionDescriptionInit;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {RTCSessionDescriptionInit} SDPAnswer - The SDP answer of WebRTC connection.
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    public constructor(SDPAnswer?: RTCSessionDescriptionInit, resultId?: string, reason?: ResultReason, errorDetails?: string, properties?: PropertyCollection) {
        super(resultId, reason, errorDetails, properties);
        this.privSDPAnswer = SDPAnswer;
    }

    /**
     * Specifies SDP (Session Description Protocol) answer of WebRTC connection.
     * @member AvatarWebRTCConnectionResult.prototype.SDPAnswer
     * @function
     * @public
     * @returns {RTCSessionDescriptionInit} Specifies the SDP answer of WebRTC connection.
     */
    public get SDPAnswer(): RTCSessionDescriptionInit {
        return this.privSDPAnswer;
    }
}
