import { PropertyCollection, RecognitionResult, ResultReason } from "./Exports";
/**
 * Defines result of speech recognition.
 * @class SpeechRecognitionResult
 */
export declare class SpeechRecognitionResult extends RecognitionResult {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @public
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    constructor(resultId?: string, reason?: ResultReason, text?: string, duration?: number, offset?: number, errorDetails?: string, json?: string, properties?: PropertyCollection);
}
