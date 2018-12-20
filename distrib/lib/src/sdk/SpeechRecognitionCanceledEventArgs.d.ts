import { CancellationErrorCode, CancellationReason, RecognitionEventArgs } from "./Exports";
/**
 * Defines content of a RecognitionErrorEvent.
 * @class SpeechRecognitionCanceledEventArgs
 */
export declare class SpeechRecognitionCanceledEventArgs extends RecognitionEventArgs {
    private privReason;
    private privErrorDetails;
    private privErrorCode;
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode, offset?: number, sessionId?: string);
    /**
     * The reason the recognition was canceled.
     * @member SpeechRecognitionCanceledEventArgs.prototype.reason
     * @function
     * @public
     * @returns {CancellationReason} Specifies the reason canceled.
     */
    readonly reason: CancellationReason;
    /**
     * The error code in case of an unsuccessful recognition.
     * Added in version 1.1.0.
     * @return An error code that represents the error reason.
     */
    readonly errorCode: CancellationErrorCode;
    /**
     * In case of an unsuccessful recognition, provides details of the occurred error.
     * @member SpeechRecognitionCanceledEventArgs.prototype.errorDetails
     * @function
     * @public
     * @returns {string} A String that represents the error details.
     */
    readonly errorDetails: string;
}
