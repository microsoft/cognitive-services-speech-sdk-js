// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as request from "request";
import * as sdk from "../../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../../src/common.browser/Exports";
import { HeaderNames } from "../../src/common.speech/HeaderNames";
import { Events } from "../../src/common/Exports";
import { Settings } from "../Settings";
import { CreateRepeatingPullStream, WaitForCondition } from "../Utilities";

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

afterEach(() => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: any, index: number, array: any[]) => {
        if (typeof value.close === "function") {
            value.close();
        }
    });
});

test("AuthToken refresh works correctly", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: AuthToken refresh works correctly");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // eslint-disable-next-line no-console
        console.info("Skipping test.");
        done();
        return;
    }

    const req = {
        headers: {
            "Content-Type": "application/json",
            [HeaderNames.AuthKey]: Settings.SpeechSubscriptionKey,
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
       
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromAuthorizationToken(authToken, Settings.SpeechRegion);
        objsToClose.push(s);

        let streamStopped: boolean = false;

        const p: sdk.PullAudioInputStream = CreateRepeatingPullStream(Settings.WaveFile);

        // Close p in 20 minutes.
        const endTime: number = Date.now() + (1000 * 60 * 20); // 20 min.
        WaitForCondition((): boolean => Date.now() >= endTime,
        (): void => {
            streamStopped = true;
            p.close();
        });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        // auto refresh the auth token.
        const refreshAuthToken = (): void => {
            if (canceled && !inTurn) {
                return;
            }

            request.post(req, (error: any, response: request.Response, body: any): void => r.authorizationToken = body);

            setTimeout((): void => {
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
                done.fail(error as string);
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

test("AuthToken refresh works correctly for Translation Recognizer", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: AuthToken refresh works correctly for Translation Recognizer");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // eslint-disable-next-line no-console
        console.info("Skipping test.");
        done();
        return;
    }

    const req = {
        headers: {
            "Content-Type": "application/json",
            [HeaderNames.AuthKey]: Settings.SpeechSubscriptionKey,
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
        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromAuthorizationToken(authToken, Settings.SpeechRegion);
        s.speechRecognitionLanguage = "en-US";
        s.addTargetLanguage("de-DE");
        objsToClose.push(s);

        let streamStopped: boolean = false;

        const p: sdk.PullAudioInputStream = CreateRepeatingPullStream(Settings.WaveFile);

        // Close p in 20 minutes.
        const endTime: number = Date.now() + (1000 * 60 * 20); // 20 min.
        WaitForCondition(() => {
            return Date.now() >= endTime;
        }, () => {
            streamStopped = true;
            p.close();
        });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
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

        r.recognized = (o: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionEventArgs) => {
            try {
                // The last chunk may be partial depending on where the audio was when the stream was closed.
                // So just ignore it.
                if (streamStopped) {
                    return;
                }

                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
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

        r.canceled  = (o: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
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
