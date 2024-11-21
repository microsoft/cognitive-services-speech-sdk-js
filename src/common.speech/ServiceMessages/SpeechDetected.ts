// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// speech.endDetected
export interface ISpeechDetected {
    Offset: number;
}

export class SpeechDetected implements ISpeechDetected {
    private privSpeechStartDetected: ISpeechDetected;

    private constructor(json: string, baseOffset: number) {
        this.privSpeechStartDetected = JSON.parse(json) as ISpeechDetected;
        this.privSpeechStartDetected.Offset += baseOffset;
    }

    public static fromJSON(json: string, baseOffset: number): SpeechDetected {
        return new SpeechDetected(json, baseOffset);
    }

    public get Offset(): number {
        return this.privSpeechStartDetected.Offset;
    }
}
