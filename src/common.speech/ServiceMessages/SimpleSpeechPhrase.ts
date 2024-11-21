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
    [key: string]: any;
}

export interface IPrimaryLanguage {
    Language: string;
    Confidence: string;
}

export class SimpleSpeechPhrase implements ISimpleSpeechPhrase {
    private privSimpleSpeechPhrase: ISimpleSpeechPhrase;

    private constructor(json: string, baseOffset: number = 0) {
        this.privSimpleSpeechPhrase = JSON.parse(json) as ISimpleSpeechPhrase;
        this.privSimpleSpeechPhrase.RecognitionStatus = this.mapRecognitionStatus(this.privSimpleSpeechPhrase.RecognitionStatus); // RecognitionStatus[this.privSimpleSpeechPhrase.RecognitionStatus as unknown as keyof typeof RecognitionStatus];
        this.updateOffset(baseOffset);
    }

    public static fromJSON(json: string, baseOffset: number): SimpleSpeechPhrase {
        return new SimpleSpeechPhrase(json, baseOffset);
    }

    private updateOffset(baseOffset: number): void {
        this.privSimpleSpeechPhrase.Offset += baseOffset;
    }

    public asJson(): string {
        const jsonObj = { ...this.privSimpleSpeechPhrase };
        // Convert the enum value to its string representation for serialization purposes.
        return JSON.stringify({
            ...jsonObj,
            RecognitionStatus: RecognitionStatus[jsonObj.RecognitionStatus] as keyof typeof RecognitionStatus
        });
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

    private mapRecognitionStatus(status: any): RecognitionStatus {
        if (typeof status === "string") {
            return RecognitionStatus[status as keyof typeof RecognitionStatus];
        } else if (typeof status === "number") {
            return status;
        }
    }
}
