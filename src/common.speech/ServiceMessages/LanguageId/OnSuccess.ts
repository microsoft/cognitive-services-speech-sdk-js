//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The action to take on successful language detection
 */
export enum NextAction {
    Recognize = "Recognize",
    None = "None"
}

/**
 * This type defines the OnSuccess configuration for LanguageDetection
 */
export interface OnSuccess {
    /**
     * The action to take on success
     */
    action?: NextAction;
}
