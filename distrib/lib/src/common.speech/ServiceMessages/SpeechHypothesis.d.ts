export interface ISpeechHypothesis {
    Text: string;
    Offset: number;
    Duration: number;
}
export declare class SpeechHypothesis implements ISpeechHypothesis {
    private privSpeechHypothesis;
    private constructor();
    static fromJSON(json: string): SpeechHypothesis;
    readonly Text: string;
    readonly Offset: number;
    readonly Duration: number;
}
