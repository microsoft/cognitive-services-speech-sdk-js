// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// response

export interface IActivityPayloadResponse {
    conversationId: string;
    messageDataStreamType: number;
    messagePayload: string | object;
    version: number;
}

export class ActivityPayloadResponse implements IActivityPayloadResponse {
    private privActivityResponse: IActivityPayloadResponse;

    private constructor(json: string) {
        this.privActivityResponse = JSON.parse(json) as IActivityPayloadResponse;
    }

    public static fromJSON(json: string): ActivityPayloadResponse {
        return new ActivityPayloadResponse(json);
    }

    public get conversationId(): string {
        return this.privActivityResponse.conversationId;
    }

    public get messageDataStreamType(): number {
        return this.privActivityResponse.messageDataStreamType;
    }

    public get messagePayload(): string | object {
        return this.privActivityResponse.messagePayload;
    }

    public get version(): number {
        return this.privActivityResponse.version;
    }
}

export enum MessageDataStreamType {
    None = 0,
    TextToSpeechAudio = 1,
}
