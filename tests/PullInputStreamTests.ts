// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAudioStreamNode,
    IStreamChunk,
} from "../src/common/Exports";
import {
    PullAudioInputStreamImpl,
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

// eslint-disable-next-line no-console
beforeEach(() => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

test("PullStream correctly reports bytes read", async (done: jest.DoneCallback) => {

    let readReturnVal: number = bufferSize;

    const stream: PullAudioInputStreamImpl = new PullAudioInputStreamImpl({
        close: (): void => {
            return;
        },
        read: (dataBuffer: ArrayBuffer): number => {
            return readReturnVal;
        },
    });

    let audioNode: IAudioStreamNode = await stream.attach("id");
    let readBuffer: IStreamChunk<ArrayBuffer> = await audioNode.read();
    try {
        expect(readBuffer.buffer.byteLength).toEqual(readReturnVal);
        expect(readBuffer.isEnd).toEqual(false);
    } catch (error) {
        done.fail(error);
    }

    readReturnVal = bufferSize;
    audioNode = await stream.attach("id");
    readBuffer = await audioNode.read();
    try {
        expect(readBuffer.buffer.byteLength).toEqual(readReturnVal);
        expect(readBuffer.isEnd).toEqual(false);
    } catch (error) {
        done.fail(error);
    }

    readReturnVal = bufferSize;
    audioNode = await stream.attach("id");
    readBuffer = await audioNode.read();
    try {
        expect(readBuffer.buffer.byteLength).toEqual(readReturnVal);
        expect(readBuffer.isEnd).toEqual(false);
        done();
    } catch (error) {
        done.fail(error);
    }
});

test("Returning 0 marks end of stream", async (done: jest.DoneCallback) => {
    const stream: PullAudioInputStreamImpl = new PullAudioInputStreamImpl({
        close: (): void => {
            return;
        },
        read: (dataBuffer: ArrayBuffer): number => {
            return 0;
        },
    });

    const audioNode: IAudioStreamNode = await stream.attach("id");
    const readBuffer: IStreamChunk<ArrayBuffer> = await audioNode.read();
    try {
        expect(readBuffer.buffer.byteLength).toEqual(0);
        expect(readBuffer.isEnd).toEqual(true);
        done();
    } catch (error) {
        done.fail(error);
    }
});

// Validates that the pull stream will request more bytes until it has been satisfied.
// Verifies no data is lost.
test("Pull stream accumulates bytes", async (done: jest.DoneCallback) => {
    let bytesReturned: number = 0;
    const stream: PullAudioInputStreamImpl = new PullAudioInputStreamImpl({
        close: (): void => {
            return;
        },
        read: (dataBuffer: ArrayBuffer): number => {
            const returnArray: Uint8Array = new Uint8Array(dataBuffer);
            returnArray[0] = bytesReturned++ % 256;
            return 1;
        },
    });

    const audioNode: IAudioStreamNode = await stream.attach("id");
    const readBuffer: IStreamChunk<ArrayBuffer> = await audioNode.read();
    try {
        expect(bytesReturned).toEqual(bufferSize);
        expect(readBuffer.buffer.byteLength).toEqual(bufferSize);
        const readArray: Uint8Array = new Uint8Array(readBuffer.buffer);

        for (let i: number = 0; i < bytesReturned; i++) {
            expect(readArray[i]).toEqual(i % 256);
        }

        done();
    } catch (error) {
        done.fail(error);
    }
});

// Validates that the pull stream will request more bytes until there are no more.
// Verifies no data is lost.
test("Pull stream accumulates bytes while available", async (done: jest.DoneCallback) => {
    let bytesReturned: number = 0;
    const stream: PullAudioInputStreamImpl = new PullAudioInputStreamImpl({
        close: (): void => {
            return;
        },
        read: (dataBuffer: ArrayBuffer): number => {
            const returnArray: Uint8Array = new Uint8Array(dataBuffer);
            if (bytesReturned < bufferSize / 2) {
                returnArray[0] = bytesReturned++ % 256;
                return 1;
            } else {
                return 0;
            }
        },
    });

    const audioNode: IAudioStreamNode = await stream.attach("id");
    const readBuffer: IStreamChunk<ArrayBuffer> = await audioNode.read();
    try {
        expect(bytesReturned).toEqual(bufferSize / 2);
        expect(readBuffer.buffer.byteLength).toEqual(bufferSize / 2);
        const readArray: Uint8Array = new Uint8Array(readBuffer.buffer);

        for (let i: number = 0; i < bytesReturned; i++) {
            expect(readArray[i]).toEqual(i % 256);
        }

        done();
    } catch (error) {
        done.fail(error);
    }
});
