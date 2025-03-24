//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * Result type
 */
export enum Mode {
    None = "None",
    Always = "Always"
}

/**
 * Interim results
 */
export interface InterimResults {
    /**
     * The mode for interim results
     */
    mode?: Mode;

    /**
     * If true, intermediate results only contain stable parts
     */
    stableOnly?: boolean;
}
