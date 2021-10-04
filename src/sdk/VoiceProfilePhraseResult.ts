// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import {
    ResultReason,
    VoiceProfileResult
} from "./Exports";

/**
 * Output format
 * @class VoiceProfilePhraseResult
 */
export class VoiceProfilePhraseResult extends VoiceProfileResult {
    private privPhrases: string[] = [];

    public constructor(reason: ResultReason, statusText: string, json: any) {
        super(reason, statusText);
        Contracts.throwIfNullOrUndefined(json, "phrase result JSON");
        if (!!json.phrases && !!json.phrases[0]) {
            for (const item of json.phrases) {
                this.privPhrases.push(item.passPhrase || item.activationPhrase);
            }
        }
    }

    public get phrases(): string[] {
        return this.privPhrases;
    }
}
