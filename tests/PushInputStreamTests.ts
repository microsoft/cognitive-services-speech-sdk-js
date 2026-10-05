// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { setTimeout } from "timers";
import {
    IAudioStreamNode,
    IStreamChunk,
    InvalidOperationError,
} from "../src/common/Exports";
import {
    PushAudioInputStreamImpl,
} from "../src/sdk/Audio/AudioInputStream";
import {
    AudioFormatTag,
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

// eslint-disable-next-line no-console
beforeEach(() => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

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

    ps.attach("id").then((audioNode: IAudioStreamNode) => {

        let bytesRead: number = 0;

        const readLoop = () => {
            audioNode.read().then((audioBuffer: IStreamChunk<ArrayBuffer>) => {
                try {
                    expect(audioBuffer.buffer.byteLength).toBeGreaterThanOrEqual(bufferSize);
                    expect(audioBuffer.buffer.byteLength).toBeLessThanOrEqual(bufferSize);
                    const readView: Uint8Array = new Uint8Array(audioBuffer.buffer);
                    for (let i: number = 0; i < audioBuffer.buffer.byteLength; i++) {
                        expect(readView[i]).toEqual(bytesRead++ % 256);
                    }
                } catch (error) {
                    done(error);
                }

                if (bytesRead < bufferSize * 4) {
                    readLoop();
                } else {
                    done();
                }
            }, (error: string) => done(error));
        };

        readLoop();
    }, (error: string) => done(error));
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

    ps.attach("id").then((audioNode: IAudioStreamNode) => {
        let bytesRead: number = 0;

        const readLoop = () => {
            audioNode.read().then((audioBuffer: IStreamChunk<ArrayBuffer>) => {
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
                    done(error);
                }

            }, (error: string) => done(error));
        };

        readLoop();
    }, (error: string) => done(error));
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

    ps.attach("id").then((audioNode: IAudioStreamNode) => {
        let bytesRead: number = 0;
        let readCallCount: number = 0;
        let shouldBeEnd: boolean = false;

        const readLoop = () => {
            audioNode.read().then((audioBuffer: IStreamChunk<ArrayBuffer>) => {
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
                                    done(error);
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
                    done(error);
                }

            }, (error: string) => done(error));
        };

        readLoop();
    }, (error: string) => done(error));
}, 15000);

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

    ps.attach("id").then((audioNode: IAudioStreamNode) => {
        let bytesRead: number = 0;

        const readLoop = () => {
            audioNode.read().then((audioBuffer: IStreamChunk<ArrayBuffer>) => {
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
                    done(error);
                }

            }, (error: string) => done(error));
        };

        readLoop();
    }, (error: string) => done(error));
});

// Data read by a node, as sizes of audio chunks and "C<token>" for commit markers.
const describeChunk = (chunk: IStreamChunk<ArrayBuffer>): string => {
    if (chunk.commit !== undefined) {
        return `C${chunk.commit.token}`;
    }
    return chunk.isEnd ? "END" : `${chunk.buffer.byteLength}`;
};

const readN = async (node: IAudioStreamNode, n: number): Promise<string[]> => {
    const seen: string[] = [];
    for (let i = 0; i < n; i++) {
        seen.push(describeChunk(await node.read()));
    }
    return seen;
};

// Resolves to "pending" if the promise has not completed after the current I/O cycle.
const settledState = async <T>(p: Promise<T>): Promise<string> => {
    let state: string = "pending";
    p.then((): void => {
        state = "resolved";
    }, (): void => {
        state = "rejected";
    });
    await new Promise<void>((resolve: () => void): void => {
        setTimeout(resolve, 10);
    });
    return state;
};

test("Data written after a node is detached goes to the next node", async (): Promise<void> => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const first: IAudioStreamNode = await ps.attach("first");

    // A read waiting for data when the node is detached, as when recognition stops.
    const pendingRead: Promise<IStreamChunk<ArrayBuffer>> = first.read();
    await first.detach();

    ps.write(new ArrayBuffer(bufferSize));
    ps.write(new ArrayBuffer(bufferSize));

    // The cancelled read does not take the data.
    expect(await settledState(pendingRead)).toEqual("pending");

    const second: IAudioStreamNode = await ps.attach("second");
    expect(await readN(second, 2)).toEqual([`${bufferSize}`, `${bufferSize}`]);
    ps.close();
    expect(await readN(second, 1)).toEqual(["END"]);
});

