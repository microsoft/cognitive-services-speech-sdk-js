import { ITranslations } from "../Exports";
export interface ITranslationHypothesis {
    Duration: number;
    Offset: number;
    Text: string;
    Translation: ITranslations;
}
export declare class TranslationHypothesis implements ITranslationHypothesis {
    private privTranslationHypothesis;
    private constructor();
    static fromJSON(json: string): TranslationHypothesis;
    readonly Duration: number;
    readonly Offset: number;
    readonly Text: string;
    readonly Translation: ITranslations;
}
