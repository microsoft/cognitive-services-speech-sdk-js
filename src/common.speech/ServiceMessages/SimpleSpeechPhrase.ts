// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { RecognitionStatus } from "../Exports.js";

// speech.phrase
export interface ISimpleSpeechPhrase {
    RecognitionStatus: RecognitionStatus;
    DisplayText: string;
    Offset?: number;
    Duration?: number;
    PrimaryLanguage?: IPrimaryLanguage;
    SpeakerId?: string;
}

export interface IPrimaryLanguage {
    Language: string;
    Confidence: string;
}

export class SimpleSpeechPhrase implements ISimpleSpeechPhrase {
    private privSimpleSpeechPhrase: ISimpleSpeechPhrase;

    private constructor(json: string) {
        this.privSimpleSpeechPhrase = JSON.parse(json) as ISimpleSpeechPhrase;
        this.privSimpleSpeechPhrase.RecognitionStatus = RecognitionStatus[this.privSimpleSpeechPhrase.RecognitionStatus as unknown as keyof typeof RecognitionStatus];
    }

    public static fromJSON(json: string): SimpleSpeechPhrase {
        return new SimpleSpeechPhrase(json);
    }

    public get RecognitionStatus(): RecognitionStatus {
        return this.privSimpleSpeechPhrase.RecognitionStatus;
    }

    public get DisplayText(): string {
        return this.privSimpleSpeechPhrase.DisplayText;
    }

    public get Offset(): number {
        return this.privSimpleSpeechPhrase.Offset;
    }

    public get Duration(): number {
        return this.privSimpleSpeechPhrase.Duration;
    }

    public get Language(): string {
        return this.privSimpleSpeechPhrase.PrimaryLanguage === undefined ? undefined : this.privSimpleSpeechPhrase.PrimaryLanguage.Language;
    }

    public get LanguageDetectionConfidence(): string {
        return this.privSimpleSpeechPhrase.PrimaryLanguage === undefined ? undefined : this.privSimpleSpeechPhrase.PrimaryLanguage.Confidence;
    }

    public get SpeakerId(): string {
        return this.privSimpleSpeechPhrase.SpeakerId;
    }
}
