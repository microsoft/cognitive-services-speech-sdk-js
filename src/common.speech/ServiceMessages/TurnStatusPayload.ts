// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface ITurnStatusResponsePayload {
    interactionId: string;
    conversationId: string;
    statusCode: any;
}

export class TurnStatusResponsePayload implements ITurnStatusResponsePayload {
    private privMessageStatusResponse: ITurnStatusResponsePayload;

    private constructor(json: string) {
        this.privMessageStatusResponse = JSON.parse(json) as ITurnStatusResponsePayload;
    }

    public static fromJSON(json: string): TurnStatusResponsePayload {
        return new TurnStatusResponsePayload(json);
    }

    public get interactionId(): string {
        return this.privMessageStatusResponse.interactionId;
    }

    public get conversationId(): string {
        return this.privMessageStatusResponse.conversationId;
    }

    public get statusCode(): any {
        // Payloads may contain a limited set of textual representations or a numeric status
        // code. The textual values are here converted into numeric ones.
        switch (this.privMessageStatusResponse.statusCode) {
            case "Success":
                return 200;
            case "Failed":
                return 400;
            case "TimedOut":
                return 429;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return this.privMessageStatusResponse.statusCode;
        }
    }
}
