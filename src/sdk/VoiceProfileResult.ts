// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ResultReason } from "./Exports";

/**
 * Output format
 * @class VoiceProfileResult
 */
export class VoiceProfileResult {
    private privReason: ResultReason;

    public constructor(reason: ResultReason) {
        this.privReason = reason;
    }

    public get resultReason(): ResultReason {
        return this.privReason;
    }
}

/**
 * Output format
 * @class VoiceProfileCancellationDetails
 */
// tslint:disable-next-line:max-classes-per-file
export class VoiceProfileCancellationDetails {

    public fromResult(result: VoiceProfileResult): VoiceProfileCancellationDetails {
        const details = new VoiceProfileCancellationDetails();
        return details;
    }
}
