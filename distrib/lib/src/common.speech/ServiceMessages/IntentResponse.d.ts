export interface IIntentResponse {
    query: string;
    topScoringIntent: ISingleIntent;
    entities: IIntentEntity[];
}
export interface IIntentEntity {
    entity: string;
    type: string;
    startIndex: number;
    endIndex: number;
    score: number;
}
export interface ISingleIntent {
    intent: string;
    score: number;
}
export declare class IntentResponse implements IIntentResponse {
    private privIntentResponse;
    private constructor();
    static fromJSON(json: string): IntentResponse;
    readonly query: string;
    readonly topScoringIntent: ISingleIntent;
    readonly entities: IIntentEntity[];
}
