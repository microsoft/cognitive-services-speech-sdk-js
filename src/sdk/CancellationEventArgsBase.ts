// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    CancellationErrorCode,
    CancellationEventArgs,
    CancellationReason,
    RecognitionEventArgs
} from "./Exports.js";

/**
 * Defines content of a CancellationEvent.
 * @class CancellationEventArgsBase
 */
export class CancellationEventArgsBase extends RecognitionEventArgs implements CancellationEventArgs {
    private privReason: CancellationReason;
    private privErrorDetails: string;
    private privErrorCode: CancellationErrorCode;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    public constructor(reason: CancellationReason, errorDetails: string,
                       errorCode: CancellationErrorCode, offset?: number, sessionId?: string) {
        super(offset, sessionId);

        this.privReason = reason;
        this.privErrorDetails = errorDetails;
        this.privErrorCode = errorCode;
    }

    /**
     * The reason the recognition was canceled.
     * @member CancellationEventArgsBase.prototype.reason
     * @function
     * @public
     * @returns {CancellationReason} Specifies the reason canceled.
     */
    public get reason(): CancellationReason {
        return this.privReason;
    }

    /**
     * The error code in case of an unsuccessful operation.
     * @return An error code that represents the error reason.
     */
    public get errorCode(): CancellationErrorCode {
        return this.privErrorCode;
    }

    /**
     * In case of an unsuccessful operation, provides details of the occurred error.
     * @member CancellationEventArgsBase.prototype.errorDetails
     * @function
     * @public
     * @returns {string} A String that represents the error details.
     */
    public get errorDetails(): string {
        return this.privErrorDetails;
    }
}
