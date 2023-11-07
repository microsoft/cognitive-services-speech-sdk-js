// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    CancellationErrorCode,
    CancellationReason,
} from "./Exports.js";

/**
 * Contains detailed information about why a result was canceled.
 * @class CancellationDetailsBase
 */
export class CancellationDetailsBase {
    private privReason: CancellationReason;
    private privErrorDetails: string;
    private privErrorCode: CancellationErrorCode;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - The error details, if provided.
     */
    protected constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        this.privReason = reason;
        this.privErrorDetails = errorDetails;
        this.privErrorCode = errorCode;
    }

    /**
     * The reason the recognition was canceled.
     * @member CancellationDetailsBase.prototype.reason
     * @function
     * @public
     * @returns {CancellationReason} Specifies the reason canceled.
     */
    public get reason(): CancellationReason {
        return this.privReason;
    }

    /**
     * In case of an unsuccessful recognition, provides details of the occurred error.
     * @member CancellationDetailsBase.prototype.errorDetails
     * @function
     * @public
     * @returns {string} A String that represents the error details.
     */
    public get errorDetails(): string {
        return this.privErrorDetails;
    }

    /**
     * The error code in case of an unsuccessful recognition.
     * Added in version 1.1.0.
     * @return An error code that represents the error reason.
     */
    public get ErrorCode(): CancellationErrorCode {
        return this.privErrorCode;
    }

}
