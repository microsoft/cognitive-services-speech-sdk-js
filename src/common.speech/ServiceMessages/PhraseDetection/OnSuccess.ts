//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The action enum when speech recognition return a final phrase result
 */
export enum NextAction {
    None = "None",
    Translate = "Translate"
}

/**
 * The on success configuration
 */
export interface OnSuccess {
    /**
     * The action to take on success
     */
    action?: NextAction;
}
