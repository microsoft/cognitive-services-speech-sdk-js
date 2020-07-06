// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as sdk from "../../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../../src/common.browser/Exports";
import { Events, EventType, PlatformEvent } from "../../src/common/Exports";

import { Settings } from "../Settings";
import { WaveFileAudioInput } from "../WaveFileAudioInputStream";

import { WaitForCondition } from "../Utilities";

let objsToClose: any[];

beforeAll(() => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
    // tslint:disable-next-line:no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

afterEach(() => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: any, index: number, array: any[]) => {
        if (typeof value.close === "function") {
            value.close();
        }
    });
});

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {

    let s: sdk.SpeechConfig;
    if (undefined === Settings.SpeechEndpoint) {
        s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    } else {
        s = sdk.SpeechConfig.fromEndpoint(new URL(Settings.SpeechEndpoint), Settings.SpeechSubscriptionKey);
    }

    expect(s).not.toBeUndefined();
    return s;
};

// Tests client reconnect after speech timeouts.
test("Reconnect After timeout", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Reconnect After timeout");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // tslint:disable-next-line:no-console
        console.info("Skipping test.");
        done();
        return;
    }

    // Pump valid speech and then silence until at least one speech end cycle hits.
    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    const alternatePhraseFileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.LuisWaveFile);

    let p: sdk.PullAudioInputStream;
    let s: sdk.SpeechConfig;
    if (undefined === Settings.SpeechTimeoutEndpoint || undefined === Settings.SpeechTimeoutKey) {
        // tslint:disable-next-line:no-console
        console.warn("Running timeout test against production, this will be very slow...");
        s = BuildSpeechConfig();
    } else {
        s = sdk.SpeechConfig.fromEndpoint(new URL(Settings.SpeechTimeoutEndpoint), Settings.SpeechTimeoutKey);
    }
    objsToClose.push(s);

    let pumpSilence: boolean = false;
    let sendAlternateFile: boolean = false;

    let bytesSent: number = 0;
    const targetLoops: number = 500;

    // Pump the audio from the wave file specified with 1 second silence between iterations indefinetly.
    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (pumpSilence) {
                    bytesSent += buffer.byteLength;
                    if (bytesSent >= 16000) {
                        bytesSent = 0;
                        pumpSilence = false;
                    }
                    return buffer.byteLength;
                } else {
                    // Alternate between the two files with different phrases in them.
                    const sendBuffer: ArrayBuffer = sendAlternateFile ? alternatePhraseFileBuffer : fileBuffer;

                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const end: number = buffer.byteLength > (sendBuffer.byteLength - bytesSent) ? (sendBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                    copyArray.set(new Uint8Array(sendBuffer.slice(start, end)));
                    const readyToSend: number = (end - start) + 1;
                    bytesSent += readyToSend;

                    if (readyToSend < buffer.byteLength) {
                        bytesSent = 0;
                        pumpSilence = true;
                        sendAlternateFile = !sendAlternateFile;
                    }

                    return readyToSend;
                }

            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    let lastOffset: number = 0;
    let recogCount: number = 0;
    let alternatePhrase: boolean = false;
    let connections: number = 0;
    let disconnects: number = 0;
    let postDisconnectReco: boolean = false;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
        try {
            // If the target number of loops has been seen already, don't check as the audio being sent could have been clipped randomly during a phrase,
            // and failing because of that isn't warranted.
            if (recogCount <= targetLoops) {

                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(e.offset).toBeGreaterThanOrEqual(lastOffset);
                lastOffset = e.offset;

                // If there is silence exactly at the moment of disconnect, an extra speech.phrase with text ="" is returned just before the
                // connection is disconnected.
                if ("" !== e.result.text) {
                    if (alternatePhrase) {
                        expect(e.result.text).toEqual(Settings.LuisWavFileText);
                    } else {
                        expect(e.result.text).toEqual(Settings.WaveFileText);
                    }

                    alternatePhrase = !alternatePhrase;
                }

                if (disconnects > 0) {
                    postDisconnectReco = true;
                }

                if (recogCount++ >= targetLoops) {
                    p.close();
                }
            }
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
        } catch (error) {
            done.fail(error);
        }
    };

    connection.disconnected = (e: sdk.SessionEventArgs) => {
        disconnects++;
    };

    connection.connected = (e: sdk.SessionEventArgs) => {
        connections++;
    };

    r.startContinuousRecognitionAsync(() => {
        WaitForCondition(() => (!!postDisconnectReco), () => {
            r.stopContinuousRecognitionAsync(() => {
                try {
                    expect(connections).toEqual(2);
                    expect(disconnects).toEqual(1);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            }, (error: string) => {
                done.fail(error);
            });
        });
    },
        (err: string) => {
            done.fail(err);
        });
}, 1000 * 60 * 12);
