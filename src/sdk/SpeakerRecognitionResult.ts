// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
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

export enum SpeakerRecognitionResultType {
    Verify,
    Identify
}

interface IdentifyResult {
    identifiedProfile: {
        profileId: string;
        score: number;
    };
}

interface VerifyResult {
    recognitionResult: string;
    score: number;
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

    public constructor(resultType: SpeakerRecognitionResultType, data: string, profileId: string, resultReason: ResultReason = ResultReason.RecognizedSpeaker) {
        this.privProperties = new PropertyCollection();
        this.privReason = resultReason;
        if (this.privReason !== ResultReason.Canceled) {
            if (resultType === SpeakerRecognitionResultType.Identify) {
                const json: IdentifyResult = JSON.parse(data) as IdentifyResult;
                Contracts.throwIfNullOrUndefined(json, "JSON");
                this.privProfileId = json.identifiedProfile.profileId;
                this.privScore = json.identifiedProfile.score;
            } else {
                const json: VerifyResult = JSON.parse(data) as VerifyResult;
                Contracts.throwIfNullOrUndefined(json, "JSON");
                this.privScore = json.score;
                if (json.recognitionResult.toLowerCase() !== "accept") {
                    this.privReason = ResultReason.NoMatch;
                }
                if (profileId !== undefined && profileId !== "") {
                    this.privProfileId = profileId;
                }
            }
        } else {
            const json: { statusText: string } = JSON.parse(data);
            Contracts.throwIfNullOrUndefined(json, "JSON");
            this.privErrorDetails = json.statusText;
            this.privProperties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.ServiceError]);
        }
        this.privProperties.setProperty(PropertyId.SpeechServiceResponse_JsonResult, data);
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
            errorCode = (CancellationErrorCode as any)[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError])];
        }

        return new SpeakerRecognitionCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
