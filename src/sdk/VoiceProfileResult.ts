// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { CancellationErrorCodePropertyName } from "../common.speech/Exports.js";
import { Contracts } from "./Contracts.js";
import {
    CancellationDetailsBase,
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    ResultReason
} from "./Exports.js";

/**
 * Output format
 * @class VoiceProfileResult
 */
export class VoiceProfileResult {
    private privReason: ResultReason;
    private privProperties: PropertyCollection;
    private privErrorDetails: string;

    public constructor(reason: ResultReason, statusText: string) {
        this.privReason = reason;
        this.privProperties = new PropertyCollection();
        if (reason === ResultReason.Canceled) {
            Contracts.throwIfNullOrUndefined(statusText, "statusText");
            this.privErrorDetails = statusText;
            this.privProperties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.ServiceError]);
        }
    }

    public get reason(): ResultReason {
        return this.privReason;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public get errorDetails(): string {
        return this.privErrorDetails;
    }
}

/**
 * @class VoiceProfileCancellationDetails
 */
export class VoiceProfileCancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    /**
     * Creates an instance of VoiceProfileCancellationDetails object for the canceled VoiceProfileResult.
     * @member VoiceProfileCancellationDetails.fromResult
     * @function
     * @public
     * @param {VoiceProfileResult} result - The result that was canceled.
     * @returns {VoiceProfileCancellationDetails} The cancellation details object being created.
     */
    public static fromResult(result: VoiceProfileResult): VoiceProfileCancellationDetails {
        const reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (!!result.properties) {
            errorCode = (CancellationErrorCode as any)[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError])]; //eslint-disable-line
        }

        return new VoiceProfileCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
