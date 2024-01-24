// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioOutputFormatImpl } from "../src/sdk/Audio/AudioOutputFormat";
import { PullAudioOutputStream, PullAudioOutputStreamImpl } from "../src/sdk/Audio/AudioOutputStream";
import { Settings } from "./Settings";
import { closeAsyncObjects } from "./Utilities";

let objsToClose: any[];


beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

beforeEach(() => {
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    objsToClose = [];
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // eslint-disable-next-line no-console
    console.log(`Heap memory usage before test: ${Math.round(used * 100) / 100} MB`);
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);

    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // eslint-disable-next-line no-console
    console.log(`Heap memory usage after test: ${Math.round(used * 100) / 100} MB`);

});

const ReadPullAudioOutputStream: (stream: PullAudioOutputStream, length?: number) => Promise<void> =
    async (stream: PullAudioOutputStream, length?: number): Promise<void> => {
        const audioBuffer = new ArrayBuffer(1024);
        const bytesRead: number = await stream.read(audioBuffer);
        if (bytesRead > 0) {
            await ReadPullAudioOutputStream(stream, length === undefined ? undefined : length - bytesRead);
        } else {
            if (length !== undefined) {
                expect(length).toEqual(0);
            }

            return Promise.resolve();
        }

    };

test("PullAudioOutputStreamImpl basic test", (done: jest.DoneCallback) => {
    const size: number = 256;
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    objsToClose.push(ps);
    ps.format = AudioOutputFormatImpl.getDefaultOutputFormat();
    const ab: ArrayBuffer = new ArrayBuffer(size);

    const abView: Uint8Array = new Uint8Array(ab);
    for (let i: number = 0; i < size; i++) {
        abView[i] = i % 256;
    }
    ps.write(abView);

    let bytesRead: number = 0;
    const audioBuffer = new ArrayBuffer(size);

    ps.read(audioBuffer).then((readSize: number) => {
        try {
            expect(readSize).toEqual(size);
            const readView: Uint8Array = new Uint8Array(audioBuffer);
            for (let i: number = 0; i < readSize; i++) {
                expect(readView[i]).toEqual(bytesRead++ % 256);
            }
        } catch (error) {
            done(error);
        }
        done();
    }, (error: string) => {
        done(error);
    });
});

test("PullAudioOutputStreamImpl multiple writes read after close", (done: jest.DoneCallback) => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    const format = AudioOutputFormatImpl.getDefaultOutputFormat();
    ps.format = format;

    const bufferSize = Math.floor(format.avgBytesPerSec / 10);
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

    let bytesReadTotal: number = 0;
    const audioBuffer = new ArrayBuffer(bufferSize);

    const readLoop = () => {
        ps.read(audioBuffer).then((bytesRead: number) => {
            try {
                if (bytesRead === 0) {
                    expect(bytesReadTotal).toEqual(bufferSize * 4);
                } else {
                    const readView: Uint8Array = new Uint8Array(audioBuffer);
                    for (let i: number = 0; i < bytesRead; i++) {
                        expect(readView[i]).toEqual(bytesReadTotal++ % 256);
                    }
                }
            } catch (error) {
                done(error);
            }

            if (bytesRead > 0) {
                readLoop();
            } else {
                done();
            }
        }, (error: string) => {
            done(error);
        });
    };

    readLoop();
});

test("PullAudioOutputStreamImpl multiple writes and reads", (done: jest.DoneCallback) => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    objsToClose.push(ps);
    const format = AudioOutputFormatImpl.getDefaultOutputFormat();
    ps.format = format;

    const bufferSize = Math.floor(format.avgBytesPerSec / 10);

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

    let bytesReadTotal: number = 0;
    const audioBuffer = new ArrayBuffer(bufferSize);

    const readLoop = () => {
        ps.read(audioBuffer).then((bytesRead: number) => {
            try {
                expect(bytesRead).toBeLessThanOrEqual(bufferSize);
                const readView: Uint8Array = new Uint8Array(audioBuffer);
                for (let i: number = 0; i < bytesRead; i++) {
                    expect(readView[i]).toEqual(bytesReadTotal++ % 256);
                }
            } catch (error) {
                done(error);
            }

            if (bytesReadTotal < bufferSize * 4) {
                readLoop();
            } else {
                done();
            }
        }, (error: string) => {
            done(error);
        });
    };

    readLoop();
});

test("PullAudioOutputStreamImpl reads before writing", async (): Promise<void> => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    objsToClose.push(ps);

    const format = AudioOutputFormatImpl.getDefaultOutputFormat();
    ps.format = format;

    const bufferSize = Math.floor(format.avgBytesPerSec / 10);

    const readPromise: Promise<void> = ReadPullAudioOutputStream(ps, bufferSize * 4);

    process.nextTick((): void => {
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
    });

    await readPromise;
});

test("PullAudioOutputStreamImpl read all audio data in single read", async (): Promise<void> => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    const format = AudioOutputFormatImpl.fromSpeechSynthesisOutputFormatString("raw-24khz-16bit-mono-pcm");
    ps.format = format;

    const bufferSize = Math.floor(format.avgBytesPerSec / 10);
    const ab: ArrayBuffer = new ArrayBuffer(bufferSize * 4);
    const abView: Uint8Array = new Uint8Array(ab);
    for (let k: number = 0; k < 1500; k++) { // 10 minutes data
        for (let i: number = 0; i < bufferSize * 4; i++) {
            abView[i] = (i + k * bufferSize * 4) % 256;
        }
        ps.write(ab);
    }

    ps.close();

    const audioBuffer = new ArrayBuffer(bufferSize * 6000);

    const bytesRead: number = await ps.read(audioBuffer);
    expect(bytesRead).toEqual(bufferSize * 6000);
    const readView: Uint8Array = new Uint8Array(audioBuffer);
    for (let i: number = 0; i < bytesRead - 1000; i += 997) { // not check all to avoid long running.
        expect(readView[i]).toEqual(i % 256);
    }


});
