// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Language Identification priority
 * @class LanguageIdPriority
 */
export enum LanguageIdPriority {

    /**
     * Prioritize Accuracy for Language Id (does not work for continuous mode LID)
     * @member LanguageIdPriority.Accuracy
     */
    Accuracy,

    /**
     * Prioritize latency for Language Id
     * @member LanguageIdPriority.Latency
     */
    Latency,
}
