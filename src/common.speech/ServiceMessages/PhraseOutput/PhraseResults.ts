//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The phrase result output type
 */
export enum PhraseResultOutputType {
    Always = "Always",
    None = "None"
}

/**
 * The phrase results configuration
 */
export interface PhraseResults {
    /**
     * The result type
     */
    resultType?: PhraseResultOutputType;
}
