// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import { IAudioDestination } from "../common/Exports";
import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat";
import { Contracts } from "../sdk/Contracts";
import { AudioStreamFormat } from "../sdk/Exports";

export class AudioFileWriter implements IAudioDestination {
    private privAudioFormat: AudioOutputFormatImpl;
    private privFd: number;
    private privOffset: number = 0;
    private privId: string;

    public constructor(filename: fs.PathLike) {
        this.privFd = fs.openSync(filename, "w");
        this.privOffset = 0;
    }

    public set format(format: AudioStreamFormat) {
        Contracts.throwIfNotUndefined(this.privAudioFormat, "format is already set");
        this.privAudioFormat = format as AudioOutputFormatImpl;
        this.privOffset = this.privAudioFormat.header.byteLength;
    }

    public write(buffer: ArrayBuffer): void {
        Contracts.throwIfNullOrUndefined(this.privAudioFormat, "must set format before writing.");
        if (this.privFd !== undefined) {
            fs.writeSync(this.privFd, new Int8Array(buffer), 0, buffer.byteLength, this.privOffset);
            this.privOffset += buffer.byteLength;
        }
    }

    public close(): void {
        if (this.privFd !== undefined) {
            if (this.privAudioFormat.hasHeader) {
                this.privAudioFormat.updateHeader(this.privOffset - this.privAudioFormat.header.byteLength);
                fs.writeSync(this.privFd,
                    new Int8Array(this.privAudioFormat.header),
                    0,
                    this.privAudioFormat.header.byteLength,
                    0);
            }
        }
        fs.closeSync(this.privFd);
        this.privFd = undefined;
    }

    public id = (): string => {
        return this.privId;
    }
}
