// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "../../sdk/Contracts.js";
import { IPrimaryLanguage, ITranslations } from "../Exports.js";
import { TranslationStatus } from "../TranslationStatus.js";

// translation.hypothesis
export interface ITranslationHypothesis {
    Duration: number;
    Offset: number;
    PrimaryLanguage?: IPrimaryLanguage;
    Text: string;
    Translation: ITranslations;
}

export class TranslationHypothesis implements ITranslationHypothesis {
    private privTranslationHypothesis: ITranslationHypothesis;

    private constructor(hypothesis: ITranslationHypothesis) {
        this.privTranslationHypothesis = hypothesis;
        this.privTranslationHypothesis.Translation.TranslationStatus = TranslationStatus[this.privTranslationHypothesis.Translation.TranslationStatus as unknown as keyof typeof TranslationStatus];
    }

    public static fromJSON(json: string): TranslationHypothesis {
        return new TranslationHypothesis(JSON.parse(json) as ITranslationHypothesis);
    }

    public static fromTranslationResponse(translationHypothesis: { SpeechHypothesis: ITranslationHypothesis }): TranslationHypothesis {
        Contracts.throwIfNullOrUndefined(translationHypothesis, "translationHypothesis");
        const hypothesis: ITranslationHypothesis = translationHypothesis.SpeechHypothesis;
        translationHypothesis.SpeechHypothesis = undefined;
        hypothesis.Translation = (translationHypothesis as unknown as ITranslations);
        return new TranslationHypothesis(hypothesis);
    }

    public get Duration(): number {
        return this.privTranslationHypothesis.Duration;
    }

    public get Offset(): number {
        return this.privTranslationHypothesis.Offset;
    }

    public get Text(): string {
        return this.privTranslationHypothesis.Text;
    }

    public get Translation(): ITranslations {
        return this.privTranslationHypothesis.Translation;
    }

    public get Language(): string {
        return this.privTranslationHypothesis.PrimaryLanguage?.Language;
    }
}
