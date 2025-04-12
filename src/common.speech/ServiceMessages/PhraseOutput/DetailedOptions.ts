//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { PhraseOption, PhraseExtension } from "./PhraseOutput";

/**
 * The detailed format options.
 */
export interface DetailedOptions {
    /**
     * The detailed format options.
     */
    options?: PhraseOption[];

    /**
     * The detailed format extensions.
     */
    extensions?: PhraseExtension[];
}
