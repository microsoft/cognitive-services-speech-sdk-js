// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as sdk from "../../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../../src/common.browser/Exports";
import { Events, EventType, PlatformEvent } from "../../src/common/Exports";

import { Settings } from "../Settings";
import { WaveFileAudioInput } from "../WaveFileAudioInputStream";

import * as request from "request";

import WaitForCondition from "../Utilities";

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

test("AuthToken refresh works correctly", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: AuthToken refresh works correctly");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // tslint:disable-next-line:no-console
        console.info("Skipping test.");
        done();
        return;
    }

    const req = {
        headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": Settings.SpeechSubscriptionKey,
        },
        url: "https://" + Settings.SpeechRegion + ".api.cognitive.microsoft.com/sts/v1.0/issueToken",
    };

    let authToken: string;

    request.post(req, (error: any, response: request.Response, body: any) => {
        authToken = body;
    });

    WaitForCondition(() => {
        return !!authToken;
    }, () => {
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromAuthorizationToken(authToken, Settings.SpeechRegion);
        objsToClose.push(s);

        let pumpSilence: boolean = false;
        let bytesSent: number = 0;
        let streamStopped: boolean = false;

        // Pump the audio from the wave file specified with 1 second silence between iterations indefinetly.
        const p: sdk.PullAudioInputStream = sdk.AudioInputStream.createPullStream(
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
                        const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                        copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                        const readyToSend: number = (end - start) + 1;
                        bytesSent += readyToSend;

                        if (readyToSend < buffer.byteLength) {
                            bytesSent = 0;
                            pumpSilence = true;
                        }

                        return readyToSend;
                    }

                },
            });

        // Close p in 20 minutes.
        const endTime: number = Date.now() + (1000 * 60 * 20); // 20 min.
        WaitForCondition(() => {
            return Date.now() >= endTime;
        }, () => {
            streamStopped = true;
            p.close();
        });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        // auto refresh the auth token.
        const refreshAuthToken = () => {
            if (canceled && !inTurn) {
                return;
            }

            request.post(req, (error: any, response: request.Response, body: any) => {
                r.authorizationToken = body;
            });

            setTimeout(() => {
                refreshAuthToken();
            }, 1000 * 60 * 9); // 9 minutes
        };

        refreshAuthToken();

        let speechEnded: number = 0;
        let lastOffset: number = 0;
        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            try {
                // The last chunk may be partial depending on where the audio was when the stream was closed.
                // So just ignore it.
                if (streamStopped) {
                    return;
                }

                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(e.offset).toBeGreaterThanOrEqual(lastOffset);
                lastOffset = e.offset;

                // If there is silence exactly at the moment of disconnect, an extra speech.phrase with text ="" is returned just before the
                // connection is disconnected.
                if ("" !== e.result.text) {
                    expect(e.result.text).toEqual(Settings.WaveFileText);
                }

            } catch (error) {
                done.fail(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
                canceled = true;
            } catch (error) {
                done.fail(error);
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
                        expect(speechEnded).toEqual(1);
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
    });
}, 1000 * 60 * 25); // 25 minutes.

test("AuthToken refresh works even with fromEndpoint configurations", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: AuthToken refresh works correctly");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // tslint:disable-next-line:no-console
        console.info("Skipping test.");
        done();
        return;
    }

    const req = {
        headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": Settings.SpeechSubscriptionKey,
        },
        url: "https://" + Settings.SpeechRegion + ".api.cognitive.microsoft.com/sts/v1.0/issueToken",
    };

    let authToken: string;

    request.post(req, (error: any, response: request.Response, body: any) => {
        authToken = body;
    });

    WaitForCondition(() => {
        return !!authToken;
    }, () => {
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

        // make a connection to the standard speech endpoint.
        const endpointString: string = "wss://" + Settings.SpeechRegion + ".stt.speech.microsoft.com";

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL(endpointString), Settings.SpeechRegion);
        objsToClose.push(s);

        // now set the authentication token
        s.authorizationToken = authToken;

        let pumpSilence: boolean = false;
        let bytesSent: number = 0;
        let streamStopped: boolean = false;

        // Pump the audio from the wave file specified with 1 second silence between iterations indefinetly.
        const p: sdk.PullAudioInputStream = sdk.AudioInputStream.createPullStream(
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
                        const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                        copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                        const readyToSend: number = (end - start) + 1;
                        bytesSent += readyToSend;

                        if (readyToSend < buffer.byteLength) {
                            bytesSent = 0;
                            pumpSilence = true;
                        }

                        return readyToSend;
                    }

                },
            });

        // Close p in 20 minutes.
        const endTime: number = Date.now() + (1000 * 60 * 20); // 20 min.
        WaitForCondition(() => {
            return Date.now() >= endTime;
        }, () => {
            streamStopped = true;
            p.close();
        });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        // auto refresh the auth token.
        const refreshAuthToken = () => {
            if (canceled && !inTurn) {
                return;
            }

            request.post(req, (error: any, response: request.Response, body: any) => {
                r.authorizationToken = body;
            });

            setTimeout(() => {
                refreshAuthToken();
            }, 1000 * 60 * 9); // 9 minutes
        };

        refreshAuthToken();

        let speechEnded: number = 0;
        let lastOffset: number = 0;
        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            try {
                // The last chunk may be partial depending on where the audio was when the stream was closed.
                // So just ignore it.
                if (streamStopped) {
                    return;
                }

                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(e.offset).toBeGreaterThanOrEqual(lastOffset);
                lastOffset = e.offset;

                // If there is silence exactly at the moment of disconnect, an extra speech.phrase with text ="" is returned just before the
                // connection is disconnected.
                if ("" !== e.result.text) {
                    expect(e.result.text).toEqual(Settings.WaveFileText);
                }

            } catch (error) {
                done.fail(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
                canceled = true;
            } catch (error) {
                done.fail(error);
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
                        expect(speechEnded).toEqual(1);
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
    });
}, 1000 * 60 * 25); // 25 minutes.
