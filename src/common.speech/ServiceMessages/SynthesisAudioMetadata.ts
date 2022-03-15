// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export enum MetadataType {
    WordBoundary = "WordBoundary",
    Bookmark = "Bookmark",
    Viseme = "Viseme"
}

export interface ISynthesisMetadata {
    Type: MetadataType;
    Data: {
        Offset: number;
        text: {
            Text: string;
            Length: number;
        };
        Bookmark: string;
        VisemeId: number;
        AnimationChunk: string;
        IsLastAnimation: boolean;
    };
}

// audio.metadata
export interface ISynthesisAudioMetadata {
    Metadata: ISynthesisMetadata[];
}

export class SynthesisAudioMetadata implements ISynthesisAudioMetadata {
    private privSynthesisAudioMetadata: ISynthesisAudioMetadata;

    private constructor(json: string) {
        this.privSynthesisAudioMetadata = JSON.parse(json) as ISynthesisAudioMetadata;
    }

    public static fromJSON(json: string): SynthesisAudioMetadata {
        return new SynthesisAudioMetadata(json);
    }

    public get Metadata(): ISynthesisMetadata[] {
        return this.privSynthesisAudioMetadata.Metadata;
    }
}
