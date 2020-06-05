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

    public constructor(resultType: SpeakerRecognitionResultType, data: string, profileId?: string, cancellation?: boolean) {
        this.privProperties = new PropertyCollection();
        if (cancellation === undefined || !cancellation) {
            this.privReason = ResultReason.RecognizedSpeaker;
            if (resultType === SpeakerRecognitionResultType.Identify) {
                const json: { identifiedProfile: { profileId: string, score: number } } = JSON.parse(data);
                Contracts.throwIfNullOrUndefined(json, "JSON");
                this.privProfileId = json.identifiedProfile.profileId;
                this.privScore = json.identifiedProfile.score;
            } else {
                const json: { recognitionResult: string, score: number } = JSON.parse(data);
                Contracts.throwIfNullOrUndefined(json, "JSON");
                this.privScore = json.score;
                if (json.recognitionResult.toLowerCase() !== "accept") {
                    this.privReason = ResultReason.NoMatch;
                }
                if (profileId !== undefined && profileId !== "") {
                    this.privProfileId = profileId;
                }
            }
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
 * Output format
 * @class SpeakerRecognitionCancellationDetails
 */
// tslint:disable-next-line:max-classes-per-file
export class SpeakerRecognitionCancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    public fromResult(result: SpeakerRecognitionResult): SpeakerRecognitionCancellationDetails {
        const reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (!!result.properties) {
            errorCode = (CancellationErrorCode as any)[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError])];
        }

        return new SpeakerRecognitionCancellationDetails(reason, result.errorDetails, errorCode);
    }
}
