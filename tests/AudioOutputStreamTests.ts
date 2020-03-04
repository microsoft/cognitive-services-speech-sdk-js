// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAudioStreamNode,
    IStreamChunk,
} from "../src/common/Exports";
import {
    bufferSize,
    PullAudioOutputStreamImpl,
} from "../src/sdk/Audio/AudioOutputStream";
import { Settings } from "./Settings";

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
// tslint:disable-next-line:no-console
beforeEach(() => console.info("---------------------------------------Starting test case-----------------------------------"));

test("PullAudioOutputStreamImpl basic test", (done: jest.DoneCallback) => {
    const size: number = 256;
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl(size);
    const ab: ArrayBuffer = new ArrayBuffer(size);

    const abView: Uint8Array = new Uint8Array(ab);
    for (let i: number = 0; i < size; i++) {
        abView[i] = i % 256;
    }
    ps.write(abView);

    let bytesRead: number = 0;
    ps.read().then((audioBuffer: ArrayBuffer) => {
        try {
            expect(audioBuffer.byteLength).toBeGreaterThanOrEqual(size);
            expect(audioBuffer.byteLength).toBeLessThanOrEqual(size);
            const readView: Uint8Array = new Uint8Array(audioBuffer);
            for (let i: number = 0; i < audioBuffer.byteLength; i++) {
                expect(readView[i]).toEqual(bytesRead++ % 256);
            }
        } catch (error) {
            done.fail(error);
        }
        done();
    });
});

test("PullAudioOutputStreamImpl multiple writes read after close", (done: jest.DoneCallback) => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl(bufferSize);

    const ab: ArrayBuffer = new ArrayBuffer(bufferSize * 4);
    const abView: Uint8Array = new Uint8Array(ab);
    for (let i: number = 0; i < bufferSize * 4; i++) {
        abView[i] = i % 256;
    }

    let j: number = 0;
    for (j = 0; j < bufferSize * 4; j += 100) {
        ps.write(ab.slice(j, j + 100));
    }
    ps.close();

    let bytesRead: number = 0;

    const readLoop = () => {
        ps.read().then((audioBuffer: ArrayBuffer) => {
            try {
                if (audioBuffer == null) {
                    expect(bytesRead).toBeGreaterThanOrEqual(bufferSize * 4);
                    expect(bytesRead).toBeLessThanOrEqual(bufferSize * 4);
                } else {
                    expect(audioBuffer.byteLength).toBeGreaterThanOrEqual(bufferSize);
                    expect(audioBuffer.byteLength).toBeLessThanOrEqual(bufferSize);
                    const readView: Uint8Array = new Uint8Array(audioBuffer);
                    for (let i: number = 0; i < audioBuffer.byteLength; i++) {
                        expect(readView[i]).toEqual(bytesRead++ % 256);
                    }
                }
            } catch (error) {
                done.fail(error);
            }

            if (audioBuffer != null) {
                readLoop();
            } else {
                done();
            }
        });
    };

    readLoop();
});

test("PullAudioOutputStreamImpl multiple writes and reads", (done: jest.DoneCallback) => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl(bufferSize);

    const ab: ArrayBuffer = new ArrayBuffer(bufferSize * 4);
    const abView: Uint8Array = new Uint8Array(ab);
    for (let i: number = 0; i < bufferSize * 4; i++) {
        abView[i] = i % 256;
    }

    let j: number = 0;
    for (j = 0; j < bufferSize * 4; j += 100) {
        ps.write(ab.slice(j, j + 100));
    }
    ps.write(ab.slice(j));

    let bytesRead: number = 0;

    const readLoop = () => {
        ps.read().then((audioBuffer: ArrayBuffer) => {
            try {
                expect(audioBuffer.byteLength).toBeGreaterThanOrEqual(bufferSize);
                expect(audioBuffer.byteLength).toBeLessThanOrEqual(bufferSize);
                const readView: Uint8Array = new Uint8Array(audioBuffer);
                for (let i: number = 0; i < audioBuffer.byteLength; i++) {
                    expect(readView[i]).toEqual(bytesRead++ % 256);
                }
            } catch (error) {
                done.fail(error);
            }

            if (bytesRead < bufferSize * 4) {
                readLoop();
            } else {
                done();
            }
        });
    };

    readLoop();
});
