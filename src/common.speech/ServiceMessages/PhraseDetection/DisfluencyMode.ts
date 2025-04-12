//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * Disfluency handling options.
 */
export enum DisfluencyMode {
    /**
     * The Microsoft Speech Service does not remove disfluencies from all results.
     */
    Raw = "Raw",

    /**
     * The Microsoft Speech Service removes disfluencies from all results.
     */
    Removed = "Removed",

    /**
     * The Microsoft Speech Service tags disfluencies in the phrase result.
     */
    Labeled = "Labeled"
}
