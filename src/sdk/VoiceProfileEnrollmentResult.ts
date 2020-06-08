// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { CancellationErrorCodePropertyName } from "../common.speech/Exports";
import { Contracts } from "./Contracts";
import {
    CancellationDetailsBase,
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    PropertyId,
    ResultReason,
} from "./Exports";

export interface IEnrollmentResultDetails {
    enrollmentCount: number;
    enrollmentLength: number;
    enrollmentSpeechLength: number;
    remainingEnrollmentCount: number;
    remainingEnrollmentSpeechLength: number;
    audioLength: number;
    audioSpeechLength: number;
}

/**
 * Output format
 * @class VoiceProfileEnrollmentResult
 */
export class VoiceProfileEnrollmentResult {
    private privReason: ResultReason;
    private privDetails: IEnrollmentResultDetails;
    private privProperties: PropertyCollection;
    private privErrorDetails: string;

    public constructor(reason: ResultReason, json: string) {
        this.privReason = reason;
        this.privProperties = new PropertyCollection();
        if (this.privReason !== ResultReason.Canceled) {
            this.privDetails = JSON.parse(json);
            if (this.privDetails.remainingEnrollmentCount > 0) {
                this.privReason = ResultReason.EnrollingVoiceProfile;
            }
        } else {
            const errorResponse: { statusText: string } = JSON.parse(json);
            Contracts.throwIfNullOrUndefined(json, "JSON");
            this.privErrorDetails = errorResponse.statusText;
            this.privProperties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.ServiceError]);
        }
    }

    public get resultReason(): ResultReason {
        return this.privReason;
    }

    public get enrollmentCount(): number {
        return this.privDetails.enrollmentCount;
    }

    public get enrollmentLength(): number {
        return this.privDetails.enrollmentLength;
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
 * @class VoiceProfileEnrollmentCancellationDetails
 */
// tslint:disable-next-line:max-classes-per-file
export class VoiceProfileEnrollmentCancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    public static fromResult(result: VoiceProfileEnrollmentResult): VoiceProfileEnrollmentCancellationDetails {
        const reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (!!result.properties) {
            errorCode = (CancellationErrorCode as any)[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError])];
        }

        return new VoiceProfileEnrollmentCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
