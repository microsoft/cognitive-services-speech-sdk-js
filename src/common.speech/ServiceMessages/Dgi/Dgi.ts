//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { Group } from "./Group";

/**
 * Internal class for deserializing DGI V1 JSON into.
 */
export interface Dgi {
    /**
     * The Groups in the grammar.
     */
    groups?: Group[];

    /**
     * The reference grammars.
     */
    referenceGrammars?: string[];

    /**
     * The weight to be assigned to standalone DGI grammar
     */
    bias?: number;
}
