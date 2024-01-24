// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/* eslint-disable no-console */
import bent, { BentResponse } from "bent";
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

const tokenUrl = `https://${Settings.SpeechRegion}.api.cognitive.microsoft.com/`;
const tokenPath = "sts/v1.0/issueToken";
const headers = {
    "Content-Type": "application/json",
    [HeaderNames.AuthKey]: Settings.SpeechSubscriptionKey,
};
const sendTokenRequest = bent(tokenUrl, "POST", headers, 200);
test("AuthToken refresh works correctly", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: AuthToken refresh works correctly");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // eslint-disable-next-line no-console
        console.info("Skipping test.");
        done();
        return;
    }

    console.info("Starting fetch of token");

    let authToken: string;
    sendTokenRequest(tokenPath)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
        .then((resp: BentResponse): void => {
            resp.text().then((token: string): void => {
                authToken = token;
            }).catch((error: any): void => {
                done.fail(error as string);
            });
        }).catch((error: any): void => {
            done.fail(error as string);
        });

    WaitForCondition((): boolean => !!authToken, (): void => {
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

            sendTokenRequest(tokenPath)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
                .then((resp: BentResponse): void => {
                    resp.text().then((token: string): void => {
                        r.authorizationToken = token;
                    }).catch((error: any): void => {
                        done.fail(error as string);
                    });
                }).catch((error: any): void => {
                    done.fail(error as string);
                });
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
                done(error as string);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
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
                        expect(speechEnded).toEqual(1);
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
    };

    let authToken: string;
    sendTokenRequest(tokenPath)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
        .then((resp: BentResponse): void => {
            resp.text().then((token: string): void => {
                authToken = token;
            }).catch((error: any): void => {
                done.fail(error as string);
            });
        }).catch((error: any): void => {
            done.fail(error as string);
        });

    WaitForCondition((): boolean => !!authToken, (): void => {
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
        const refreshAuthToken = (): void => {
            if (canceled && !inTurn) {
                return;
            }

            sendTokenRequest(tokenPath)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
                .then((resp: BentResponse): void => {
                    resp.text().then((token: string): void => {
                        r.authorizationToken = token;
                    }).catch((error: any): void => {
                        done.fail(error as string);
                    });
                }).catch((error: any): void => {
                    done.fail(error as string);
                });

            setTimeout((): void => {
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
                done(error);
            }
        };

        r.canceled  = (o: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
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
                        expect(speechEnded).toEqual(1);
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
    });
}, 1000 * 60 * 25); // 25 minutes.
