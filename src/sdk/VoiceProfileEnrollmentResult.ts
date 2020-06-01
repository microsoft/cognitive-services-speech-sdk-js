// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ResultReason } from "./Exports";

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

    public constructor(reason: ResultReason, json: string) {
        this.privReason = reason;
        this.privDetails = JSON.parse(json);
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
}

/**
 * Output format
 * @class VoiceProfileEnrollmentCancellationDetails
 */
// tslint:disable-next-line:max-classes-per-file
export class VoiceProfileEnrollmentCancellationDetails {

    public fromResult(result: VoiceProfileEnrollmentResult): VoiceProfileEnrollmentCancellationDetails {
        const details = new VoiceProfileEnrollmentCancellationDetails();
        return details;
    }
}
