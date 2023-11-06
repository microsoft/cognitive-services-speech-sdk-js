// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, RecognitionResult, ResultReason } from "./Exports.js";

/**
 * Defines result of speech recognition.
 * @class SpeechRecognitionResult
 */
export class SpeechRecognitionResult extends RecognitionResult {
    private readonly privSpeakerId: string;
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @public
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} language - Primary Language detected, if provided.
     * @param {string} languageDetectionConfidence - Primary Language confidence ("Unknown," "Low," "Medium," "High"...), if provided.
     * @param {string} speakerId - speaker id for conversation transcription, if provided.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    public constructor(resultId?: string, reason?: ResultReason, text?: string,
                       duration?: number, offset?: number, language?: string,
                       languageDetectionConfidence?: string, speakerId?: string, errorDetails?: string,
                       json?: string, properties?: PropertyCollection) {
        super(resultId, reason, text, duration, offset, language, languageDetectionConfidence, errorDetails, json, properties);
        this.privSpeakerId = speakerId;
    }

    /**
     * speaker id from conversation transcription/id scenarios
     * @member SpeechRecognitionResult.prototype.speakerId
     * @function
     * @public
     * @returns {string} id of speaker in given result
     */
    public get speakerId(): string {
        return this.privSpeakerId;
    }

}
