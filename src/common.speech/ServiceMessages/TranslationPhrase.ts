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

    private constructor(phrase: ITranslationPhrase, baseOffset: number) {
        this.privTranslationPhrase = phrase;
        this.privTranslationPhrase.Offset += baseOffset;
        this.privTranslationPhrase.RecognitionStatus = this.mapRecognitionStatus(this.privTranslationPhrase.RecognitionStatus);
        if (this.privTranslationPhrase.Translation !== undefined) {
            this.privTranslationPhrase.Translation.TranslationStatus = this.mapTranslationStatus(this.privTranslationPhrase.Translation.TranslationStatus);
        }
    }

    public static fromJSON(json: string, baseOffset: number): TranslationPhrase {
        return new TranslationPhrase(JSON.parse(json) as ITranslationPhrase, baseOffset);
    }

    public static fromTranslationResponse(translationResponse: { SpeechPhrase: ITranslationPhrase }, baseOffset: number): TranslationPhrase {
        Contracts.throwIfNullOrUndefined(translationResponse, "translationResponse");
        const phrase: ITranslationPhrase = translationResponse.SpeechPhrase;
        translationResponse.SpeechPhrase = undefined;
        phrase.Translation = (translationResponse as unknown as ITranslations);
        phrase.Text = phrase.DisplayText;
        return new TranslationPhrase(phrase, baseOffset);
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

    public asJson(): string {
        const jsonObj = { ...this.privTranslationPhrase };

        // Convert the enum values to their string representations for serialization
        const serializedObj: any = {
            ...jsonObj,
            RecognitionStatus: RecognitionStatus[jsonObj.RecognitionStatus]
        };

        if (jsonObj.Translation) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            serializedObj.Translation = {
                ...jsonObj.Translation,
                TranslationStatus: TranslationStatus[jsonObj.Translation.TranslationStatus]
            };
        }

        return JSON.stringify(serializedObj);
    }

    private mapRecognitionStatus(status: any): RecognitionStatus {
        if (typeof status === "string") {
            return RecognitionStatus[status as keyof typeof RecognitionStatus];
        } else if (typeof status === "number") {
            return status;
        }
    }

    private mapTranslationStatus(status: any): TranslationStatus {
        if (typeof status === "string") {
            return TranslationStatus[status as keyof typeof TranslationStatus];
        } else if (typeof status === "number") {
            return status;
        }
    }
}
