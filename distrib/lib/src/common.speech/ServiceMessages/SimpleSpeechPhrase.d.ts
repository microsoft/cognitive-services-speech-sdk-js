import { RecognitionStatus } from "../Exports";
export interface ISimpleSpeechPhrase {
    RecognitionStatus: RecognitionStatus;
    DisplayText: string;
    Offset?: number;
    Duration?: number;
}
export declare class SimpleSpeechPhrase implements ISimpleSpeechPhrase {
    private privSimpleSpeechPhrase;
    private constructor();
    static fromJSON(json: string): SimpleSpeechPhrase;
    readonly RecognitionStatus: RecognitionStatus;
    readonly DisplayText: string;
    readonly Offset: number;
    readonly Duration: number;
}
