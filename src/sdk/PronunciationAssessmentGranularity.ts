// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the pronunciation evaluation granularity; default value is Phoneme.
 * Added in version 1.15.0
 * @class PronunciationAssessmentGranularity
 */
export enum PronunciationAssessmentGranularity {
    /**
     * Shows the score on the full text, word and phoneme level
     * @member PronunciationAssessmentGranularity.Phoneme
     */
    Phoneme = 1,

    /**
     * Shows the score on the full text and word level
     * @member PronunciationAssessmentGranularity.Word
     */
    Word,

    /**
     * Shows the score on the full text level only
     * @member PronunciationAssessmentGranularity.FullText
     */
    FullText,
}
