// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Stream } from "../common/Exports";

export interface IRecorder {
    mute(): void;
    record(context: AudioContext, mediaStream: MediaStream, outputStream: Stream<ArrayBuffer>): void;
    releaseMediaResources(context: AudioContext): void;
    setWorkletUrl(url: string): void;
    unmute(): void;
}
