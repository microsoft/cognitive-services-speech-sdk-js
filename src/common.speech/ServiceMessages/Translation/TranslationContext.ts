//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { TranslationOutput } from "./TranslationOutput";
import { OnSuccess } from "./OnSuccess";
import { OnError } from "./OnError";
import { OnPassthrough } from "./OnPassthrough";

/**
 * The json paylaod for translation in speech.context
 */
export interface TranslationContext {
    /**
     * The target languages.
     */
    targetLanguages: string[];

    /**
     * The output.
     */
    output?: TranslationOutput;

    /**
     * The on success.
     */
    onSuccess?: OnSuccess;

    /**
     * The on error.
     */
    onError?: OnError;

    /**
     * The on passthrough.
     */
    onPassthrough?: OnPassthrough;

    /**
     * The category
     */
    category?: string;
}
