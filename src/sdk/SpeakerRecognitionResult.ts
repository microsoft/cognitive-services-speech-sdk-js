// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { CancellationErrorCodePropertyName, SpeakerResponse } from "../common.speech/Exports.js";
import {
    CancellationDetailsBase,
    CancellationErrorCode,
    CancellationReason,
    PropertyCollection,
    PropertyId,
    ResultReason,
} from "./Exports.js";

export enum SpeakerRecognitionResultType {
    Verify,
    Identify
}

/**
 * Output format
 * @class SpeakerRecognitionResult
 */
export class SpeakerRecognitionResult {
    private privReason: ResultReason;
    private privProperties: PropertyCollection;
    private privProfileId: string;
    private privScore: number;
    private privErrorDetails: string;

    public constructor(response: SpeakerResponse, resultReason: ResultReason = ResultReason.RecognizedSpeaker, cancellationErrorCode: CancellationErrorCode = CancellationErrorCode.NoError, errorDetails: string = "") {
        this.privProperties = new PropertyCollection();
        const resultType = response.scenario === "TextIndependentIdentification" ? SpeakerRecognitionResultType.Identify : SpeakerRecognitionResultType.Verify;
        this.privReason = resultReason;
        if (this.privReason !== ResultReason.Canceled) {
            if (resultType === SpeakerRecognitionResultType.Identify) {
                this.privProfileId = response.identificationResult.identifiedProfile.profileId;
                this.privScore = response.identificationResult.identifiedProfile.score;
                this.privReason = ResultReason.RecognizedSpeakers;
            } else {
                this.privScore = response.verificationResult.score;
                if (response.verificationResult.recognitionResult.toLowerCase() !== "accept") {
                    this.privReason = ResultReason.NoMatch;
                }
                if (response.verificationResult.profileId !== undefined && response.verificationResult.profileId !== "") {
                    this.privProfileId = response.verificationResult.profileId;
                }
            }
        } else {
            this.privErrorDetails = errorDetails;
            this.privProperties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[cancellationErrorCode]);
        }
        this.privProperties.setProperty(PropertyId.SpeechServiceResponse_JsonResult, JSON.stringify(response));
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public get reason(): ResultReason {
        return this.privReason;
    }

    public get profileId(): string {
        return this.privProfileId;
    }

    public get errorDetails(): string {
        return this.privErrorDetails;
    }

    public get score(): number {
        return this.privScore;
    }
}

/**
 * @class SpeakerRecognitionCancellationDetails
 */
export class SpeakerRecognitionCancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    /**
     * Creates an instance of SpeakerRecognitionCancellationDetails object for the canceled SpeakerRecognitionResult
     * @member SpeakerRecognitionCancellationDetails.fromResult
     * @function
     * @public
     * @param {SpeakerRecognitionResult} result - The result that was canceled.
     * @returns {SpeakerRecognitionCancellationDetails} The cancellation details object being created.
     */
    public static fromResult(result: SpeakerRecognitionResult): SpeakerRecognitionCancellationDetails {
        const reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (!!result.properties) {
            errorCode = CancellationErrorCode[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError]) as keyof typeof CancellationErrorCode];
        }

        return new SpeakerRecognitionCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
