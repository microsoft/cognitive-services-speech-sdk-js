// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { CancellationErrorCode, CancellationReason, TranslationRecognitionResult } from "./Exports.js";

/**
 * Define payload of speech recognition canceled result events.
 * @class TranslationRecognitionCanceledEventArgs
 */
export class TranslationRecognitionCanceledEventArgs {
    private privResult: TranslationRecognitionResult;
    private privSessionId: string;
    private privCancelReason: CancellationReason;
    private privErrorDetails: string;
    private privErrorCode: CancellationErrorCode;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} sessionid - The session id.
     * @param {CancellationReason} cancellationReason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {TranslationRecognitionResult} result - The result.
     */
    public constructor(
        sessionid: string,
        cancellationReason: CancellationReason,
        errorDetails: string,
        errorCode: CancellationErrorCode,
        result: TranslationRecognitionResult) {
        this.privCancelReason = cancellationReason;
        this.privErrorDetails = errorDetails;
        this.privResult = result;
        this.privSessionId = sessionid;
        this.privErrorCode = errorCode;
    }

    /**
     * Specifies the recognition result.
     * @member TranslationRecognitionCanceledEventArgs.prototype.result
     * @function
     * @public
     * @returns {TranslationRecognitionResult} the recognition result.
     */
    public get result(): TranslationRecognitionResult {
        return this.privResult;
    }

    /**
     * Specifies the session identifier.
     * @member TranslationRecognitionCanceledEventArgs.prototype.sessionId
     * @function
     * @public
     * @returns {string} the session identifier.
     */
    public get sessionId(): string {
        return this.privSessionId;
    }

    /**
     * The reason the recognition was canceled.
     * @member TranslationRecognitionCanceledEventArgs.prototype.reason
     * @function
     * @public
     * @returns {CancellationReason} Specifies the reason canceled.
     */
    public get reason(): CancellationReason {
        return this.privCancelReason;
    }

    /**
     * The error code in case of an unsuccessful recognition.
     * Added in version 1.1.0.
     * @return An error code that represents the error reason.
     */
    public get errorCode(): CancellationErrorCode {
        return this.privErrorCode;
    }

    /**
     * In case of an unsuccessful recognition, provides details of the occurred error.
     * @member TranslationRecognitionCanceledEventArgs.prototype.errorDetails
     * @function
     * @public
     * @returns {string} A String that represents the error details.
     */
    public get errorDetails(): string {
        return this.privErrorDetails;
    }
}
