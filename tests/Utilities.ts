// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { Timeout } from "../src/common/Timeout";
import {
    WaveFileAudioInput
} from "./WaveFileAudioInputStream";

export const WaitForCondition = (condition: () => boolean, after: () => void): void => {
    if (condition() === true) {
        after();
    } else {
        setTimeout((): void => WaitForCondition(condition, after), 500);
    }
};

export const WaitForConditionAsync = async (condition: () => boolean, after: () => Promise<void>): Promise<void> => {
    if (condition() === true) {
        await after();
    } else {
        setTimeout((): Promise<void> => WaitForConditionAsync(condition, after), 500);
    }
};

export const sleep = (ms: number): Promise<void> => new Promise((resolve: (_: void) => void): Timeout => setTimeout(resolve, ms));

// This one is already an arrow function, so it stays the same
export const WaitForPromise = (condition: () => boolean, rejectMessage: string, timeout: number = 60 * 1000): Promise<void> => {
    return new Promise(async (resolve: (value: void) => void, reject: (reason: string) => void): Promise<void> => {
        const endTime: number = Date.now() + timeout;

        while (!condition() && Date.now() < endTime) {
            await sleep(500);
        }

        if (Date.now() <= endTime) {
            resolve();
        } else {
            reject("Condition timeout: " + rejectMessage);
        }
    });
};

export const closeAsyncObjects = async (objsToClose: any[]): Promise<void> => {
    for (const current of objsToClose) {
        if (typeof current.close === "function") {
            if (current.close.length === 2) {
                await new Promise<void>((resolve: () => void, reject: (reason: string) => void) => {
                    current.close(resolve, reject);
                });
            } else {
                await current.close();
            }
        }
    }
};

export class RepeatingPullStream {
    private bytesSent: number = 0x0;
    private sendSilence: boolean = false;
    private pullStream: sdk.PullAudioInputStream;

    public constructor(fileName: string) {
        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(fileName);

        this.pullStream = sdk.AudioInputStream.createPullStream(
            {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                close: (): void => { },
                read: (buffer: ArrayBuffer): number => {

                    if (!!this.sendSilence) {
                        return buffer.byteLength;
                    }

                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = this.bytesSent;
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - this.bytesSent) ? (fileBuffer.byteLength) : (this.bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    this.bytesSent += (end - start);

                    if ((end - start) < buffer.byteLength) {
                        // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                        this.bytesSent = 0;
                        this.sendSilence = true;
                    }

                    return (end - start);
                },
            });
    }

    public get PullStream(): sdk.PullAudioInputStream {
        return this.pullStream;
    }

    public StartRepeat(): void {
        this.sendSilence = false;
    }
}

export function CreateRepeatingPullStream(fileName: string): sdk.PullAudioInputStream {

    // Pump valid speech and then silence until at least one speech end cycle hits.
    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(fileName);

    let pumpSilence: boolean = false;
    let bytesSent: number = 0;

    return sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (pumpSilence) {
                    bytesSent += buffer.byteLength;
                    if (bytesSent >= 32000) {
                        bytesSent = 0;
                        pumpSilence = false;
                    }
                    return buffer.byteLength;
                } else {
                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength) : (bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    const readyToSend: number = (end - start);
                    bytesSent += readyToSend;

                    if (readyToSend < buffer.byteLength) {
                        bytesSent = 0;
                        pumpSilence = true;
                    }

                    return readyToSend;
                }

            },
        });

}