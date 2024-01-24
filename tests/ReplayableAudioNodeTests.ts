// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";

import { ReplayableAudioNode } from "../src/common.browser/ReplayableAudioNode";
import {
    IAudioStreamNode,
    IStreamChunk,
} from "../src/common/Exports";
import { AudioStreamFormatImpl } from "../src/sdk/Audio/AudioStreamFormat";


let readCount: number;
const targetBytes: number = 4096;
const defaultAudioFormat: AudioStreamFormatImpl = sdk.AudioStreamFormat.getDefaultInputFormat() as AudioStreamFormatImpl;

beforeEach(() => {
    readCount = 0;
});

const testAudioNode: IAudioStreamNode = {
    detach: undefined,
    id: () => "test",
    read: (): Promise<IStreamChunk<ArrayBuffer>> => {
        readCount++;
        const retBuffer: ArrayBuffer = new ArrayBuffer(targetBytes);
        const writeView: Uint8Array = new Uint8Array(retBuffer);

        for (let i: number = 0; i < targetBytes; i++) {
            let val: number = i % 256;
            if (val === 0) {
                val = readCount;
            }

            writeView[i] = val;
        }

        return Promise.resolve<IStreamChunk<ArrayBuffer>>({
            buffer: retBuffer,
            isEnd: false,
            timeReceived: readCount,
        });
    },
};

const writeBufferToConsole: (buffer: ArrayBuffer) => void = (buffer: ArrayBuffer): void => {
    const readView: Uint8Array = new Uint8Array(buffer);

    let out: string = "Buffer Size: " + buffer.byteLength + "\r\n";
    for (let i: number = 0; i < buffer.byteLength; i++) {
        out += readView[i] + " ";
    }

    // eslint-disable-next-line no-console
    console.info(out);
};

const checkRead: (checkedCount: number, testTarget: number, testNode: IAudioStreamNode, done: jest.DoneCallback) => void =
    (checkedCount: number, testTarget: number, testNode: IAudioStreamNode, done: jest.DoneCallback): void => {
        if (checkedCount === testTarget) {
            done();
        } else {
            testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                // Torn page expected?
                let expectedBufferCount: number = targetBytes;
                let tornPageOffset: number = 0;
                let pageFragment: number = checkedCount - Math.round(checkedCount);

                checkedCount = Math.round(checkedCount);

                if (0 !== pageFragment) {
                    // Page tear.
                    if (pageFragment < 0) {
                        pageFragment += 1;
                    } else {
                        checkedCount++;
                    }

                    expectedBufferCount *= pageFragment;
                    tornPageOffset = targetBytes - expectedBufferCount;
                }

                try {
                    expect(chunk).not.toBeUndefined();
                    expect(chunk.buffer).not.toBeUndefined();
                    expect(chunk.buffer.byteLength).toEqual(expectedBufferCount);

                    const readView: Uint8Array = new Uint8Array(chunk.buffer);

                    for (let i: number = 0; i < chunk.buffer.byteLength; i++) {
                        const expectedVal: number = (i + tornPageOffset) % 256;
                        if (0 === expectedVal) {
                            expect(readView[i]).toEqual(checkedCount);
                        } else {
                            expect(readView[i]).toEqual(expectedVal);
                        }
                    }
                } catch (error) {
                    if (chunk !== undefined && chunk.buffer !== undefined) {
                        writeBufferToConsole(chunk.buffer);
                    }
                    done(error);
                    throw error;
                }

                checkRead(++checkedCount, testTarget, testNode, done);
            }, (error: string) => done(error));
        }
    };

test("Data in, Data out", (done: jest.DoneCallback) => {
    const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

    checkRead(1, 20, testNode, done);
});

test("Shrink half buffer and continue. (No torn pages)", (done: jest.DoneCallback) => {
    const testTarget: number = 20;

    const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

    let testCount: number = 0;
    const fillReadBuffer: () => void = (): void => {
        if (testCount++ === testTarget) {
            const secondsInBuffer: number = testTarget * targetBytes * defaultAudioFormat.avgBytesPerSec;

            testNode.shrinkBuffers((secondsInBuffer / 2) * 1e7);
            checkRead(testCount, testTarget * 2, testNode, done);
        } else {
            testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                // Not really worried about the data, just filling the replay buffer.
                fillReadBuffer();
            }, (error: string) => done(error));
        }
    };

    fillReadBuffer();
});

