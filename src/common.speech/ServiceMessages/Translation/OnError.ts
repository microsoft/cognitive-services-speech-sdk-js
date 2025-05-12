//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The onErrorAction enum
 */
export enum OnErrorAction {
    Continue = "Continue",
    EndOfTurn = "EndOfTurn"
}

/**
 * The on error configuration
 */
export interface OnError {
    /**
     * The action to take on error
     */
    action?: OnErrorAction;
}
