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

    private constructor(hypothesis: ITranslationHypothesis, baseOffset: number) {
        this.privTranslationHypothesis = hypothesis;
        this.privTranslationHypothesis.Offset += baseOffset;
        this.privTranslationHypothesis.Translation.TranslationStatus = this.mapTranslationStatus(this.privTranslationHypothesis.Translation.TranslationStatus);
    }

    public static fromJSON(json: string, baseOffset: number): TranslationHypothesis {
        return new TranslationHypothesis(JSON.parse(json) as ITranslationHypothesis, baseOffset);
    }

    public static fromTranslationResponse(translationHypothesis: { SpeechHypothesis: ITranslationHypothesis }, baseOffset: number): TranslationHypothesis {
        Contracts.throwIfNullOrUndefined(translationHypothesis, "translationHypothesis");
        const hypothesis: ITranslationHypothesis = translationHypothesis.SpeechHypothesis;
        translationHypothesis.SpeechHypothesis = undefined;
        hypothesis.Translation = (translationHypothesis as unknown as ITranslations);
        return new TranslationHypothesis(hypothesis, baseOffset);
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

    public asJson(): string {
        const jsonObj = { ...this.privTranslationHypothesis };
        // Convert the enum value to its string representation for serialization purposes.

        return jsonObj.Translation !== undefined ? JSON.stringify({
            ...jsonObj,
            TranslationStatus: TranslationStatus[jsonObj.Translation.TranslationStatus] as keyof typeof TranslationStatus
        }) : JSON.stringify(jsonObj);
    }

    private mapTranslationStatus(status: any): TranslationStatus {
        if (typeof status === "string") {
            return TranslationStatus[status as keyof typeof TranslationStatus];
        } else if (typeof status === "number") {
            return status;
        }
    }
}
