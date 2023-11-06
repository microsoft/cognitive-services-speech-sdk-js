// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, ResultReason, SpeechRecognitionResult } from "./Exports.js";

/**
 * Intent recognition result.
 * @class
 */
export class IntentRecognitionResult extends SpeechRecognitionResult {
    private privIntentId: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param intentId - The intent id.
     * @param resultId - The result id.
     * @param reason - The reason.
     * @param text - The recognized text.
     * @param duration - The duration.
     * @param offset - The offset into the stream.
     * @param language - Primary Language detected, if provided.
     * @param languageDetectionConfidence - Primary Language confidence ("Unknown," "Low," "Medium," "High"...), if provided.
     * @param errorDetails - Error details, if provided.
     * @param json - Additional Json, if provided.
     * @param properties - Additional properties, if provided.
     */
    public constructor(intentId?: string, resultId?: string, reason?: ResultReason, text?: string,
                duration?: number, offset?: number, language?: string, languageDetectionConfidence?: string,
                errorDetails?: string, json?: string, properties?: PropertyCollection) {
        super(resultId, reason, text, duration, offset, language, languageDetectionConfidence, undefined, errorDetails, json, properties);

        this.privIntentId = intentId;
    }

    /**
     * A String that represents the intent identifier being recognized.
     * @member IntentRecognitionResult.prototype.intentId
     * @function
     * @public
     * @returns {string} A String that represents the intent identifier being recognized.
     */
    public get intentId(): string {
        return this.privIntentId;
    }
}