test("Shrink half buffer and replay. (No torn pages)", (done: jest.DoneCallback) => {
    const testTarget: number = 20;

    const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

    let testCount: number = 0;
    const fillReadBuffer: () => void = (): void => {
        if (testCount++ === testTarget) {
            const secondsInBuffer: number = testTarget * targetBytes / defaultAudioFormat.avgBytesPerSec;
            const shrinkTarget: number = (secondsInBuffer / 2) * 1e7;
            testNode.shrinkBuffers(shrinkTarget);
            testNode.replay();

            checkRead((testTarget / 2) + 1, testTarget, testNode, done);
        } else {
            testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                // Not really worried about the data, just filling the replay buffer.
                fillReadBuffer();
            }, (error: string) => done(error));
        }
    };

    fillReadBuffer();
});

test("Shrink buffer and replay. (Torn pages)", (done: jest.DoneCallback) => {
    const testTarget: number = 20;

    const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

    let testCount: number = 0;
    const fillReadBuffer: () => void = (): void => {
        if (testCount++ === testTarget) {
            // Tear the 2nd page.
            const shrinkTarget: number = (targetBytes * 1.5 / defaultAudioFormat.avgBytesPerSec) * 1e7;
            testNode.shrinkBuffers(shrinkTarget);
            testNode.replay();

            checkRead(1.5, testTarget, testNode, done);
        } else {
            testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                // Not really worried about the data, just filling the replay buffer.
                fillReadBuffer();
            }, (error: string) => done(error));
        }
    };

    fillReadBuffer();
});

describe("Time tests", () => {
    test("Find time received of buffer", (done: jest.DoneCallback) => {
        const testTarget: number = 20;

        const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

        let testCount: number = 0;
        const fillReadBuffer: () => void = (): void => {
            if (testCount++ === testTarget) {
                // Something on page 2.
                const timeTarget: number = (targetBytes * 1.5 / defaultAudioFormat.avgBytesPerSec) * 1e7;

                try {
                    expect(testNode.findTimeAtOffset(timeTarget)).toEqual(2);
                    done();
                } catch (error) {
                    done(error);
                }

            } else {
                testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                    // Not really worried about the data, just filling the replay buffer.
                    fillReadBuffer();
                }, (error: string) => done(error));
            }
        };

        fillReadBuffer();
    });

    test("Offset requested not in buffer (low)", (done: jest.DoneCallback) => {
        const testTarget: number = 20;

        const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

        let testCount: number = 0;
        const fillReadBuffer: () => void = (): void => {
            if (testCount++ === testTarget) {
                // Shrink out 3 pages.
                const shrinkTarget: number = (targetBytes * 3 / defaultAudioFormat.avgBytesPerSec) * 1e7;
                testNode.shrinkBuffers(shrinkTarget);

                // Something on page 2.
                const timeTarget: number = (targetBytes * 1.5 / defaultAudioFormat.avgBytesPerSec) * 1e7;

                try {
                    expect(testNode.findTimeAtOffset(timeTarget)).toEqual(0);
                    done();
                } catch (error) {
                    done(error);
                }

            } else {
                testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                    // Not really worried about the data, just filling the replay buffer.
                    fillReadBuffer();
                }, (error: string) => done(error));
            }
        };

        fillReadBuffer();
    });

    test("Offset requested not in buffer (high)", (done: jest.DoneCallback) => {
        const testTarget: number = 20;

        const testNode: ReplayableAudioNode = new ReplayableAudioNode(testAudioNode, defaultAudioFormat.avgBytesPerSec);

        let testCount: number = 0;
        const fillReadBuffer: () => void = (): void => {
            if (testCount++ === testTarget) {
                // Shrink out 3 pages.
                const shrinkTarget: number = (targetBytes * 3 / defaultAudioFormat.avgBytesPerSec) * 1e7;
                testNode.shrinkBuffers(shrinkTarget);

                // Something on page 2.
                const timeTarget: number = (targetBytes * 1.5 / defaultAudioFormat.avgBytesPerSec) * 1e7;

                try {
                    expect(testNode.findTimeAtOffset(timeTarget)).toEqual(0);
                    done();
                } catch (error) {
                    done(error);
                }

            } else {
                testNode.read().then((chunk: IStreamChunk<ArrayBuffer>) => {
                    // Not really worried about the data, just filling the replay buffer.
                    fillReadBuffer();
                }, (error: string) => done(error));
            }
        };

        fillReadBuffer();
    });
});
