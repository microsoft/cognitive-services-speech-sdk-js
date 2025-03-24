//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { OnError } from "./OnError";

/**
 * The json paylaod for synthesis context in speech.context
 */
export interface SynthesisContext {
    /**
     * The voices.
     */
    defaultVoices?: { [key: string]: string };

    /**
     * The target languages for which synthesis should be generated.
     * Defaults to all, if list is omitted or empty.
     */
    synthesizedLanguages?: string[];

    /**
     * The on error.
     */
    onError?: OnError;
}
