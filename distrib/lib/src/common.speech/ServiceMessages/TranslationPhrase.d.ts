import { ITranslations, RecognitionStatus } from "../Exports";
export interface ITranslationPhrase {
    RecognitionStatus: RecognitionStatus;
    Offset: number;
    Duration: number;
    Text: string;
    Translation: ITranslations;
}
export declare class TranslationPhrase implements ITranslationPhrase {
    private privTranslationPhrase;
    private constructor();
    static fromJSON(json: string): TranslationPhrase;
    readonly RecognitionStatus: RecognitionStatus;
    readonly Offset: number;
    readonly Duration: number;
    readonly Text: string;
    readonly Translation: ITranslations;
}
