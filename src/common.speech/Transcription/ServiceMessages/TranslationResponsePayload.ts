// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the payload for incoming translation messages
 */
export interface ITranslationResponsePayload {
    lang: string;
    translation: string;
}

export interface ITranslationCommandMessage {
    translations: ITranslationResponsePayload[];
    id: string;
    language: string;
    nickname: string;
    participantId: string;
    roomid: string;
    timestamp: string;
    type: string;
}

export interface ISpeechResponsePayload extends ITranslationCommandMessage {
    recognition: string;
    isFinal: boolean;
}

export interface ITextResponsePayload extends ITranslationCommandMessage {
    originalText: string;
}

export class SpeechResponsePayload implements ISpeechResponsePayload {

    private privSpeechResponse: ISpeechResponsePayload;

    private constructor(json: string) {
        this.privSpeechResponse = JSON.parse(json);
    }

    public static fromJSON(json: string): SpeechResponsePayload {
        return new SpeechResponsePayload(json);
    }

    public get recognition(): string {
        return this.privSpeechResponse.recognition;
    }

    public get translations(): ITranslationResponsePayload[] {
        return this.privSpeechResponse.translations;
    }

    public get id(): string {
        return this.privSpeechResponse.id;
    }

    public get language(): string {
        return this.privSpeechResponse.language;
    }

    public get nickname(): string {
        return this.privSpeechResponse.nickname;
    }

    public get participantId(): string {
        return this.privSpeechResponse.participantId;
    }

    public get roomid(): string {
        return this.privSpeechResponse.roomid;
    }

    public get timestamp(): string {
        return this.privSpeechResponse.timestamp;
    }

    public get type(): string {
        return this.privSpeechResponse.type;
    }

    public get isFinal(): boolean {
        return this.privSpeechResponse.type === "final";
    }
}

// tslint:disable-next-line: max-classes-per-file
export class TextResponsePayload implements ITextResponsePayload {

    private privTextResponse: ITextResponsePayload;

    private constructor(json: string) {
        this.privTextResponse = JSON.parse(json);
    }

    public static fromJSON(json: string): TextResponsePayload {
        return new TextResponsePayload(json);
    }

    public get originalText(): string {
        return this.privTextResponse.originalText;
    }

    public get translations(): ITranslationResponsePayload[] {
        return this.privTextResponse.translations;
    }

    public get id(): string {
        return this.privTextResponse.id;
    }

    public get language(): string {
        return this.privTextResponse.language;
    }

    public get nickname(): string {
        return this.privTextResponse.nickname;
    }

    public get participantId(): string {
        return this.privTextResponse.participantId;
    }

    public get roomid(): string {
        return this.privTextResponse.roomid;
    }

    public get timestamp(): string {
        return this.privTextResponse.timestamp;
    }

    public get type(): string {
        return this.privTextResponse.type;
    }
}
