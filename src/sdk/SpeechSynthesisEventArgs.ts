// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SpeechSynthesisResult } from "./Exports.js";

/**
 * Defines contents of speech synthesis events.
 * @class SpeechSynthesisEventArgs
 * Added in version 1.11.0
 */
export class SpeechSynthesisEventArgs {
    private readonly privResult: SpeechSynthesisResult;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {SpeechSynthesisResult} result - The speech synthesis result.
     */
    public constructor(result: SpeechSynthesisResult) {
        this.privResult = result;
    }

    /**
     * Specifies the synthesis result.
     * @member SpeechSynthesisEventArgs.prototype.result
     * @function
     * @public
     * @returns {SpeechSynthesisResult} the synthesis result.
     */
    public get result(): SpeechSynthesisResult {
        return this.privResult;
    }
}
