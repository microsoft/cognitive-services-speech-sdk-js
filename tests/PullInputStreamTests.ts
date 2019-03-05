// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAudioStreamNode,
    IStreamChunk,
} from "../src/common/Exports";
import {
    bufferSize,
    PullAudioInputStreamImpl,
} from "../src/sdk/Audio/AudioInputStream";
import { Settings } from "./Settings";

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
// tslint:disable-next-line:no-console
beforeEach(() => console.info("---------------------------------------Starting test case-----------------------------------"));

test("PullStream correctly reports bytes read", (done: jest.DoneCallback) => {

    let readReturnVal: number = bufferSize;

    const stream: PullAudioInputStreamImpl = new PullAudioInputStreamImpl({
        close: (): void => {
            return;
        },
        read: (dataBuffer: ArrayBuffer): number => {
            return readReturnVal;
        },
    });

    stream.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        audioNode.read().onSuccessContinueWith((readArray: IStreamChunk<ArrayBuffer>) => {
            try {
                expect(readArray.buffer.byteLength).toEqual(readReturnVal);
                expect(readArray.isEnd).toEqual(false);
                done();
            } catch (error) {
                done.fail(error);
            }
        });
    });

    readReturnVal = bufferSize;
    stream.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        audioNode.read().onSuccessContinueWith((readArray: IStreamChunk<ArrayBuffer>) => {
            try {
                expect(readArray.buffer.byteLength).toEqual(readReturnVal);
                expect(readArray.isEnd).toEqual(false);
                done();
            } catch (error) {
                done.fail(error);
            }
        });
    });

    readReturnVal = bufferSize;
    stream.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        audioNode.read().onSuccessContinueWith((readArray: IStreamChunk<ArrayBuffer>) => {
            try {
                expect(readArray.buffer.byteLength).toEqual(readReturnVal);
                expect(readArray.isEnd).toEqual(false);
                done();
            } catch (error) {
                done.fail(error);
            }
        });
    });
});

test("Returning 0 marks end of stream", (done: jest.DoneCallback) => {
    const stream: PullAudioInputStreamImpl = new PullAudioInputStreamImpl({
        close: (): void => {
            return;
        },
        read: (dataBuffer: ArrayBuffer): number => {
            return 0;
        },
    });

    stream.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        audioNode.read().onSuccessContinueWith((readArray: IStreamChunk<ArrayBuffer>) => {
            try {
                expect(readArray.buffer.byteLength).toEqual(0);
                expect(readArray.isEnd).toEqual(true);
                done();
            } catch (error) {
                done.fail(error);
            }
        });
    });
});

// Validates that the pull stream will request more bytes until it has been satisfied.
// Verifies no data is lost.
test("Pull stream accumulates bytes", (done: jest.DoneCallback) => {
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

    stream.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        audioNode.read().onSuccessContinueWith((readBuffer: IStreamChunk<ArrayBuffer>) => {
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
    });
});

// Validates that the pull stream will request more bytes until there are no more.
// Verifies no data is lost.
test("Pull stream accumulates bytes while available", (done: jest.DoneCallback) => {
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

    stream.attach("id").onSuccessContinueWith((audioNode: IAudioStreamNode) => {
        audioNode.read().onSuccessContinueWith((readBuffer: IStreamChunk<ArrayBuffer>) => {
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
    });
});
