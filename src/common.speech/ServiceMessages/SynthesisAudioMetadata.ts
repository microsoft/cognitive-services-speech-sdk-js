// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SpeechSynthesisBoundaryType } from "../../sdk/Exports";

export enum MetadataType {
    WordBoundary = "WordBoundary",
    Bookmark = "Bookmark",
    Viseme = "Viseme",
    SentenceBoundary = "SentenceBoundary",
    SessionEnd = "SessionEnd",
}

export interface ISynthesisMetadata {
    Type: MetadataType;
    Data: {
        Offset: number;
        Duration: number;
        text: {
            Text: string;
            Length: number;
            BoundaryType: SpeechSynthesisBoundaryType;
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
        this.privSynthesisAudioMetadata = JSON.parse(json);
    }

    public static fromJSON(json: string): SynthesisAudioMetadata {
        return new SynthesisAudioMetadata(json);
    }

    public get Metadata(): ISynthesisMetadata[] {
        return this.privSynthesisAudioMetadata.Metadata;
    }
}
