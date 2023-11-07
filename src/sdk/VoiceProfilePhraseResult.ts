// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";
import {
    ResultReason,
    VoiceProfileResult
} from "./Exports.js";

/**
 * Output format
 * @class VoiceProfilePhraseResult
 */
export class VoiceProfilePhraseResult extends VoiceProfileResult {
    private privPhrases: string[] = [];
    private privType: string;

    public constructor(reason: ResultReason, statusText: string, type: string, phraseArray: string[]) {
        super(reason, statusText);
        Contracts.throwIfNullOrUndefined(phraseArray, "phrase array");
        this.privType = type;
        if (!!phraseArray && !!phraseArray[0]) {
            this.privPhrases = phraseArray;
        }
    }

    public get phrases(): string[] {
        return this.privPhrases;
    }

    public get type(): string {
        return this.privType;
    }
}
