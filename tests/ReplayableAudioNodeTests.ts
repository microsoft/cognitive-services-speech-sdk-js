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

// These tests prove the byte-level guarantee that makes reliable reconnection safe:
// across a (simulated) disconnect the node must resend every audio byte the service has
// not acknowledged - exactly once, in order, with no gap and no duplicate. This is the
// SDK half of the contract; the service uses the continuation offset we send to discard
// any small overlap that page rounding could introduce.
describe("Byte continuity across a simulated reconnect", () => {
    // Default input format is 16 kHz / 16-bit / mono => 32000 bytes per second.
    const bytesPerSecond: number = defaultAudioFormat.avgBytesPerSec;
    // 3200 bytes == 0.1s == 1,000,000 ticks. Whole, even-byte boundaries keep tick math exact.
    const chunkBytes: number = 3200;
    const totalChunks: number = 10;

    // A deterministic underlying source: it hands out fixed-size chunks carved from a known
    // byte stream, then reports end-of-stream. Because the bytes are a known function of their
    // position, the bytes that come back out of the ReplayableAudioNode can be matched, byte for
    // byte, against the original stream.
    const buildDeterministicNode: (original: Uint8Array) => IAudioStreamNode =
        (original: Uint8Array): IAudioStreamNode => {
            let produced: number = 0; // bytes already produced by the underlying source.
            return {
                detach: (): Promise<void> => Promise.resolve(),
                id: (): string => "byte-continuity",
                read: (): Promise<IStreamChunk<ArrayBuffer>> => {
                    if (produced >= original.byteLength) {
                        return Promise.resolve<IStreamChunk<ArrayBuffer>>({
                            buffer: new ArrayBuffer(0),
                            isEnd: true,
                            timeReceived: produced,
                        });
                    }

                    const chunk: ArrayBuffer = original.buffer.slice(produced, produced + chunkBytes);
                    produced += chunkBytes;

                    return Promise.resolve<IStreamChunk<ArrayBuffer>>({
                        buffer: chunk,
                        isEnd: false,
                        timeReceived: produced,
                    });
                },
            };
        };

    const byteToTicks: (byteOffset: number) => number =
        (byteOffset: number): number => (byteOffset / bytesPerSecond) * 1e7;

    // Reads chunks until the underlying source is exhausted, returning every byte that flowed
    // out in order. This is the byte stream that would be (re)sent to the service.
    const drainToEnd: (node: ReplayableAudioNode) => Promise<number[]> =
        async (node: ReplayableAudioNode): Promise<number[]> => {
            const bytes: number[] = [];
            for (; ;) {
                const chunk: IStreamChunk<ArrayBuffer> = await node.read();
                if (chunk.isEnd) {
                    break;
                }
                bytes.push(...new Uint8Array(chunk.buffer));
            }
            return bytes;
        };

    test("resends every unacknowledged byte exactly once - acknowledged on a page boundary", async (): Promise<void> => {
        const total: number = totalChunks * chunkBytes;
        const original: Uint8Array = new Uint8Array(total);
        for (let i: number = 0; i < total; i++) {
            original[i] = i % 256;
        }

        const node: ReplayableAudioNode = new ReplayableAudioNode(buildDeterministicNode(original), bytesPerSecond);

        // Connection 1: read (and "send") the first 6 chunks. All 6 are retained for replay.
        for (let i: number = 0; i < 6; i++) {
            await node.read();
        }

        // The service acknowledges the first 3 chunks (byte 9600). Chunks 4-6 were sent but
        // are NOT acknowledged, so on reconnect they must be resent.
        const ackByte: number = 3 * chunkBytes; // 9600 - exactly a page boundary.
        node.shrinkBuffers(byteToTicks(ackByte));

        // Reconnect: replay from the acknowledged offset, then continue with brand new audio.
        node.replay();
        const resent: number[] = await drainToEnd(node);

        // No missing, no duplicate: connection 2 carries exactly the original stream from the
        // acknowledged byte to the end.
        expect(resent).toEqual(Array.from(original.slice(ackByte)));

        // What the service ends up holding: the prefix it acknowledged on connection 1 plus
        // everything connection 2 resent. It must reconstruct the original audio byte for byte.
        const serviceView: number[] = [
            ...Array.from(original.slice(0, ackByte)),
            ...resent,
        ];
        expect(serviceView).toEqual(Array.from(original));
        expect(serviceView.length).toEqual(total);
    });

    test("resumes exactly at the acknowledged byte - acknowledged mid page", async (): Promise<void> => {
        const total: number = totalChunks * chunkBytes;
        const original: Uint8Array = new Uint8Array(total);
        for (let i: number = 0; i < total; i++) {
            original[i] = (i * 7 + 13) % 256;
        }

        const node: ReplayableAudioNode = new ReplayableAudioNode(buildDeterministicNode(original), bytesPerSecond);

        for (let i: number = 0; i < 6; i++) {
            await node.read();
        }

        // Acknowledge a byte in the MIDDLE of chunk 4 (still an even / sample boundary). The node
        // keeps the whole page containing the ack point, but replay must resume at the exact ack
        // byte so the already-acknowledged head of that page is not resent.
        const ackByte: number = 3 * chunkBytes + 1400; // 11000
        node.shrinkBuffers(byteToTicks(ackByte));

        node.replay();
        const resent: number[] = await drainToEnd(node);

        // Replay starts exactly at the acknowledged byte, not at the page boundary: no acknowledged
        // audio is replayed (no duplicate) and nothing after the ack is dropped (no gap).
        expect(resent).toEqual(Array.from(original.slice(ackByte)));

        const serviceView: number[] = [
            ...Array.from(original.slice(0, ackByte)),
            ...resent,
        ];
        expect(serviceView).toEqual(Array.from(original));
    });
});
