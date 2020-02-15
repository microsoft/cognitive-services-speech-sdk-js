// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { setTimeout } from "timers";
import {
    IAudioStreamNode,
    IStreamChunk,
} from "../src/common/Exports";
import {
    PushAudioInputStreamImpl,
} from "../src/sdk/Audio/AudioInputStream";
import {
    AudioStreamFormat,
    AudioStreamFormatImpl,
} from "../src/sdk/Audio/AudioStreamFormat";
import { Settings } from "./Settings";

let bufferSize: number;
beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    bufferSize = (AudioStreamFormat.getDefaultInputFormat() as AudioStreamFormatImpl).avgBytesPerSec / 10;
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
// tslint:disable-next-line:no-console
beforeEach(() => console.info("---------------------------------------Starting test case-----------------------------------"));

test("Push segments into small blocks", (done: jest.DoneCallback) => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();

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

    ps.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {

        let bytesRead: number = 0;

        const readLoop = () => {
            audioNode.read().onSuccessContinueWith((audioBuffer: IStreamChunk<ArrayBuffer>) => {
                try {
                    expect(audioBuffer.buffer.byteLength).toBeGreaterThanOrEqual(bufferSize);
                    expect(audioBuffer.buffer.byteLength).toBeLessThanOrEqual(bufferSize);
                    const readView: Uint8Array = new Uint8Array(audioBuffer.buffer);
                    for (let i: number = 0; i < audioBuffer.buffer.byteLength; i++) {
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
});

test("Stream returns all data when closed", (done: jest.DoneCallback) => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();

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
    ps.close();

    ps.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        let bytesRead: number = 0;

        const readLoop = () => {
            audioNode.read().onSuccessContinueWith((audioBuffer: IStreamChunk<ArrayBuffer>) => {
                try {
                    expect(audioBuffer).not.toBeUndefined();
                    if (bytesRead === bufferSize * 4) {
                        expect(audioBuffer.isEnd).toEqual(true);
                        expect(audioBuffer.buffer).toEqual(null);
                        done();
                    } else {
                        expect(audioBuffer.buffer).not.toBeUndefined();
                        expect(audioBuffer.isEnd).toEqual(false);

                        const readView: Uint8Array = new Uint8Array(audioBuffer.buffer);
                        for (let i: number = 0; i < audioBuffer.buffer.byteLength; i++) {
                            expect(readView[i]).toEqual(bytesRead++ % 256);
                        }

                        readLoop();
                    }

                } catch (error) {
                    done.fail(error);
                }

            });
        };

        readLoop();
    });
});

test("Stream blocks when not closed", (done: jest.DoneCallback) => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();

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

    ps.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        let bytesRead: number = 0;
        let readCallCount: number = 0;
        let shouldBeEnd: boolean = false;

        const readLoop = () => {
            audioNode.read().onSuccessContinueWith((audioBuffer: IStreamChunk<ArrayBuffer>) => {
                readCallCount++;
                try {

                    expect(audioBuffer).not.toBeUndefined();
                    if (!shouldBeEnd) {
                        expect(audioBuffer.buffer).not.toBeUndefined();

                        const readView: Uint8Array = new Uint8Array(audioBuffer.buffer);
                        for (let i: number = 0; i < audioBuffer.buffer.byteLength; i++) {
                            expect(readView[i]).toEqual(bytesRead++ % 256);
                        }

                        if (bytesRead === bufferSize * 4) {
                            // The next call should block.
                            const currentReadCount: number = readCallCount;
                            // Schedule a check that the number of calls has not increased.
                            setTimeout(() => {
                                try {
                                    expect(readCallCount).toEqual(currentReadCount);
                                    shouldBeEnd = true;
                                    // Release the blocking read and finish when it does.
                                    ps.close();
                                } catch (error) {
                                    done.fail(error);
                                }
                            }, 2000);
                        }
                        readLoop();

                    } else {
                        expect(audioBuffer.buffer).toEqual(null);
                        expect(audioBuffer.isEnd).toEqual(true);
                        done();
                    }
                } catch (error) {
                    done.fail(error);
                }

            });
        };

        readLoop();
    });
});

test("nonAligned data is fine", (done: jest.DoneCallback) => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();

    const dataSize: number = bufferSize * 1.25;
    const ab: ArrayBuffer = new ArrayBuffer(dataSize);
    const abView: Uint8Array = new Uint8Array(ab);
    for (let i: number = 0; i < dataSize; i++) {
        abView[i] = i % 256;
    }

    ps.write(ab);
    ps.close();

    ps.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        let bytesRead: number = 0;

        const readLoop = () => {
            audioNode.read().onSuccessContinueWith((audioBuffer: IStreamChunk<ArrayBuffer>) => {
                try {
                    expect(audioBuffer).not.toBeUndefined();

                    if (bytesRead === dataSize) {
                        expect(audioBuffer.isEnd).toEqual(true);
                        expect(audioBuffer.buffer).toEqual(null);
                        done();
                    } else {
                        expect(audioBuffer.buffer).not.toBeUndefined();
                        expect(audioBuffer.isEnd).toEqual(false);

                        const readView: Uint8Array = new Uint8Array(audioBuffer.buffer);
                        for (let i: number = 0; i < audioBuffer.buffer.byteLength; i++) {
                            expect(readView[i]).toEqual(bytesRead++ % 256);
                        }

                        readLoop();
                    }

                } catch (error) {
                    done.fail(error);
                }

            });
        };

        readLoop();
    });
});
