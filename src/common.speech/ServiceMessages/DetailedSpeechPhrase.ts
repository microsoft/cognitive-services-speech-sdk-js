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
    [key: string]: any;
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

    private constructor(json: string, baseOffset: number) {
        this.privDetailedSpeechPhrase = JSON.parse(json) as IDetailedSpeechPhrase;
        this.privDetailedSpeechPhrase.RecognitionStatus = this.mapRecognitionStatus(this.privDetailedSpeechPhrase.RecognitionStatus);
        this.updateOffsets(baseOffset);
    }

    public static fromJSON(json: string, baseOffset: number): DetailedSpeechPhrase {
        return new DetailedSpeechPhrase(json, baseOffset);
    }

    private updateOffsets(baseOffset: number): void {
        this.privDetailedSpeechPhrase.Offset += baseOffset;

        if (!!this.privDetailedSpeechPhrase.NBest) {
            for (const phrase of this.privDetailedSpeechPhrase.NBest) {
                if (!!phrase.Words) {
                    for (const word of phrase.Words) {
                        word.Offset += baseOffset;
                    }
                }
                if (!!phrase.DisplayWords) {
                    for (const word of phrase.DisplayWords) {
                        word.Offset += baseOffset;
                    }
                }
            }
        }
    }

    public asJson(): string {
        const jsonObj = { ...this.privDetailedSpeechPhrase };
        // Convert the enum value to its string representation for serialization purposes.
        return JSON.stringify({
            ...jsonObj,
            RecognitionStatus: RecognitionStatus[jsonObj.RecognitionStatus] as keyof typeof RecognitionStatus
        });
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
    private mapRecognitionStatus(status: any): RecognitionStatus {
        if (typeof status === "string") {
            return RecognitionStatus[status as keyof typeof RecognitionStatus];
        } else if (typeof status === "number") {
            return status;
        }
    }
}
