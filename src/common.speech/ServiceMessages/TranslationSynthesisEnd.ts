// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SynthesisStatus } from "../Exports.js";

// translation.synthesis.end
export interface ITranslationSynthesisEnd {
    SynthesisStatus?: SynthesisStatus;
    FailureReason?: string;
    Status?: SynthesisStatus;
}

export class TranslationSynthesisEnd implements ITranslationSynthesisEnd {
    private privSynthesisEnd: ITranslationSynthesisEnd;

    private constructor(json: string) {
        this.privSynthesisEnd = JSON.parse(json) as ITranslationSynthesisEnd;
        if (!!this.privSynthesisEnd.SynthesisStatus) {
            this.privSynthesisEnd.SynthesisStatus = SynthesisStatus[this.privSynthesisEnd.SynthesisStatus as unknown as keyof typeof SynthesisStatus];
        }
        if (!!this.privSynthesisEnd.Status) {
            this.privSynthesisEnd.SynthesisStatus = SynthesisStatus[this.privSynthesisEnd.Status as unknown as keyof typeof SynthesisStatus];
        }
    }

    public static fromJSON(json: string): TranslationSynthesisEnd {
        return new TranslationSynthesisEnd(json);
    }

    public get SynthesisStatus(): SynthesisStatus {
        return this.privSynthesisEnd.SynthesisStatus;
    }

    public get FailureReason(): string {
        return this.privSynthesisEnd.FailureReason;
    }
}
