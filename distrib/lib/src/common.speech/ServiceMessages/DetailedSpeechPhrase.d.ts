import { RecognitionStatus } from "../Exports";
export interface IDetailedSpeechPhrase {
    RecognitionStatus: RecognitionStatus;
    NBest: IPhrase[];
    Duration?: number;
    Offset?: number;
}
export interface IPhrase {
    Confidence?: number;
    Lexical: string;
    ITN: string;
    MaskedITN: string;
    Display: string;
}
export declare class DetailedSpeechPhrase implements IDetailedSpeechPhrase {
    private privDetailedSpeechPhrase;
    private constructor();
    static fromJSON(json: string): DetailedSpeechPhrase;
    readonly RecognitionStatus: RecognitionStatus;
    readonly NBest: IPhrase[];
    readonly Duration: number;
    readonly Offset: number;
}
