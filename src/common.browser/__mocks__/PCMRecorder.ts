// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Stream } from "../../common/Exports.js";
import { IRecorder } from "../IRecorder.js";

export class PcmRecorder implements IRecorder {
    public constructor(stopInputOnRelease: boolean) {
        void stopInputOnRelease;
    }
    public record(context: AudioContext, mediaStream: MediaStream, outputStream: Stream<ArrayBuffer>): void {
        void context;
        void mediaStream;
        void outputStream;
    }
    public releaseMediaResources(context: AudioContext): void {
        void context;
    }
    public setWorkletUrl(url: string): void {
        void url;
    }
}
