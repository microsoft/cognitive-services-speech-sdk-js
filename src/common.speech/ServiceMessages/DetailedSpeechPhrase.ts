// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IPrimaryLanguage, RecognitionStatus } from "../Exports";

// speech.phrase for detailed
export interface IDetailedSpeechPhrase {
    RecognitionStatus: RecognitionStatus;
    NBest: IPhrase[];
    Duration?: number;
    Offset?: number;
    PrimaryLanguage?: IPrimaryLanguage;
    DisplayText?: string;
    SpeakerId?: string;
}

export interface IPhrase {
    Confidence?: number;
    Lexical: string;
    ITN: string;
    MaskedITN: string;
    Display: string;
    Words?: IWord[];
}

export interface IWord {
    Word: string;
    Offset: number;
    Duration: number;
}

export class DetailedSpeechPhrase implements IDetailedSpeechPhrase {
    private privDetailedSpeechPhrase: IDetailedSpeechPhrase;

    private constructor(json: string) {
        this.privDetailedSpeechPhrase = JSON.parse(json);
        this.privDetailedSpeechPhrase.RecognitionStatus = (RecognitionStatus as any)[this.privDetailedSpeechPhrase.RecognitionStatus];
    }

    public static fromJSON(json: string): DetailedSpeechPhrase {
        return new DetailedSpeechPhrase(json);
    }

    public getJsonWithCorrectedOffsets(baseOffset: number): string {
        if (!!this.privDetailedSpeechPhrase.NBest && !!this.privDetailedSpeechPhrase.NBest[0].Words) {
            const firstWordOffset: number = this.privDetailedSpeechPhrase.NBest[0].Words[0].Offset;
            if (firstWordOffset && firstWordOffset < baseOffset) {
                const offset: number = baseOffset - firstWordOffset;
                for (const details of this.privDetailedSpeechPhrase.NBest) {
                    for (const word of details.Words) {
                        word.Offset += offset;
                    }
                }
            }
        }
        return JSON.stringify(this.privDetailedSpeechPhrase);
    }

    public get RecognitionStatus(): RecognitionStatus {
        return this.privDetailedSpeechPhrase.RecognitionStatus;
    }
    public get NBest(): IPhrase[] {
        return this.privDetailedSpeechPhrase.NBest;
    }
    public get Duration(): number {
        return this.privDetailedSpeechPhrase.Duration;
    }
    public get Offset(): number {
        return this.privDetailedSpeechPhrase.Offset;
    }
    public get Language(): string {
        return this.privDetailedSpeechPhrase.PrimaryLanguage === undefined ? undefined : this.privDetailedSpeechPhrase.PrimaryLanguage.Language;
    }
    public get LanguageDetectionConfidence(): string {
        return this.privDetailedSpeechPhrase.PrimaryLanguage === undefined ? undefined : this.privDetailedSpeechPhrase.PrimaryLanguage.Confidence;
    }
    public get Text(): string {
        return !!this.privDetailedSpeechPhrase.NBest && this.privDetailedSpeechPhrase.NBest[0] ? this.privDetailedSpeechPhrase.NBest[0].Display : this.privDetailedSpeechPhrase.DisplayText;
    }
    public get SpeakerId(): string {
        return this.privDetailedSpeechPhrase.SpeakerId;
    }
}
