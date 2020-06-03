// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import {
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

    public constructor(resultType: SpeakerRecognitionResultType, data: string, cancellation?: boolean) {
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

    public set profileId(id: string) {
        this.privProfileId = id;
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
export class SpeakerRecognitionCancellationDetails {

    public fromResult(result: SpeakerRecognitionResult): SpeakerRecognitionCancellationDetails {
        const details = new SpeakerRecognitionCancellationDetails();
        return details;
    }
}
