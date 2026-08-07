// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class ByteBufferAudioFile {
    public static Load(buffers: ArrayBuffer[]): File | Buffer {
        if (typeof window === "undefined") {
            const byteLength: number = buffers.reduce((length: number, buffer: ArrayBuffer): number => length + buffer.byteLength, 0);
            const result: Buffer = Buffer.alloc(byteLength);
            let offset: number = 0;

            for (const buffer of buffers) {
                result.set(new Uint8Array(buffer), offset);
                offset += buffer.byteLength;
            }

            return result;
        }

        return new window.File(buffers, "file.wav");
    }
}
