// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import {
    ResultReason,
    VoiceProfileResult
} from "./Exports";

/**
 * Output format
 * @class VoiceProfileAuthorizationPhraseResult
 */
export class VoiceProfileAuthorizationPhraseResult extends VoiceProfileResult {
    private privPhrases: string[] = [];

    public constructor(reason: ResultReason, statusText: string, json: any) {
        super(reason, statusText);
        Contracts.throwIfNullOrUndefined(json, "phrases array");
        for (const item of json) {
            this.privPhrases.push(item.passPhrase);
        }
    }

    public get phrases(): string[] {
        return this.privPhrases;
    }
}
