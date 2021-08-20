// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "../../sdk/Contracts";
import { ITranslations, RecognitionStatus } from "../Exports";
import { TranslationStatus } from "../TranslationStatus";

// translation.phrase
export interface ITranslationPhrase {
    RecognitionStatus: RecognitionStatus;
    Offset: number;
    Duration: number;
    Translation: ITranslations;
    Text: string;
    DisplayText?: string;
}

export class TranslationPhrase implements ITranslationPhrase {
    private privTranslationPhrase: ITranslationPhrase;

    private constructor(phrase: ITranslationPhrase) {
        this.privTranslationPhrase = phrase;
        this.privTranslationPhrase.RecognitionStatus = (RecognitionStatus as any)[this.privTranslationPhrase.RecognitionStatus];
        if (this.privTranslationPhrase.Translation !== undefined) {
            this.privTranslationPhrase.Translation.TranslationStatus = (TranslationStatus as any)[this.privTranslationPhrase.Translation.TranslationStatus];
        }
    }

    public static fromJSON(json: string): TranslationPhrase {
        return new TranslationPhrase(JSON.parse(json));
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

    public get Text(): string {
        return this.privTranslationPhrase.Text;
    }

    public get Translation(): ITranslations {
        return this.privTranslationPhrase.Translation;
    }
}
