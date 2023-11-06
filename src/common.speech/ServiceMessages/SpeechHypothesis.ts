// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IPrimaryLanguage } from "./SimpleSpeechPhrase.js";

// speech.hypothesis
export interface ISpeechHypothesis {
    Text: string;
    Offset: number;
    Duration: number;
    PrimaryLanguage?: IPrimaryLanguage;
    SpeakerId?: string;
}

export class SpeechHypothesis implements ISpeechHypothesis {
    private privSpeechHypothesis: ISpeechHypothesis;

    private constructor(json: string) {
        this.privSpeechHypothesis = JSON.parse(json) as ISpeechHypothesis;
    }

    public static fromJSON(json: string): SpeechHypothesis {
        return new SpeechHypothesis(json);
    }

    public get Text(): string {
        return this.privSpeechHypothesis.Text;
    }

    public get Offset(): number {
        return this.privSpeechHypothesis.Offset;
    }

    public get Duration(): number {
        return this.privSpeechHypothesis.Duration;
    }

    public get Language(): string {
        return this.privSpeechHypothesis.PrimaryLanguage === undefined ? undefined : this.privSpeechHypothesis.PrimaryLanguage.Language;
    }

    public get LanguageDetectionConfidence(): string {
        return this.privSpeechHypothesis.PrimaryLanguage === undefined ? undefined : this.privSpeechHypothesis.PrimaryLanguage.Confidence;
    }

    public get SpeakerId(): string {
        return this.privSpeechHypothesis.SpeakerId;
    }
}
