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

export interface EnrollmentResultDetails {
    enrollmentStatus: string;
    profileId: string;
    enrollmentCount?: number;
    enrollmentLength?: number;
    remainingEnrollmentCount?: number;
    remainingEnrollmentSpeechLength?: number;
    audioLength?: number;
    audioSpeechLength?: number;
}

/**
 * Output format
 * @class VoiceProfileEnrollmentResult
 */
export class VoiceProfileEnrollmentResult {
    private privReason: ResultReason;
    private privDetails: EnrollmentResultDetails;
    private privProperties: PropertyCollection;
    private privErrorDetails: string;

    public constructor( reason: ResultReason, json: string, statusText: string ) {
        this.privReason = reason;
        this.privProperties = new PropertyCollection();
        if (this.privReason !== ResultReason.Canceled) {
            if (!!json) {
                this.privDetails = JSON.parse(json);
                if (this.privDetails.enrollmentStatus.toLowerCase() === "enrolling") {
                    this.privReason = ResultReason.EnrollingVoiceProfile;
                }
            }
        } else {
            this.privErrorDetails = statusText;
            this.privProperties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.ServiceError]);
        }
    }

    public static FromVerificationEnrollmentResponse(profileId: string, json: { enrollmentStatus: string, enrollmentsCount: number, remainingEnrollments?: number, remainingEnrollmentsCount?: number }): VoiceProfileEnrollmentResult {
        const reason: ResultReason = json.enrollmentStatus.toLowerCase() === "enrolling" ?
            ResultReason.EnrollingVoiceProfile : json.enrollmentStatus.toLowerCase() === "enrolled" ?
            ResultReason.EnrolledVoiceProfile : ResultReason.Canceled;
        const result = new VoiceProfileEnrollmentResult(reason, null, null);
        result.privDetails = this.getVerificationDetails(json, profileId);
        return result;
    }

    public static FromIdentificationEnrollmentResponse(profileId: string, json: { status: string, processingResult: any }): VoiceProfileEnrollmentResult {
        const reason: ResultReason = json.status === "succeeded" ? ResultReason.EnrolledVoiceProfile : ResultReason.Canceled;
        const result = new VoiceProfileEnrollmentResult(reason, null, null);
        result.privDetails = this.getIdentificationDetails(json.processingResult, profileId);
        return result;
    }

    public static FromIdentificationProfileList(array: any[]): VoiceProfileEnrollmentResult[] {
        const results: VoiceProfileEnrollmentResult[] = [];
        for (const item of array) {
            const reason: ResultReason = item.enrollmentStatus.toLowerCase() === "enrolling" ?
                ResultReason.EnrollingVoiceProfile : item.enrollmentStatus.toLowerCase() === "enrolled" ?
                ResultReason.EnrolledVoiceProfile : ResultReason.Canceled;
            const result = new VoiceProfileEnrollmentResult(reason, null, null);
            result.privDetails = this.getIdentificationDetails(item);
            results.push(result);
        }
        return results;
    }

    public static FromVerificationProfileList(array: any[]): VoiceProfileEnrollmentResult[] {
        const results: VoiceProfileEnrollmentResult[] = [];
        for (const item of array) {
            const reason: ResultReason = item.enrollmentStatus.toLowerCase() === "enrolling" ?
                ResultReason.EnrollingVoiceProfile : item.enrollmentStatus.toLowerCase() === "enrolled" ?
                ResultReason.EnrolledVoiceProfile : ResultReason.Canceled;
            const result = new VoiceProfileEnrollmentResult(reason, null, null);
            result.privDetails = this.getVerificationDetails(item);
            results.push(result);
        }
        return results;

    }

    public get reason(): ResultReason {
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

    public get enrollmentResultDetails(): EnrollmentResultDetails {
        return this.privDetails;
    }

    public get errorDetails(): string {
        return this.privErrorDetails;
    }

    private static getIdentificationDetails(json: any, profileId?: string): any {
        return {
            audioSpeechLength: json.speechTime ? parseFloat(json.speechTime) : 0,
            enrollmentLength: json.enrollmentSpeechTime ? parseFloat(json.enrollmentSpeechTime) : 0,
            enrollmentStatus: json.enrollmentStatus,
            profileId: profileId || json.identificationProfileId,
            remainingEnrollmentSpeechLength: json.remainingEnrollmentSpeechTime ? parseFloat(json.remainingEnrollmentSpeechTime) : 0
        };
    }

    private static getVerificationDetails(json: any, profileId?: string): any {
        return {
            enrollmentCount: json.enrollmentsCount,
            enrollmentStatus: json.enrollmentStatus,
            profileId: profileId || json.verificationProfileId,
            remainingEnrollmentCount: json.remainingEnrollments || json.remainingEnrollmentsCount
        };
    }
}

/**
 * @class VoiceProfileEnrollmentCancellationDetails
 */
// tslint:disable-next-line:max-classes-per-file
export class VoiceProfileEnrollmentCancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    /**
     * Creates an instance of VoiceProfileEnrollmentCancellationDetails object for the canceled VoiceProfileEnrollmentResult.
     * @member VoiceProfileEnrollmentCancellationDetails.fromResult
     * @function
     * @public
     * @param {VoiceProfileEnrollmentResult} result - The result that was canceled.
     * @returns {VoiceProfileEnrollmentCancellationDetails} The cancellation details object being created.
     */
    public static fromResult(result: VoiceProfileEnrollmentResult): VoiceProfileEnrollmentCancellationDetails {
        const reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (!!result.properties) {
            errorCode = (CancellationErrorCode as any)[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError])];
        }

        return new VoiceProfileEnrollmentCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
