// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, ResultReason } from "./Exports.js";

/**
 * Defines result of speech recognition.
 * @class RecognitionResult
 */
export class RecognitionResult {
    private privResultId: string;
    private privReason: ResultReason;
    private privText: string;
    private privDuration: number;
    private privOffset: number;
    private privLanguage: string;
    private privLanguageDetectionConfidence: string;
    private privErrorDetails: string;
    private privJson: string;
    private privProperties: PropertyCollection;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} language - Primary Language detected, if provided.
     * @param {string} languageDetectionConfidence - Primary Language confidence ("Unknown," "Low," "Medium," "High"...), if provided.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    public constructor(resultId?: string, reason?: ResultReason, text?: string, duration?: number,
                offset?: number, language?: string, languageDetectionConfidence?: string, errorDetails?: string, json?: string, properties?: PropertyCollection) {
        this.privResultId = resultId;
        this.privReason = reason;
        this.privText = text;
        this.privDuration = duration;
        this.privOffset = offset;
        this.privLanguage = language;
        this.privLanguageDetectionConfidence = languageDetectionConfidence;
        this.privErrorDetails = errorDetails;
        this.privJson = json;
        this.privProperties = properties;
    }

    /**
     * Specifies the result identifier.
     * @member RecognitionResult.prototype.resultId
     * @function
     * @public
     * @returns {string} Specifies the result identifier.
     */
    public get resultId(): string {
        return this.privResultId;
    }

    /**
     * Specifies status of the result.
     * @member RecognitionResult.prototype.reason
     * @function
     * @public
     * @returns {ResultReason} Specifies status of the result.
     */
    public get reason(): ResultReason {
        return this.privReason;
    }

    /**
     * Presents the recognized text in the result.
     * @member RecognitionResult.prototype.text
     * @function
     * @public
     * @returns {string} Presents the recognized text in the result.
     */
    public get text(): string {
        return this.privText;
    }

    /**
     * Duration of recognized speech in 100 nano second increments.
     * @member RecognitionResult.prototype.duration
     * @function
     * @public
     * @returns {number} Duration of recognized speech in 100 nano second increments.
     */
    public get duration(): number {
        return this.privDuration;
    }

    /**
     * Offset of recognized speech in 100 nano second increments.
     * @member RecognitionResult.prototype.offset
     * @function
     * @public
     * @returns {number} Offset of recognized speech in 100 nano second increments.
     */
    public get offset(): number {
        return this.privOffset;
    }

    /**
     * Primary Language detected.
     * @member RecognitionResult.prototype.language
     * @function
     * @public
     * @returns {string} language detected.
     */
    public get language(): string {
        return this.privLanguage;
    }

    /**
     * Primary Language detection confidence (Unknown, Low, Medium, High).
     * @member RecognitionResult.prototype.languageDetectionConfidence
     * @function
     * @public
     * @returns {string} detection confidence strength.
     */
    public get languageDetectionConfidence(): string {
        return this.privLanguageDetectionConfidence;
    }

    /**
     * In case of an unsuccessful recognition, provides details of the occurred error.
     * @member RecognitionResult.prototype.errorDetails
     * @function
     * @public
     * @returns {string} a brief description of an error.
     */
    public get errorDetails(): string {
        return this.privErrorDetails;
    }

    /**
     * A string containing Json serialized recognition result as it was received from the service.
     * @member RecognitionResult.prototype.json
     * @function
     * @private
     * @returns {string} Json serialized representation of the result.
     */
    public get json(): string {
        return this.privJson;
    }

    /**
     * The set of properties exposed in the result.
     * @member RecognitionResult.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The set of properties exposed in the result.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }
}
