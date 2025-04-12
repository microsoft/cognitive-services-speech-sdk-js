//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { DisfluencyMode } from "./DisfluencyMode";

/**
 * The dictation punctuation mode.
 */
export enum DictationPunctuationMode {
    None = "None",
    Intelligent = "Intelligent",
    Implicit = "Implicit",
    Explicit = "Explicit"
}

/**
 * Defines the phrase enrichment options for dictation scenario.
 */
export interface DictationEnrichmentOptions {
    /**
     * The punctuation mode.
     */
    punctuationMode?: DictationPunctuationMode;

    /**
     * The disfluency mode.
     */
    disfluencyMode?: DisfluencyMode;

    /**
     * The punctuation mode for intermediate results.
     */
    intermediatePunctuationMode?: DictationPunctuationMode;

    /**
     * The disfluency mode for intermediate results.
     */
    intermediateDisfluencyMode?: DisfluencyMode;
}
