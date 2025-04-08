//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { DisfluencyMode } from "./DisfluencyMode";

/**
 * The conversation punctuation mode.
 */
export enum ConversationPunctuationMode {
    None = "None",
    Intelligent = "Intelligent",
    Implicit = "Implicit",
    Explicit = "Explicit"
}

/**
 * Defines the phrase enrichment options for conversation scenario.
 */
export interface ConversationEnrichmentOptions {
    /**
     * The punctuation mode.
     */
    punctuationMode?: ConversationPunctuationMode;

    /**
     * The disfluency mode.
     */
    disfluencyMode?: DisfluencyMode;

    /**
     * The punctuation mode for intermediate results.
     */
    intermediatePunctuationMode?: ConversationPunctuationMode;

    /**
     * The disfluency mode for intermediate results.
     */
    intermediateDisfluencyMode?: DisfluencyMode;
}
