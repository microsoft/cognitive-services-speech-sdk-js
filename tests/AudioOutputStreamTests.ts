// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAudioStreamNode,
    IStreamChunk,
} from "../src/common/Exports";
import { AudioOutputFormatImpl } from "../src/sdk/Audio/AudioOutputFormat";
import { PullAudioOutputStreamImpl } from "../src/sdk/Audio/AudioOutputStream";
import { Settings } from "./Settings";

let objsToClose: any[];

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
    objsToClose = [];
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // tslint:disable-next-line:no-console
    console.log(`Heap memory usage before test: ${Math.round(used * 100) / 100} MB`);
});

afterEach(() => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: any, index: number, array: any[]) => {
        if (typeof value.close === "function") {
            value.close();
        }
    });
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // tslint:disable-next-line:no-console
    console.log(`Heap memory usage after test: ${Math.round(used * 100) / 100} MB`);
});

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
    const readSize = ps.read(audioBuffer);

    try {
        expect(audioBuffer.byteLength).toBeGreaterThanOrEqual(size);
        expect(readSize).toEqual(size);
        const readView: Uint8Array = new Uint8Array(audioBuffer);
        for (let i: number = 0; i < audioBuffer.byteLength; i++) {
            expect(readView[i]).toEqual(bytesRead++ % 256);
        }
    } catch (error) {
        done.fail(error);
    }
    done();

});

test("PullAudioOutputStreamImpl multiple writes read after close", (done: jest.DoneCallback) => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    const format = AudioOutputFormatImpl.getDefaultOutputFormat();
    ps.format = format;

    const bufferSize = format.avgBytesPerSec / 10;
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
        const bytesRead = ps.read(audioBuffer);

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
            done.fail(error);
        }

        if (bytesRead !== 0) {
            readLoop();
        } else {
            done();
        }
    };

    readLoop();
});

test("PullAudioOutputStreamImpl multiple writes and reads", (done: jest.DoneCallback) => {
    const ps: PullAudioOutputStreamImpl = new PullAudioOutputStreamImpl();
    objsToClose.push(ps);
    const format = AudioOutputFormatImpl.getDefaultOutputFormat();
    ps.format = format;

    const bufferSize = format.avgBytesPerSec / 10;

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
        const bytesRead: number = ps.read(audioBuffer);

        try {
            expect(bytesRead).toBeLessThanOrEqual(bufferSize);
            const readView: Uint8Array = new Uint8Array(audioBuffer);
            for (let i: number = 0; i < bytesRead; i++) {
                expect(readView[i]).toEqual(bytesReadTotal++ % 256);
            }
        } catch (error) {
            done.fail(error);
        }

        if (bytesReadTotal < bufferSize * 4) {
            readLoop();
        } else {
            done();
        }
    };

    readLoop();
});
