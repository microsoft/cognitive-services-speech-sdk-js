// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IPrimaryLanguage, RecognitionStatus } from "../Exports.js";

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
    Display?: string;
    DisplayText?: string;
    Words?: IWord[];
    DisplayWords?: IWord[];
}

export interface IWord {
    Word: string;
    Offset: number;
    Duration: number;
}

export class DetailedSpeechPhrase implements IDetailedSpeechPhrase {
    private privDetailedSpeechPhrase: IDetailedSpeechPhrase;

    private constructor(json: string) {
        this.privDetailedSpeechPhrase = JSON.parse(json) as IDetailedSpeechPhrase;
        this.privDetailedSpeechPhrase.RecognitionStatus = RecognitionStatus[this.privDetailedSpeechPhrase.RecognitionStatus as unknown as keyof typeof RecognitionStatus];
    }

    public static fromJSON(json: string): DetailedSpeechPhrase {
        return new DetailedSpeechPhrase(json);
    }

    public getJsonWithCorrectedOffsets(baseOffset: number): string {
        if (!!this.privDetailedSpeechPhrase.NBest) {
            let firstWordOffset: number;
            for (const phrase of this.privDetailedSpeechPhrase.NBest) {
                if (!!phrase.Words && !!phrase.Words[0]) {
                    firstWordOffset = phrase.Words[0].Offset;
                    break;
                }
            }
            if (!!firstWordOffset && firstWordOffset < baseOffset) {
                const offset: number = baseOffset - firstWordOffset;
                for (const details of this.privDetailedSpeechPhrase.NBest) {
                    if (!!details.Words) {
                        for (const word of details.Words) {
                            word.Offset += offset;
                        }
                    }
                    if (!!details.DisplayWords) {
                        for (const word of details.DisplayWords) {
                            word.Offset += offset;
                        }
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
        if (!!this.privDetailedSpeechPhrase.NBest && this.privDetailedSpeechPhrase.NBest[0]) {
            return this.privDetailedSpeechPhrase.NBest[0].Display || this.privDetailedSpeechPhrase.NBest[0].DisplayText;
        }
        return this.privDetailedSpeechPhrase.DisplayText;
    }
    public get SpeakerId(): string {
        return this.privDetailedSpeechPhrase.SpeakerId;
    }
}
