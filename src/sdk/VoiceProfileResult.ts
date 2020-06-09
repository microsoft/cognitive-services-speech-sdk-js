// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { CancellationErrorCodePropertyName } from "../common.speech/Exports";
import { Contracts } from "./Contracts";
import {
    CancellationDetailsBase,
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    ResultReason,
} from "./Exports";

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

    public get resultReason(): ResultReason {
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
 * Output format
 * @class VoiceProfileCancellationDetails
 */
// tslint:disable-next-line:max-classes-per-file
export class VoiceProfileCancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    public static fromResult(result: VoiceProfileResult): VoiceProfileCancellationDetails {
        const reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (!!result.properties) {
            errorCode = (CancellationErrorCode as any)[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError])];
        }

        return new VoiceProfileCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
