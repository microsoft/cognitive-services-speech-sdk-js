// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ByteBufferAudioFile } from "./ByteBufferAudioFile";

const inputParts: ArrayBuffer[] = [
    Uint8Array.from([1, 2]).buffer,
    Uint8Array.from([3, 4, 5]).buffer,
];

test("Load uses the runtime-appropriate WAV input type", (done: jest.DoneCallback): void => {
    const input: File | Buffer = ByteBufferAudioFile.Load(inputParts);

    if (typeof window === "undefined") {
        expect(typeof File).toBe("function");
        expect(typeof Blob).toBe("function");
        if (!Buffer.isBuffer(input)) {
            done("Expected a Buffer in Node");
            return;
        }
        expect(Array.from(input)).toEqual([1, 2, 3, 4, 5]);
        done();
        return;
    }

    expect(input).toBeInstanceOf(window.File);
    expect(input).toHaveProperty("name", "file.wav");
    if (!(input instanceof window.File)) {
        done("Expected a window.File in jsdom");
        return;
    }

    const reader: FileReader = new window.FileReader();
    reader.onload = (): void => {
        try {
            if (!(reader.result instanceof ArrayBuffer)) {
                done("Expected FileReader to return an ArrayBuffer");
                return;
            }
            expect(Array.from(new Uint8Array(reader.result))).toEqual([1, 2, 3, 4, 5]);
            done();
        } catch (error) {
            done(error);
        }
    };
    reader.onerror = (): void => done(reader.error);
    reader.readAsArrayBuffer(input);
});
