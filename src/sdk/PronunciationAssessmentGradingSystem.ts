// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the point system for pronunciation score calibration; default value is FivePoint.
 * Added in version 1.15.0
 * @class PronunciationAssessmentGradingSystem
 */
export enum PronunciationAssessmentGradingSystem {
    /**
     * Five point calibration
     * @member PronunciationAssessmentGradingSystem.FivePoint
     */
    FivePoint = 1,

    /**
     * Hundred mark
     * @member PronunciationAssessmentGradingSystem.HundredMark
     */
    HundredMark,
}
