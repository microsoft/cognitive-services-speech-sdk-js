// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import { IAudioDestination } from "../../common/Exports.js";
import { Contracts } from "../Contracts.js";
import { AudioStreamFormat } from "../Exports.js";
import { AudioOutputFormatImpl } from "./AudioOutputFormat.js";

export class AudioFileWriter implements IAudioDestination {
    private privAudioFormat: AudioOutputFormatImpl;
    private privFd: number;
    private privId: string;
    private privWriteStream: fs.WriteStream;

    public constructor(filename: fs.PathLike) {
        Contracts.throwIfNullOrUndefined(fs.openSync, "\nFile System access not available, please use Push or PullAudioOutputStream");
        this.privFd = fs.openSync(filename, "w");
    }

    public set format(format: AudioStreamFormat) {
        Contracts.throwIfNotUndefined(this.privAudioFormat, "format is already set");
        this.privAudioFormat = format as AudioOutputFormatImpl;
        let headerOffset: number = 0;
        if (this.privAudioFormat.hasHeader) {
            headerOffset = this.privAudioFormat.header.byteLength;
        }
        if (this.privFd !== undefined) {
            this.privWriteStream = fs.createWriteStream("", {fd: this.privFd, start: headerOffset, autoClose: false});
        }
    }

    public write(buffer: ArrayBuffer): void {
        Contracts.throwIfNullOrUndefined(this.privAudioFormat, "must set format before writing.");
        if (this.privWriteStream !== undefined) {
            this.privWriteStream.write(new Uint8Array(buffer.slice(0)));
        }
    }

    public close(): void {
        if (this.privFd !== undefined) {
            this.privWriteStream.on("finish", (): void => {
                if (this.privAudioFormat.hasHeader) {
                    this.privAudioFormat.updateHeader(this.privWriteStream.bytesWritten);
                    fs.writeSync(this.privFd,
                        new Int8Array(this.privAudioFormat.header),
                        0,
                        this.privAudioFormat.header.byteLength,
                        0);
                }
                fs.closeSync(this.privFd);
                this.privFd = undefined;
            });
            this.privWriteStream.end();
        }
    }

    public id(): string {
        return this.privId;
    }
}
