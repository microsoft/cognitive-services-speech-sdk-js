import { PropertyCollection, ResultReason } from "./Exports";
/**
 * Defines result of speech recognition.
 * @class RecognitionResult
 */
export declare class RecognitionResult {
    private privResultId;
    private privReason;
    private privText;
    private privDuration;
    private privOffset;
    private privErrorDetails;
    private privJson;
    private privProperties;
    /**
     * Creates and initializes an instance of this class.
     * @constructor
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
    /**
     * Specifies the result identifier.
     * @member RecognitionResult.prototype.resultId
     * @function
     * @public
     * @returns {string} Specifies the result identifier.
     */
    readonly resultId: string;
    /**
     * Specifies status of the result.
     * @member RecognitionResult.prototype.reason
     * @function
     * @public
     * @returns {ResultReason} Specifies status of the result.
     */
    readonly reason: ResultReason;
    /**
     * Presents the recognized text in the result.
     * @member RecognitionResult.prototype.text
     * @function
     * @public
     * @returns {string} Presents the recognized text in the result.
     */
    readonly text: string;
    /**
     * Duration of recognized speech in 100 nano second incements.
     * @member RecognitionResult.prototype.duration
     * @function
     * @public
     * @returns {number} Duration of recognized speech in 100 nano second incements.
     */
    readonly duration: number;
    /**
     * Offset of recognized speech in 100 nano second incements.
     * @member RecognitionResult.prototype.offset
     * @function
     * @public
     * @returns {number} Offset of recognized speech in 100 nano second incements.
     */
    readonly offset: number;
    /**
     * In case of an unsuccessful recognition, provides details of the occurred error.
     * @member RecognitionResult.prototype.errorDetails
     * @function
     * @public
     * @returns {string} a brief description of an error.
     */
    readonly errorDetails: string;
    /**
     * A string containing Json serialized recognition result as it was received from the service.
     * @member RecognitionResult.prototype.json
     * @function
     * @private
     * @returns {string} Json serialized representation of the result.
     */
    readonly json: string;
    /**
     *  The set of properties exposed in the result.
     * @member RecognitionResult.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The set of properties exposed in the result.
     */
    readonly properties: PropertyCollection;
}
