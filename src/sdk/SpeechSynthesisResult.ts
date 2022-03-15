// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, ResultReason, SynthesisResult } from "./Exports";

/**
 * Defines result of speech synthesis.
 * @class SpeechSynthesisResult
 * Added in version 1.11.0
 */
export class SpeechSynthesisResult extends SynthesisResult {
    private privAudioData: ArrayBuffer;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {number} audioData - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    public constructor(resultId?: string, reason?: ResultReason,  audioData?: ArrayBuffer,
                errorDetails?: string, properties?: PropertyCollection) {
        super(resultId, reason, errorDetails, properties);
        this.privAudioData = audioData;
    }

    /**
     * The synthesized audio data
     * @member SpeechSynthesisResult.prototype.audioData
     * @function
     * @public
     * @returns {ArrayBuffer} The synthesized audio data.
     */
    public get audioData(): ArrayBuffer {
        return this.privAudioData;
    }
}
