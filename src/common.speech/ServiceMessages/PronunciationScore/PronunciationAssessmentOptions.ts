//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The enum of grading system for the score
 */
export enum GradingSystemKind {
    FivePoint = "FivePoint",
    HundredMark = "HundredMark"
}

/**
 * The enum of granularity for score coverage
 */
export enum GranularityKind {
    Phoneme = "Phoneme",
    Word = "Word",
    FullText = "FullText"
}

/**
 * The enum of dimension of the score
 */
export enum DimensionKind {
    Basic = "Basic",
    Comprehensive = "Comprehensive"
}

/**
 * The kind of phoneme alphabet
 */
export enum PhonemeAlphabetKind {
    SAPI = "SAPI",
    IPA = "IPA"
}

/**
 * The json payload for pronunciation assessment options
 */
export interface PronunciationAssessmentOptions {
    /**
     * The text that the input speech is following. This can help the assessment when provided.
     */
    referenceText?: string;

    /**
     * The grading system for the score
     */
    gradingSystem?: GradingSystemKind;

    /**
     * The granularity for score coverage
     */
    granularity?: GranularityKind;

    /**
     * The dimension of the score
     */
    dimension?: DimensionKind;

    /**
     * The phoneme alphabet
     */
    phonemeAlphabet?: PhonemeAlphabetKind;

    /**
     * The count of nbest phoneme
     */
    nBestPhonemeCount?: number;

    /**
     * Whether enable miscue or not
     */
    enableMiscue?: boolean;

    /**
     * Whether enable prosody assessment or not
     */
    enableProsodyAssessment?: boolean;

    /**
     * Whether enable two pass unscripted assessment or not
     */
    enableTwoPassUnscriptedAssessment?: boolean;

    /**
     * The scenario ID
     */
    scenarioId?: string;
}