test("Read on a detached node does not consume stream data", async (): Promise<void> => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const first: IAudioStreamNode = await ps.attach("first");
    await first.detach();

    ps.write(new ArrayBuffer(bufferSize));
    const afterDetach: IStreamChunk<ArrayBuffer> = await first.read();
    expect(afterDetach.isEnd).toEqual(true);
    expect(afterDetach.buffer).toEqual(null);

    const second: IAudioStreamNode = await ps.attach("second");
    expect(await readN(second, 1)).toEqual([`${bufferSize}`]);
});

test("Audio and commits written while detached are read in order by the next node", async (): Promise<void> => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const first: IAudioStreamNode = await ps.attach("first");
    ps.write(new ArrayBuffer(bufferSize));
    expect(await readN(first, 1)).toEqual([`${bufferSize}`]);

    const pendingRead: Promise<IStreamChunk<ArrayBuffer>> = first.read();
    await first.detach();

    // Full chunks, a partial chunk flushed by the commit, then more audio.
    ps.write(new ArrayBuffer(bufferSize * 2));
    ps.write(new ArrayBuffer(1000));
    const token: number = ps.commit();
    expect(token).toEqual(1);
    ps.write(new ArrayBuffer(bufferSize));
    expect(await settledState(pendingRead)).toEqual("pending");

    const second: IAudioStreamNode = await ps.attach("second");
    expect(await readN(second, 5)).toEqual([`${bufferSize}`, `${bufferSize}`, "1000", "C1", `${bufferSize}`]);
});

test("Commit after the next node is waiting is read in order", async (): Promise<void> => {
    // The case where the next recognition starts before anything is written.
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const first: IAudioStreamNode = await ps.attach("first");
    const pendingRead: Promise<IStreamChunk<ArrayBuffer>> = first.read();
    await first.detach();

    const second: IAudioStreamNode = await ps.attach("second");
    const secondReads: Promise<string[]> = readN(second, 3);

    ps.write(new ArrayBuffer(1000));
    expect(ps.commit()).toEqual(1);
    ps.write(new ArrayBuffer(bufferSize));

    expect(await secondReads).toEqual(["1000", "C1", `${bufferSize}`]);
    expect(await settledState(pendingRead)).toEqual("pending");
});

test("Detaching with no read waiting leaves the stream usable", async (): Promise<void> => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const first: IAudioStreamNode = await ps.attach("first");
    ps.write(new ArrayBuffer(bufferSize));
    expect(await readN(first, 1)).toEqual([`${bufferSize}`]);
    await first.detach();

    ps.write(new ArrayBuffer(bufferSize));
    ps.close();
    const second: IAudioStreamNode = await ps.attach("second");
    expect(await readN(second, 2)).toEqual([`${bufferSize}`, "END"]);
});

// Inline commit: PushAudioInputStream.commit(). The rate limit uses performance.now(), which
// these tests replace with a controlled clock. performance.now is read-only under node, so the
// global performance object is replaced instead and restored afterwards.
const withClock = async (body: (setTime: (ms: number) => void) => Promise<void> | void): Promise<void> => {
    let now: number = 1000;
    const original: PropertyDescriptor = Object.getOwnPropertyDescriptor(globalThis, "performance");
    Object.defineProperty(globalThis, "performance", {
        configurable: true,
        value: { now: (): number => now },
        writable: true,
    });
    try {
        await body((ms: number): void => {
            now = ms;
        });
    } finally {
        if (original !== undefined) {
            Object.defineProperty(globalThis, "performance", original);
        } else {
            delete (globalThis as { performance?: unknown }).performance;
        }
    }
};

test("Commit tokens start at 1 and increase", async (): Promise<void> => {
    await withClock((setTime: (ms: number) => void): void => {
        const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
        expect(ps.commit()).toEqual(1);
        setTime(1100);
        expect(ps.commit()).toEqual(2);
        setTime(1200);
        expect(ps.commit(0)).toEqual(3);
    });
});

