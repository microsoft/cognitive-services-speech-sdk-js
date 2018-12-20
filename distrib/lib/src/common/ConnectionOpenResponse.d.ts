export declare class ConnectionOpenResponse {
    private privStatusCode;
    private privReason;
    constructor(statusCode: number, reason: string);
    readonly statusCode: number;
    readonly reason: string;
}
