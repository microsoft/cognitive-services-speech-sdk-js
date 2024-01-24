// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { ServiceRecognizerBase } from "../src/common.speech/Exports";
import { HeaderNames } from "../src/common.speech/HeaderNames";
import { QueryParameterNames } from "../src/common.speech/QueryParameterNames";
import { ConnectionStartEvent, IDetachable } from "../src/common/Exports";
import { Events, EventType, PlatformEvent } from "../src/common/Exports";

import { Settings } from "./Settings";
import { validateTelemetry } from "./TelemetryUtil";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

import * as fs from "fs";

import { setTimeout } from "timers";
import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";

import { AudioStreamFormatImpl } from "../src/sdk/Audio/AudioStreamFormat";


const FIRST_EVENT_ID: number = 1;
const Recognizing: string = "Recognizing";
const Recognized: string = "Recognized";
const Canceled: string = "Canceled";

let objsToClose: any[];

beforeAll(() => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
});

beforeEach(() => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

export const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);
    const language: string = Settings.WaveFileLanguage;
    if (s.speechRecognitionLanguage === undefined) {
        s.speechRecognitionLanguage = language;
    }

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {

    let s: sdk.SpeechConfig;
    if (undefined === Settings.SpeechEndpoint) {
        s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    } else {
        s = sdk.SpeechConfig.fromEndpoint(new URL(Settings.SpeechEndpoint), Settings.SpeechSubscriptionKey);
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_Region, Settings.SpeechRegion);
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

describe.each([true])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    describe("Intiial Silence Tests", () => {
        test("InitialSilenceTimeout (pull)", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
            console.info("Name: InitialSilenceTimeout (pull)");
            let p: sdk.PullAudioInputStream;
            let bytesSent: number = 0;

            // To make sure we don't send a ton of extra data.
            // For reference, before the throttling was implemented, we sent 6-10x the required data.
            const startTime: number = Date.now();

            p = sdk.AudioInputStream.createPullStream(
                {
                    close: () => { return; },
                    read: (buffer: ArrayBuffer): number => {
                        bytesSent += buffer.byteLength;
                        return buffer.byteLength;
                    },
                });

            const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

            testInitialSilenceTimeout(config, done, (): void => {
                const elapsed: number = Date.now() - startTime;

                // We should have sent 5 seconds of audio unthrottled and then 2x the time reco took until we got a response.
                const expectedBytesSent: number = (5 * 16000 * 2) + (2 * elapsed * 32000 / 1000);
                expect(bytesSent).toBeLessThanOrEqual(expectedBytesSent);

            });
        }, 15000);

        test("InitialSilenceTimeout (push)", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
            console.info("Name: InitialSilenceTimeout (push)");
            const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
            const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
            const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

            p.write(bigFileBuffer.buffer);
            p.close();

            testInitialSilenceTimeout(config, done);
        }, 15000);

        Settings.testIfDOMCondition("InitialSilenceTimeout (File)", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
            console.info("Name: InitialSilenceTimeout (File)");
            const audioFormat: AudioStreamFormatImpl = sdk.AudioStreamFormat.getDefaultInputFormat() as AudioStreamFormatImpl;
            const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
            const bigFile: File = ByteBufferAudioFile.Load([audioFormat.header, bigFileBuffer.buffer]);

            const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(bigFile);

            testInitialSilenceTimeout(config, done);
        }, 15000);

        const testInitialSilenceTimeout = (config: sdk.AudioConfig, done: jest.DoneCallback, addedChecks?: () => void): void => {
            const s: sdk.SpeechConfig = BuildSpeechConfig();
            objsToClose.push(s);

            s.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");

            const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
            objsToClose.push(r);

            expect(r).not.toBeUndefined();
            expect(r instanceof sdk.Recognizer);

            let numReports: number = 0;

            r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
                done(e.errorDetails);
            };

            r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
                try {
                    const res: sdk.SpeechRecognitionResult = e.result;
                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason.NoMatch).toEqual(res.reason);
                    expect(res.text).toBeUndefined();
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
                    expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
                } catch (error) {
                    done(error);
                } finally {
                    numReports++;
                }

            };

            r.recognizeOnceAsync(
                (p2: sdk.SpeechRecognitionResult) => {
                    try {
                        const res: sdk.SpeechRecognitionResult = p2;
                        numReports++;

                        expect(res).not.toBeUndefined();
                        expect(sdk.ResultReason.NoMatch).toEqual(res.reason);
                        expect(res.errorDetails).toBeUndefined();
                        expect(res.text).toBeUndefined();
                        expect(res.properties).not.toBeUndefined();
                        expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                        const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
                        expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
                    } catch (error) {
                        done(error);
                    }
                },
                (error: string) => {
                    fail(error);
                });

            WaitForCondition(() => (numReports === 2), () => {
                try {
                    if (!!addedChecks) {
                        addedChecks();
                    }
                    done();
                } catch (error) {
                    done(error);
                }
            });
        };

        test.skip("InitialBabbleTimeout", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
            console.info("Name: InitialBabbleTimeout");

            const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
            expect(s).not.toBeUndefined();

            s.speechRecognitionLanguage = "es-MX";

            const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

            const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
            expect(r).not.toBeUndefined();
            expect(r instanceof sdk.Recognizer);

            r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                try {
                    expect(e.errorDetails).toBeUndefined();
                } catch (error) {
                    done(error);
                }
            };

            r.recognizeOnceAsync(
                (p2: sdk.SpeechRecognitionResult) => {
                    try {
                        const res: sdk.SpeechRecognitionResult = p2;
                        expect(res).not.toBeUndefined();
                        expect("What's the weather like?").toEqual(res.text);
                        expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);

                        r.close();
                        s.close();
                        done();
                    } catch (error) {
                        done(error);
                    }
                },
                (error: string) => {
                    r.close();
                    s.close();
                    done(error);
                });
        });
    });

    test("burst of silence", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: burst of silence");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const f: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const emptyBuffer: Uint8Array = new Uint8Array(1 * 1024);
        p.write(emptyBuffer.buffer);
        p.close();

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.NoError]);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            } catch (error) {
                done(error);
            }
        };
        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                try {
                    const res: sdk.SpeechRecognitionResult = p2;

                    expect(res).not.toBeUndefined();
                    expect(res.reason).toEqual(sdk.ResultReason.NoMatch);
                    const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
                    expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done(error);
                }
            },
            (error: string) => {
                done(error);
            });
    });

    // For review: v2 endpoint does not appear to be setting a default
    // initial silence timeout of < 70s, disabling until clarification received
    // from service team
    test.skip("InitialSilenceTimeout Continuous", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: InitialSilenceTimeout Continuous");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        let p: sdk.PullAudioInputStream;

        p = sdk.AudioInputStream.createPullStream(
            {
                close: () => { return; },
                read: (buffer: ArrayBuffer): number => {
                    return buffer.byteLength;
                },
            });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            // Since the pull stream above will always return an empty array, there should be
            // no other reason besides an error for cancel to hit.
            done(e.errorDetails);
        };

        let passed: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {

            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason.NoMatch).toEqual(res.reason);
            expect(res.text).toBeUndefined();

            const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
            expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
            passed = true;
        };

        /* tslint:disable:no-empty */
        r.startContinuousRecognitionAsync(() => {
        },
            (error: string) => {
                done(error);
            });

        WaitForCondition(() => passed, () => {
            r.stopContinuousRecognitionAsync(() => {
                done();
            }, (error: string) => done(error));
        });

    }, 30000);

    // For review: v2 endpoint does not appear to be sending a NoMatch result
    // on end silence timeout, instead sends a Recognized result with empty text
    // disabling until clarification received from service team
    test.skip("Silence After Speech", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Silence After Speech");
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(32 * 1024 * 30); // ~30 seconds.
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        p.write(WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile));
        p.write(bigFileBuffer.buffer);
        p.close();

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let noMatchCount: number = 0;
        let speechEnded: number = 0;
        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            try {
                if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    expect(speechRecognized).toEqual(false);
                    speechRecognized = true;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                    expect(speechRecognized).toEqual(true);
                    noMatchCount++;
                }
            } catch (error) {
                done(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                canceled = true;
            } catch (error) {
                done(error);
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

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (canceled && !inTurn), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
                        expect(speechEnded).toEqual(noMatchCount);
                        expect(noMatchCount).toBeGreaterThanOrEqual(2);
                        done();
                    } catch (error) {
                        done(error);
                    }
                }, (error: string) => {
                    done(error);
                });
            });
        },
            (err: string) => {
                done(err);
            });
    }, 30000);

    // For review: v2 endpoint does not appear to be setting a default
    // initial silence timeout of < 70s, disabling until clarification received
    // from service team
    test.skip("Silence Then Speech", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Silence Then Speech");
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(32 * 1024 * 30); // ~30 seconds.
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        p.write(bigFileBuffer.buffer);
        p.write(WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile));
        p.close();

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let noMatchCount: number = 0;
        let speechEnded: number = 0;
        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            try {
                if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    expect(speechRecognized).toEqual(false);
                    expect(noMatchCount).toBeGreaterThanOrEqual(1);
                    speechRecognized = true;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                    expect(speechRecognized).toEqual(false);
                    noMatchCount++;
                }
            } catch (error) {
                done(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                canceled = true;
            } catch (error) {
                done(error);
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

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (canceled && !inTurn), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
                        expect(speechEnded).toEqual(noMatchCount + 1);
                        expect(noMatchCount).toEqual(2);
                        done();
                    } catch (error) {
                        done(error);
                    }
                }, (error: string) => {
                    done(error);
                });
            });
        },
            (err: string) => {
                done(err);
            });
    }, 35000);
});
