import { CancellationErrorCode, CancellationReason, RecognitionResult } from "./Exports";
/**
 * Contains detailed information about why a result was canceled.
 * @class CancellationDetails
 */
export declare class CancellationDetails {
    private privReason;
    private privErrorDetails;
    private privErrorCode;
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - The error details, if provided.
     */
    private constructor();
    /**
     * Creates an instance of CancellationDetails object for the canceled RecognitionResult.
     * @member CancellationDetails.fromResult
     * @function
     * @public
     * @param {RecognitionResult} result - The result that was canceled.
     * @returns {CancellationDetails} The cancellation details object being created.
     */
    static fromResult(result: RecognitionResult): CancellationDetails;
    /**
     * The reason the recognition was canceled.
     * @member CancellationDetails.prototype.reason
     * @function
     * @public
     * @returns {CancellationReason} Specifies the reason canceled.
     */
    readonly reason: CancellationReason;
    /**
     * In case of an unsuccessful recognition, provides details of the occurred error.
     * @member CancellationDetails.prototype.errorDetails
     * @function
     * @public
     * @returns {string} A String that represents the error details.
     */
    readonly errorDetails: string;
    /**
     * The error code in case of an unsuccessful recognition.
     * Added in version 1.1.0.
     * @return An error code that represents the error reason.
     */
    readonly ErrorCode: CancellationErrorCode;
}
