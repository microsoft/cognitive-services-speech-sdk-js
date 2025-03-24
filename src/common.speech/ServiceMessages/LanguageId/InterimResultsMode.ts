//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The mode for interim results
 */
export enum InterimResultsMode {
    Enable = "Enable",
    Disable = "Disable"
}

/**
 * The interim results configuration
 */
export interface InterimResults {
    /**
     * The mode for interim results
     */
    mode?: InterimResultsMode;
}
