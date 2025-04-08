//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The result type enum
 */
export enum ResultType {
    Auto = "Auto",
    StableFragment = "StableFragment",
    Hypothesis = "Hypothesis",
    None = "None"
}

/**
 * The interim results
 */
export interface InterimResults {
    /**
     * The result type
     */
    resultType?: ResultType;

    /**
     * The stable threshold
     */
    stableThreshold?: number;
}
