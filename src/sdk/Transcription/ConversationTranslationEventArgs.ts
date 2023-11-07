// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { RecognitionEventArgs } from "../Exports.js";
import { ConversationTranslationResult } from "./Exports.js";

export class ConversationTranslationEventArgs extends RecognitionEventArgs {
    private privResult: ConversationTranslationResult;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {ConversationTranslationResult} result - The translation recognition result.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    public constructor(result: ConversationTranslationResult, offset?: number, sessionId?: string) {
        super(offset, sessionId);
        this.privResult = result;
    }

    /**
     * Specifies the recognition result.
     * @returns {ConversationTranslationResult} the recognition result.
     */
    public get result(): ConversationTranslationResult {
        return this.privResult;
    }
}
