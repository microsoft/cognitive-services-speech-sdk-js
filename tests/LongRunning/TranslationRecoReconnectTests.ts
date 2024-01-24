// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as fs from "fs";
import * as sdk from "../../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../../src/common.browser/Exports";
import { Events, EventType } from "../../src/common/Exports";

import { Settings } from "../Settings";
import { WaveFileAudioInput } from "../WaveFileAudioInputStream";

import { WaitForCondition } from "../Utilities";


let objsToClose: any[];

beforeAll((): void => {
    // override inputs, if necessary
    Settings.LoadSettings();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

afterEach((): void => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: { close: () => any }): void => {
        if (typeof value.close === "function") {
            value.close();
        }
    });
});

const BuildSpeechConfig: () => sdk.SpeechTranslationConfig = (): sdk.SpeechTranslationConfig => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    return s;
};

// Tests client reconnect after speech timeouts.
test("Reconnect After timeout", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Reconnect After timeout");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // eslint-disable-next-line no-console
        console.info("Skipping test.");
        done();
        return;
    }

    // Pump valid speech and then silence until at least one speech end cycle hits.
    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    const alternatePhraseFileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.LuisWaveFile);

    let s: sdk.SpeechTranslationConfig;
    if (undefined === Settings.SpeechTimeoutEndpoint || undefined === Settings.SpeechTimeoutKey) {
        // eslint-disable-next-line no-console
        console.warn("Running timeout test against production, this will be very slow...");
        s = BuildSpeechConfig();
    } else {
        s = sdk.SpeechTranslationConfig.fromEndpoint(new URL(Settings.SpeechTimeoutEndpoint), Settings.SpeechTimeoutKey);
    }
    objsToClose.push(s);

    s.addTargetLanguage(Settings.WaveFileLanguage);
    s.speechRecognitionLanguage = Settings.WaveFileLanguage;

    let pumpSilence: boolean = false;
    let sendAlternateFile: boolean = false;

    let bytesSent: number = 0;
    const targetLoops: number = 250;

    // Pump the audio from the wave file specified with 1 second silence between iterations indefinetly.
    const p = sdk.AudioInputStream.createPullStream(
        {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            close: (): void => { },
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
                    const end: number = buffer.byteLength > (sendBuffer.byteLength - bytesSent) ? (sendBuffer.byteLength) : (bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(sendBuffer.slice(start, end)));
                    const readyToSend: number = (end - start);
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

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
    objsToClose.push(r);

    let speechEnded: number = 0;
    let lastOffset: number = 0;
    let recogCount: number = 0;
    let canceled: boolean = false;
    let inTurn: boolean = false;
    let alternatePhrase: boolean = false;

    r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        try {
            // If the target number of loops has been seen already, don't check as the audio being sent could have been clipped randomly during a phrase,
            // and failing because of that isn't warranted.
            if (recogCount <= targetLoops) {
                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
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
                if (recogCount++ >= targetLoops) {
                    p.close();
                }
            }
        } catch (error) {
            done(error as string);
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            canceled = true;
        } catch (error) {
            done(error as string);
        }
    };

    r.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = true;
    });

    r.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = false;
    });

    r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs): void => {
        speechEnded++;
    };

    r.startContinuousRecognitionAsync((): void => {
        WaitForCondition((): boolean => (canceled && !inTurn), (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                try {
                    expect(speechEnded).toEqual(1);
                    done();
                } catch (error) {
                    done(error as string);
                }
            }, (error: string): void => {
                done(error);
            });
        });
    },
        (err: string): void => {
            done(err);
        });
}, 1000 * 60 * 12);

test("Test new connection on empty push stream for translator", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Test new connection on empty push stream for translator");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // eslint-disable-next-line no-console
        console.info("Skipping test.");
        done();
        return;
    }

    // eslint-disable-next-line no-console
    console.warn("Running timeout test against production, this will be very slow...");
    const s = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-US";
    s.addTargetLanguage("de-DE");
    let disconnected: boolean = false;
    let reconnected: boolean = false;
    let reconnectTime: number;

    const openPushStream = (): sdk.PushAudioInputStream => {
        // create the push stream we need for the speech sdk.
        const pushStream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const chunkSize: number = 512;

        // open the file and push it to the push stream in chunkSize bytes per "data" event.
        const stream = fs.createReadStream(Settings.EvenLongerWaveFile, { highWaterMark: chunkSize });

        stream.on("data", (arrayBuffer: Buffer): void => {
            pushStream.write(arrayBuffer.slice());
            if (!reconnected) {
                // Using very small chunks, we paused for pauseInSeconds after reading each chunk,
                // elongating the read time for the file.
                stream.pause();
                const pauseInSeconds = Math.random();
                // set timeout for resume
                setTimeout(
                    (): void => {
                        stream.resume();
                    },
                    pauseInSeconds * 1000);

            }
        });
        objsToClose.push(stream);
        objsToClose.push(pushStream);

        return pushStream;
    };

    objsToClose.push(s);

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(openPushStream());

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
    objsToClose.push(r);

    r.recognizing = (s: sdk.TranslationRecognizer, event: sdk.TranslationRecognitionEventArgs): void => {
        if (reconnected) {
            if (Date.now() < reconnectTime + (1000 * 60 * 4)) {
                done();
            } else {
                done("Recognizing callback didn't happen within 4 minutes after reconnect");
            }
        }
    };
    r.canceled = (s: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.errorCode === sdk.CancellationErrorCode.BadRequestParameters) {
            done("Bad Request received from service, rerun test");
        }
    };

    const conn: sdk.Connection = sdk.Connection.fromRecognizer(r);
    objsToClose.push(conn);
    conn.disconnected = (): void => {
        disconnected = true;
    };
    conn.connected = (): void => {
        if (disconnected) {
            reconnected = true;
            reconnectTime = Date.now();
        }
    };

    r.startContinuousRecognitionAsync((): void => {
        // empty block
    },
    (err: string): void => {
        done(err);
    });
}, 1000 * 60 * 70); // 70 minutes.
