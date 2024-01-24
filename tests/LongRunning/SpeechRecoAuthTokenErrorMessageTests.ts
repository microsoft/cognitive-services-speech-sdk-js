// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
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

test("Non-refreshed auth token has sensible error message", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Non-refreshed auth token has sensible error message");

    if (!Settings.ExecuteLongRunningTestsBool) {
        // eslint-disable-next-line no-console
        console.info("Skipping test.");
        done();
        return;
    }

    const tokenUrl = `https://${Settings.SpeechRegion}.api.cognitive.microsoft.com/`;
    const tokenPath = "sts/v1.0/issueToken";
    const headers = {
        "Content-Type": "application/json",
        [HeaderNames.AuthKey]: Settings.SpeechSubscriptionKey,
    };
    const sendTokenRequest = bent(tokenUrl, "POST", headers, 200);
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

        // Pump the audio from the wave file specified with 1 second silence between iterations indefinetly.
        const p: sdk.PullAudioInputStream = CreateRepeatingPullStream(Settings.WaveFile);

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        let lastOffset: number = 0;
        let canceled: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            try {
                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(e.offset).toBeGreaterThanOrEqual(lastOffset);
                lastOffset = e.offset;

                r.authorizationToken = "BadToken";

                // If there is silence exactly at the moment of disconnect, an extra speech.phrase with text ="" is returned just before the
                // connection is disconnected.
                if ("" !== e.result.text) {
                    expect(e.result.text).toEqual(Settings.WaveFileText);
                }

            } catch (error) {
                done(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails.indexOf("Unable to contact server.")).toBeGreaterThanOrEqual(0);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                canceled = true;
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (canceled), () => {
                done();
            });
        }, (error: string) => {
            done(error);
        });
    });
}, 1000 * 60 * 20); // 20 minutes.
