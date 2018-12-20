import { PropertyCollection, ResultReason, SpeechRecognitionResult } from "./Exports";
/**
 * Intent recognition result.
 * @class
 */
export declare class IntentRecognitionResult extends SpeechRecognitionResult {
    private privIntentId;
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param intentId - The intent id.
     * @param resultId - The result id.
     * @param reason - The reason.
     * @param text - The recognized text.
     * @param duration - The duration.
     * @param offset - The offset into the stream.
     * @param errorDetails - Error details, if provided.
     * @param json - Additional Json, if provided.
     * @param properties - Additional properties, if provided.
     */
    constructor(intentId?: string, resultId?: string, reason?: ResultReason, text?: string, duration?: number, offset?: number, errorDetails?: string, json?: string, properties?: PropertyCollection);
    /**
     * A String that represents the intent identifier being recognized.
     * @member IntentRecognitionResult.prototype.intentId
     * @function
     * @public
     * @returns {string} A String that represents the intent identifier being recognized.
     */
    readonly intentId: string;
}