test("Commit rate limit is measured between successful commits", async (): Promise<void> => {
    await withClock((setTime: (ms: number) => void): void => {
        const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
        expect(ps.commit()).toEqual(1);
        setTime(1050);
        expect(ps.commit()).toEqual(0);
        // The rejected call does not extend the window.
        setTime(1099);
        expect(ps.commit()).toEqual(0);
        setTime(1100);
        expect(ps.commit()).toEqual(2);
    });
});

test("Rejected commits enqueue nothing", async (): Promise<void> => {
    await withClock(async (setTime: (ms: number) => void): Promise<void> => {
        const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
        expect(ps.commit()).toEqual(1);
        expect(ps.commit()).toEqual(0);
        setTime(1100);
        expect(ps.commit()).toEqual(2);
        ps.close();
        const node: IAudioStreamNode = await ps.attach("node");
        const chunks: IStreamChunk<ArrayBuffer>[] = [await node.read(), await node.read(), await node.read()];
        expect(chunks.map(describeChunk)).toEqual(["C1", "C2", "END"]);
    });
});

test("Commit is accepted for PCM, A-law and mu-law", (): void => {
    expect(new PushAudioInputStreamImpl().commit()).toEqual(1);
    expect(new PushAudioInputStreamImpl(AudioStreamFormat.getWaveFormat(8000, 8, 1, AudioFormatTag.ALaw)).commit()).toEqual(1);
    expect(new PushAudioInputStreamImpl(AudioStreamFormat.getWaveFormat(8000, 8, 1, AudioFormatTag.MuLaw)).commit()).toEqual(1);
});

test("Commit is rejected for other formats", (): void => {
    // G.722 push input has no format tag or wave header in the JS SDK.
    expect(new PushAudioInputStreamImpl(AudioStreamFormat.getWaveFormat(16000, 16, 1, AudioFormatTag.G722)).commit()).toEqual(0);
    expect(new PushAudioInputStreamImpl(AudioStreamFormat.getWaveFormat(16000, 16, 1, AudioFormatTag.OGG_OPUS)).commit()).toEqual(0);
});

test("Commit with an invalid channel id throws", (): void => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const message: RegExp = /channelId must be an integer from 0 to 4294967295/;
    expect((): number => ps.commit(-1)).toThrow(message);
    expect((): number => ps.commit(1.5)).toThrow(message);
    expect((): number => ps.commit(NaN)).toThrow(message);
    expect((): number => ps.commit(0x100000000)).toThrow(message);
    expect((): number => ps.commit("1" as unknown as number)).toThrow(message);
    // Nothing was recorded by the failed calls.
    expect(ps.commit(0xFFFFFFFF)).toEqual(1);
});

test("Commit after close throws", (): void => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    ps.close();
    expect((): number => ps.commit()).toThrow(InvalidOperationError);
});

test("Commit carries the channel id", async (): Promise<void> => {
    await withClock(async (setTime: (ms: number) => void): Promise<void> => {
        const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
        ps.commit();
        setTime(1100);
        ps.commit(2);
        const node: IAudioStreamNode = await ps.attach("node");
        expect((await node.read()).commit.channelId).toBeUndefined();
        expect((await node.read()).commit.channelId).toEqual(2);
    });
});

test("Close discards undelivered commits but keeps the audio", async (): Promise<void> => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    ps.write(new ArrayBuffer(1000));
    expect(ps.commit()).toEqual(1);
    ps.close();

    const node: IAudioStreamNode = await ps.attach("node");
    expect(describeChunk(await node.read())).toEqual("1000");
    const marker: IStreamChunk<ArrayBuffer> = await node.read();
    expect(marker.commit.token).toEqual(1);
    expect(marker.commit.discarded).toEqual(true);
    expect(describeChunk(await node.read())).toEqual("END");
});

test("Close does not discard a delivered commit", async (): Promise<void> => {
    const ps: PushAudioInputStreamImpl = new PushAudioInputStreamImpl();
    const node: IAudioStreamNode = await ps.attach("node");
    expect(ps.commit()).toEqual(1);
    const marker: IStreamChunk<ArrayBuffer> = await node.read();
    // As a recognition session does when it takes the marker over.
    marker.commit.delivered = true;
    ps.close();
    expect(marker.commit.discarded).toBeUndefined();
});
