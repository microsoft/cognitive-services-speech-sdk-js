//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The sentiment analysis configuration
 */
export interface SentimentAnalysis {
    /**
     * Whether sentiment analysis is enabled
     */
    enabled?: boolean;

    /**
     * Whether to show stats
     */
    showStats?: boolean;

    /**
     * The model version
     */
    modelVersion?: string;
}
