//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * An enum that defines actions that can be taken on unknown language detection
 */
export enum OnUnknownAction {
    RecognizeWithDefaultLanguage = "RecognizeWithDefaultLanguage",
    None = "None"
}

/**
 * The on unknown configuration
 */
export interface OnUnknown {
    /**
     * The action to take when language is unknown
     */
    action?: OnUnknownAction;
}
