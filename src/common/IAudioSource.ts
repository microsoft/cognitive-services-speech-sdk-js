// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ISpeechConfigAudioDevice } from "../common.speech/Exports";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";
import { AudioSourceEvent } from "./AudioSourceEvents";
import { EventSource } from "./EventSource";
import { IDetachable } from "./IDetachable";
import { Promise } from "./Promise";
import { IStreamChunk } from "./Stream";

export interface IAudioSource {
    id(): string;
    turnOn(): Promise<boolean>;
    attach(audioNodeId: string): Promise<IAudioStreamNode>;
    detach(audioNodeId: string): void;
    turnOff(): Promise<boolean>;
    events: EventSource<AudioSourceEvent>;
    format: Promise<AudioStreamFormatImpl>;
    deviceInfo: Promise<ISpeechConfigAudioDevice>;
    setProperty?(name: string, value: string): void;
    getProperty?(name: string, def?: string): string;
}

export interface IAudioStreamNode extends IDetachable {
    id(): string;
    read(): Promise<IStreamChunk<ArrayBuffer>>;
}
