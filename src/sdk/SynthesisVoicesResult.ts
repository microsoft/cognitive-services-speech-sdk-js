// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IVoiceJson,
    PropertyCollection,
    ResultReason,
    SynthesisResult,
    VoiceInfo,
} from "./Exports.js";

/**
 * Defines result of speech synthesis.
 * @class SynthesisVoicesResult
 * Added in version 1.20.0
 */
export class SynthesisVoicesResult extends SynthesisResult {
    private privVoices: VoiceInfo[];

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param requestId - result id for request.
     * @param json - json payload from endpoint.
     */
    public constructor(requestId: string, json: any, errorDetails: string ) {
        if (Array.isArray(json)) {
            super(requestId, ResultReason.VoicesListRetrieved, undefined, new PropertyCollection());
            this.privVoices = [];
            for (const item of json) {
                this.privVoices.push(new VoiceInfo(item as IVoiceJson));
            }
        } else {
            super(requestId, ResultReason.Canceled, errorDetails ? errorDetails : "Error information unavailable", new PropertyCollection());
        }
    }

    /**
     * The list of voices
     * @member SynthesisVoicesResult.prototype.voices
     * @function
     * @public
     * @returns {VoiceInfo[]} List of synthesized voices.
     */
    public get voices(): VoiceInfo[] {
        return this.privVoices;
    }
}
