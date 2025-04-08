//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { DisfluencyMode } from "./DisfluencyMode";

/**
 * The interactive punctuation mode.
 */
export enum InteractivePunctuationMode {
    None = "None",
    Implicit = "Implicit",
    Explicit = "Explicit",
    Intelligent = "Intelligent"
}

/**
 * Defines the phrase enrichment options for interactive scenario.
 */
export interface InteractiveEnrichmentOptions {
    /**
     * The punctuation mode.
     */
    punctuationMode?: InteractivePunctuationMode;

    /**
     * The disfluency mode.
     */
    disfluencyMode?: DisfluencyMode;

    /**
     * The punctuation mode for intermediate results.
     */
    intermediatePunctuationMode?: InteractivePunctuationMode;

    /**
     * The disfluency mode for intermediate results.
     */
    intermediateDisfluencyMode?: DisfluencyMode;
}
