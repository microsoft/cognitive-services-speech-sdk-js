// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, ResultReason } from "./Exports";

/**
 * Defines result of speech synthesis.
 * @class SpeechSynthesisResult
 * Added in version 1.11.0
 */
export class SpeechSynthesisResult {
    private privResultId: string;
    private privReason: ResultReason;
    private privText: string;
    private privAudioData: ArrayBuffer;
    private privOffset: number;
    private privErrorDetails: string;
    private privProperties: PropertyCollection;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {number} audioData - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    constructor(resultId?: string, reason?: ResultReason,  audioData?: ArrayBuffer,
                errorDetails?: string, properties?: PropertyCollection) {
        this.privResultId = resultId;
        this.privReason = reason;
        this.privAudioData = audioData;
        this.privErrorDetails = errorDetails;
        this.privProperties = properties;
    }

    /**
     * Specifies the result identifier.
     * @member SpeechSynthesisResult.prototype.resultId
     * @function
     * @public
     * @returns {string} Specifies the result identifier.
     */
    public get resultId(): string {
        return this.privResultId;
    }

    /**
     * Specifies status of the result.
     * @member SpeechSynthesisResult.prototype.reason
     * @function
     * @public
     * @returns {ResultReason} Specifies status of the result.
     */
    public get reason(): ResultReason {
        return this.privReason;
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

    /**
     * In case of an unsuccessful synthesis, provides details of the occurred error.
     * @member SpeechSynthesisResult.prototype.errorDetails
     * @function
     * @public
     * @returns {string} a brief description of an error.
     */
    public get errorDetails(): string {
        return this.privErrorDetails;
    }

    /**
     *  The set of properties exposed in the result.
     * @member SpeechSynthesisResult.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The set of properties exposed in the result.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }
}
