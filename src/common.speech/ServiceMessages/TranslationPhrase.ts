// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "../../sdk/Contracts.js";
import { IPrimaryLanguage, ITranslations, RecognitionStatus } from "../Exports.js";
import { TranslationStatus } from "../TranslationStatus.js";

// translation.phrase
export interface ITranslationPhrase {
    RecognitionStatus: RecognitionStatus;
    Offset: number;
    Duration: number;
    Translation?: ITranslations;
    Text?: string;
    DisplayText?: string;
    PrimaryLanguage?: IPrimaryLanguage;
}

export class TranslationPhrase implements ITranslationPhrase {
    private privTranslationPhrase: ITranslationPhrase;

    private constructor(phrase: ITranslationPhrase) {
        this.privTranslationPhrase = phrase;
        this.privTranslationPhrase.RecognitionStatus = RecognitionStatus[this.privTranslationPhrase.RecognitionStatus as unknown as keyof typeof RecognitionStatus];
        if (this.privTranslationPhrase.Translation !== undefined) {
            this.privTranslationPhrase.Translation.TranslationStatus = TranslationStatus[this.privTranslationPhrase.Translation.TranslationStatus as unknown as keyof typeof TranslationStatus];
        }
    }

    public static fromJSON(json: string): TranslationPhrase {
        return new TranslationPhrase(JSON.parse(json) as ITranslationPhrase);
    }

    public static fromTranslationResponse(translationResponse: { SpeechPhrase: ITranslationPhrase }): TranslationPhrase {
        Contracts.throwIfNullOrUndefined(translationResponse, "translationResponse");
        const phrase: ITranslationPhrase = translationResponse.SpeechPhrase;
        translationResponse.SpeechPhrase = undefined;
        phrase.Translation = (translationResponse as unknown as ITranslations);
        phrase.Text = phrase.DisplayText;
        return new TranslationPhrase(phrase);
    }

    public get RecognitionStatus(): RecognitionStatus {
        return this.privTranslationPhrase.RecognitionStatus;
    }

    public get Offset(): number {
        return this.privTranslationPhrase.Offset;
    }

    public get Duration(): number {
        return this.privTranslationPhrase.Duration;
    }

    public get Text(): string | undefined {
        return this.privTranslationPhrase.Text;
    }

    public get Language(): string | undefined {
        return this.privTranslationPhrase.PrimaryLanguage?.Language;
    }

    public get Confidence(): string | undefined {
        return this.privTranslationPhrase.PrimaryLanguage?.Confidence;
    }

    public get Translation(): ITranslations | undefined {
        return this.privTranslationPhrase.Translation;
    }
}
