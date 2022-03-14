// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// speech.keyword
export interface ISpeechKeyword {
    Status: string;
    Text: string;
    Offset: number;
    Duration: number;
}

export class SpeechKeyword implements ISpeechKeyword {
    private privSpeechKeyword: ISpeechKeyword;

    private constructor(json: string) {
        this.privSpeechKeyword = JSON.parse(json) as ISpeechKeyword;
    }

    public static fromJSON(json: string): SpeechKeyword {
        return new SpeechKeyword(json);
    }

    public get Status(): string {
        return this.privSpeechKeyword.Status;
    }

    public get Text(): string {
        return this.privSpeechKeyword.Text;
    }

    public get Offset(): number {
        return this.privSpeechKeyword.Offset;
    }

    public get Duration(): number {
        return this.privSpeechKeyword.Duration;
    }
}
