// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {Contracts} from "./Contracts";
import {
    PropertyId,
    RecognitionResult
} from "./Exports";

/**
 * Pronunciation assessment results.
 * @class PronunciationAssessmentResult
 * Added in version 1.15.0.
 */
export class PronunciationAssessmentResult {
    private privPronJson: any;

    private constructor(jsonString: string) {
        const j = JSON.parse(jsonString);
        Contracts.throwIfNullOrUndefined(j.NBest[0], "NBest");
        this.privPronJson = j.NBest[0];
    }

    /**
     * @member PronunciationAssessmentResult.fromResult
     * @function
     * @public
     * @param {RecognitionResult} result The recognition result.
     * @return {PronunciationAssessmentConfig} Instance of PronunciationAssessmentConfig
     * @summary Creates an instance of the PronunciationAssessmentResult from recognition result.
     */
    public static fromResult(result: RecognitionResult): PronunciationAssessmentResult {
        Contracts.throwIfNullOrUndefined(result, "result");
        const json: string = result.properties.getProperty(PropertyId.SpeechServiceResponse_JsonResult);
        Contracts.throwIfNullOrUndefined(json, "json");
        return new PronunciationAssessmentResult(json);
    }

    /**
     * Gets the detail result of pronunciation assessment.
     * @member PronunciationAssessmentConfig.prototype.detailResult
     * @function
     * @public
     * @returns {any} detail result.
     */
    public get detailResult(): any {
        return this.privPronJson;
    }

    /**
     * The score indicating the pronunciation accuracy of the given speech, which indicates
     * how closely the phonemes match a native speaker's pronunciation.
     * @member PronunciationAssessmentResult.prototype.accuracyScore
     * @function
     * @public
     * @returns {number} Accuracy score.
     */
    public get accuracyScore(): number {
        return this.detailResult.PronunciationAssessment.AccuracyScore;
    }

    /**
     * The overall score indicating the pronunciation quality of the given speech.
     * This is calculated from AccuracyScore, FluencyScore and CompletenessScore with weight.
     * @member PronunciationAssessmentResult.prototype.pronunciationScore
     * @function
     * @public
     * @returns {number} Pronunciation score.
     */
    public get pronunciationScore(): number {
        return this.detailResult.PronunciationAssessment.PronScore;
    }

    /**
     * The score indicating the completeness of the given speech by calculating the ratio of pronounced words towards entire input.
     * @member PronunciationAssessmentResult.prototype.completenessScore
     * @function
     * @public
     * @returns {number} Completeness score.
     */
    public get completenessScore(): number {
        return this.detailResult.PronunciationAssessment.CompletenessScore;
    }

    /**
     * The score indicating the fluency of the given speech.
     * @member PronunciationAssessmentResult.prototype.fluencyScore
     * @function
     * @public
     * @returns {number} Fluency score.
     */
    public get fluencyScore(): number {
        return this.detailResult.PronunciationAssessment.FluencyScore;
    }
}
