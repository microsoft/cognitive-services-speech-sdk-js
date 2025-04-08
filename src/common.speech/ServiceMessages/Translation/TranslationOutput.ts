//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { InterimResults } from "./InterimResults";

/**
 * The translation output configuration
 */
export interface TranslationOutput {
    /**
     * Whether to include pass through results
     */
    includePassThroughResults?: boolean;

    /**
     * The interim results configuration
     */
    interimResults?: InterimResults;
}
