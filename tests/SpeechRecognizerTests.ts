// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { ServiceRecognizerBase } from "../src/common.speech/Exports";
import { QueryParameterNames } from "../src/common.speech/QueryParameterNames";
import { ConnectionStartEvent, IDetachable } from "../src/common/Exports";
import { Events, EventType, PlatformEvent } from "../src/common/Exports";

import { Settings } from "./Settings";
import { validateTelemetry } from "./TelemetryUtil";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

import * as fs from "fs";
import * as request from "request";

import { setTimeout } from "timers";
import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import WaitForCondition from "./Utilities";

const FIRST_EVENT_ID: number = 1;
const Recognizing: string = "Recognizing";
const Recognized: string = "Recognized";
const Session: string = "Session";
const Canceled: string = "Canceled";

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

export const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const f: File = WaveFileAudioInput.LoadFile(fileName === undefined ? Settings.WaveFile : fileName);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

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
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

test("testSpeechRecognizer1", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testSpeechRecognizer1");
    const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(speechConfig).not.toBeUndefined();

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);
});

test("testGetLanguage1", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testGetLanguage1");
    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.speechRecognitionLanguage).not.toBeNull();
});

test("testGetLanguage2", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testGetLanguage2");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const language: string = "de-DE";
    s.speechRecognitionLanguage = language;

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    expect(r.speechRecognitionLanguage).not.toBeNull();
    expect(language === r.speechRecognitionLanguage);
});

test("testGetOutputFormatDefault", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testGetOutputFormatDefault");
    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.outputFormat === sdk.OutputFormat.Simple);
});

test("testGetParameters", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testGetParameters");
    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
    // expect(r.language ==  r.properties.getProperty(RecognizerParameterNames.SpeechRecognitionLanguage));
    // expect(r.deploymentId == r.properties.getProperty(RecognizerParameterNames.SpeechMspeechConfigImpl// TODO: is this really the correct mapping?
    expect(r.speechRecognitionLanguage).not.toBeUndefined();
    expect(r.endpointId === r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_EndpointId, null)); // todo: is this really the correct mapping?
});

describe.each([true, false])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("testGetOutputFormatDetailed", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testGetOutputFormatDetailed");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.outputFormat = sdk.OutputFormat.Detailed;

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        expect(r.outputFormat === sdk.OutputFormat.Detailed);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
            try {
                expect(result).not.toBeUndefined();
                expect(result.text).toEqual(Settings.WaveFileText);
                expect(result.properties).not.toBeUndefined();
                expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                done();
            } catch (error) {
                done.fail(error);
            }
        }, (error: string) => {
            done.fail(error);
        });
    });

    test("testGetOutputFormatDetailed with authorization token", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testGetOutputFormatDetailed");

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
            const endpoint = "wss://" + Settings.SpeechRegion + ".stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1";

            // note: we use an empty subscription key so that we use the authorization token later.
            const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL(endpoint));
            objsToClose.push(s);

            // now set the authentication token
            s.authorizationToken = authToken;

            s.outputFormat = sdk.OutputFormat.Detailed;

            const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
            objsToClose.push(r);

            expect(r.outputFormat === sdk.OutputFormat.Detailed);

            r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                try {
                    expect(e.errorDetails).toBeUndefined();
                } catch (error) {
                    done.fail(error);
                }
            };

            r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
                try {
                    expect(result).not.toBeUndefined();
                    expect(result.text).toEqual(Settings.WaveFileText);
                    expect(result.properties).not.toBeUndefined();
                    expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done.fail(error);
                }
            }, (error: string) => {
                done.fail(error);
            });
        });
    });

    test("fromEndPoint with Subscription key", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: fromEndPoint with Subscription key");

        const endpoint = "wss://" + Settings.SpeechRegion + ".stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1";

        // note: we use an empty subscription key so that we use the authorization token later.
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL(endpoint), Settings.SpeechSubscriptionKey);
        objsToClose.push(s);

        s.outputFormat = sdk.OutputFormat.Detailed;

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        expect(r.outputFormat === sdk.OutputFormat.Detailed);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
            try {
                expect(result).not.toBeUndefined();
                expect(result.text).toEqual(Settings.WaveFileText);
                expect(result.properties).not.toBeUndefined();
                expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                done();
            } catch (error) {
                done.fail(error);
            }
        }, (error: string) => {
            done.fail(error);
        });
    });

    describe("Counts Telemetry", () => {
        afterAll(() => {
            ServiceRecognizerBase.telemetryData = undefined;
        });

        test("RecognizeOnce", (done: jest.DoneCallback) => {
            // tslint:disable-next-line:no-console
            console.info("Name: RecognizeOnce");

            const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
            objsToClose.push(r);

            let telemetryEvents: number = 0;
            let sessionId: string;
            let hypoCounter: number = 0;

            r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
                sessionId = e.sessionId;
            };

            r.recognizing = (s: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
                hypoCounter++;
            };

            r.canceled = (s: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                try {
                    expect(e.errorDetails).toBeUndefined();
                } catch (error) {
                    done.fail(error);
                }
            };

            ServiceRecognizerBase.telemetryData = (json: string): void => {
                // Only record telemetry events from this session.
                if (json !== undefined &&
                    sessionId !== undefined &&
                    json.indexOf(sessionId) > 0) {
                    try {
                        validateTelemetry(json, 1, hypoCounter);
                    } catch (error) {
                        done.fail(error);
                    }
                    telemetryEvents++;
                }
            };

            r.recognizeOnceAsync(
                (p2: sdk.SpeechRecognitionResult) => {
                    try {
                        const res: sdk.SpeechRecognitionResult = p2;
                        expect(res).not.toBeUndefined();
                        expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                        expect(res.text).toEqual("What's the weather like?");
                        expect(telemetryEvents).toEqual(1);
                        expect(res.properties).not.toBeUndefined();
                        expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                        done();
                    } catch (error) {
                        done.fail(error);
                    }

                },
                (error: string) => {
                    done.fail(error);
                });
        });

        test("testStopContinuousRecognitionAsyncWithTelemetry", (done: jest.DoneCallback) => {
            // tslint:disable-next-line:no-console
            console.info("Name: testStopContinuousRecognitionAsyncWithTelemetry");

            const s: sdk.SpeechConfig = BuildSpeechConfig();
            objsToClose.push(s);

            const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
            const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps);

            const fileBuff: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
            ps.write(fileBuff);
            ps.write(new ArrayBuffer(1024 * 32));
            ps.write(fileBuff);
            ps.close();

            // Now, the same test, but with telemetry enabled.
            const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, audio);
            objsToClose.push(r);

            let recoCount: number = 0;
            let canceled: boolean = false;
            let telemetryEvents: number = 0;
            let hypoCounter: number = 0;
            let sessionId: string;

            // enable telemetry data
            sdk.Recognizer.enableTelemetry(true);

            r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
                sessionId = e.sessionId;
            };

            ServiceRecognizerBase.telemetryData = (json: string): void => {
                // Only record telemetry events from this session.
                if (json !== undefined &&
                    sessionId !== undefined &&
                    json.indexOf(sessionId) > 0) {
                    telemetryEvents++;
                    try {
                        validateTelemetry(json, 3, hypoCounter);
                    } catch (error) {
                        done.fail(error);
                    }
                }
            };

            r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
                try {
                    recoCount++;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                    expect(e.result.properties).not.toBeUndefined();
                    expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                } catch (error) {
                    done.fail(error);
                }
            };

            r.recognizing = (s: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
                hypoCounter++;
            };

            r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                try {
                    canceled = true;
                    expect(e.errorDetails).toBeUndefined();
                    expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                } catch (error) {
                    done.fail(error);
                }
            };

            r.startContinuousRecognitionAsync(
                () => WaitForCondition(() => ((recoCount === 2) && canceled), () => {
                    try {
                        expect(telemetryEvents).toEqual(1);
                        done();
                    } catch (err) {
                        done.fail(err);
                    }
                }),
                (err: string) => {
                    done.fail(err);
                });
        });

    });

    test("Event Tests (RecognizeOnce)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Event Tests (RecognizeOnce)");
        const SpeechStartDetectedEvent = "SpeechStartDetectedEvent";
        const SpeechEndDetectedEvent = "SpeechEndDetectedEvent";
        const SessionStartedEvent = "SessionStartedEvent";
        const SessionStoppedEvent = "SessionStoppedEvent";
        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const eventsMap: { [id: string]: number; } = {};
        let eventIdentifier: number = 1;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            eventsMap[Recognized] = eventIdentifier++;
        };

        r.recognizing = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Recognizing + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[Recognizing] = now;
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            eventsMap[Canceled] = eventIdentifier++;
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        // todo eventType should be renamed and be a function getEventType()
        r.speechStartDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            // tslint:disable-next-line:no-string-literal
            eventsMap[SpeechStartDetectedEvent] = now;
        };
        r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SpeechEndDetectedEvent] = now;
        };

        r.sessionStarted = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Session + SessionStartedEvent] = now;
            eventsMap[Session + SessionStartedEvent + "-" + Date.now().toPrecision(4)] = now;
        };
        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Session + SessionStoppedEvent] = now;
            eventsMap[Session + SessionStoppedEvent + "-" + Date.now().toPrecision(4)] = now;
        };

        // note: TODO session stopped event not necessarily raised before async operation returns!
        //       this makes this test flaky

        r.recognizeOnceAsync(
            (res: sdk.SpeechRecognitionResult) => {
                try {
                    expect(res).not.toBeUndefined();
                    expect(res.text).toEqual("What's the weather like?");
                    expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);

                    // session events are first and last event
                    const LAST_RECORDED_EVENT_ID: number = --eventIdentifier;

                    expect(LAST_RECORDED_EVENT_ID).toBeGreaterThan(FIRST_EVENT_ID);

                    expect(Session + SessionStartedEvent in eventsMap).toEqual(true);
                    expect(eventsMap[Session + SessionStartedEvent]).toEqual(FIRST_EVENT_ID);

                    if (Session + SessionStoppedEvent in eventsMap) {
                        expect(LAST_RECORDED_EVENT_ID).toEqual(eventsMap[Session + SessionStoppedEvent]);
                    }
                    // end events come after start events.
                    if (Session + SessionStoppedEvent in eventsMap) {
                        expect(eventsMap[Session + SessionStartedEvent])
                            .toBeLessThan(eventsMap[Session + SessionStoppedEvent]);
                    }

                    expect(eventsMap[SpeechStartDetectedEvent])
                        .toBeLessThan(eventsMap[SpeechEndDetectedEvent]);
                    expect((FIRST_EVENT_ID + 1)).toEqual(eventsMap[SpeechStartDetectedEvent]);

                    // make sure, first end of speech, then final result
                    expect((LAST_RECORDED_EVENT_ID - 1)).toEqual(eventsMap[SpeechEndDetectedEvent]);

                    expect((LAST_RECORDED_EVENT_ID)).toEqual(eventsMap[Recognized]);

                    // recognition events come after session start but before session end events
                    expect(eventsMap[Session + SessionStartedEvent])
                        .toBeLessThan(eventsMap[SpeechStartDetectedEvent]);

                    if (Session + SessionStoppedEvent in eventsMap) {
                        expect(eventsMap[SpeechEndDetectedEvent])
                            .toBeLessThan(eventsMap[Session + SessionStoppedEvent]);
                    }

                    // there is no partial result reported after the final result
                    // (and check that we have intermediate and final results recorded)
                    if (Recognizing in eventsMap) {
                        expect(eventsMap[Recognizing])
                            .toBeGreaterThan(eventsMap[SpeechStartDetectedEvent]);
                    }

                    // speech should stop before getting the final result.
                    expect(eventsMap[Recognized]).toBeGreaterThan(eventsMap[SpeechEndDetectedEvent]);

                    expect(eventsMap[Recognizing]).toBeLessThan(eventsMap[Recognized]);

                    // make sure events we don't expect, don't get raised
                    expect(Canceled in eventsMap).toBeFalsy();

                    done();
                } catch (error) {
                    done.fail(error);
                }
            }, (error: string) => {
                done.fail(error);
            });

    });

    test("Event Tests (Continuous)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Event Tests (Continuous)");
        const SpeechStartDetectedEvent = "SpeechStartDetectedEvent";
        const SpeechEndDetectedEvent = "SpeechEndDetectedEvent";
        const SessionStartedEvent = "SessionStartedEvent";
        const SessionStoppedEvent = "SessionStoppedEvent";
        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        let sessionStopped: boolean = false;

        const eventsMap: { [id: string]: number; } = {};
        let eventIdentifier: number = 1;

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            eventsMap[Recognized] = eventIdentifier++;
        };

        r.recognizing = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Recognizing + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[Recognizing] = now;
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.NoError]);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
                eventsMap[Canceled] = eventIdentifier++;
            } catch (error) {
                done.fail(error);
            }
        };

        // todo eventType should be renamed and be a function getEventType()
        r.speechStartDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            // tslint:disable-next-line:no-string-literal
            eventsMap[SpeechStartDetectedEvent] = now;
        };
        r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SpeechEndDetectedEvent] = now;
        };

        r.sessionStarted = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Session + SessionStartedEvent] = now;
            eventsMap[Session + SessionStartedEvent + "-" + Date.now().toPrecision(4)] = now;
        };

        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Session + SessionStoppedEvent] = now;
            eventsMap[Session + SessionStoppedEvent + "-" + Date.now().toPrecision(4)] = now;
            sessionStopped = true;
        };

        r.startContinuousRecognitionAsync();

        WaitForCondition(() => sessionStopped, () => {
            try {
                // session events are first and last event
                const LAST_RECORDED_EVENT_ID: number = --eventIdentifier;
                expect(LAST_RECORDED_EVENT_ID).toBeGreaterThan(FIRST_EVENT_ID);

                expect(Session + SessionStartedEvent in eventsMap).toEqual(true);

                expect(eventsMap[Session + SessionStartedEvent]).toEqual(FIRST_EVENT_ID);

                expect(Session + SessionStoppedEvent in eventsMap).toEqual(true);
                expect(LAST_RECORDED_EVENT_ID).toEqual(eventsMap[Session + SessionStoppedEvent]);

                // end events come after start events.
                if (Session + SessionStoppedEvent in eventsMap) {
                    expect(eventsMap[Session + SessionStartedEvent])
                        .toBeLessThan(eventsMap[Session + SessionStoppedEvent]);
                }

                expect(eventsMap[SpeechStartDetectedEvent])
                    .toBeLessThan(eventsMap[SpeechEndDetectedEvent]);
                expect((FIRST_EVENT_ID + 1)).toEqual(eventsMap[SpeechStartDetectedEvent]);

                // make sure, first end of speech, then final result
                expect((LAST_RECORDED_EVENT_ID - 1)).toEqual(eventsMap[Canceled]);
                expect((LAST_RECORDED_EVENT_ID - 2)).toEqual(eventsMap[SpeechEndDetectedEvent]);
                expect((LAST_RECORDED_EVENT_ID - 3)).toEqual(eventsMap[Recognized]);

                // recognition events come after session start but before session end events
                expect(eventsMap[Session + SessionStartedEvent])
                    .toBeLessThan(eventsMap[SpeechStartDetectedEvent]);

                if (Session + SessionStoppedEvent in eventsMap) {
                    expect(eventsMap[SpeechEndDetectedEvent])
                        .toBeLessThan(eventsMap[Session + SessionStoppedEvent]);
                }

                // there is no partial result reported after the final result
                // (and check that we have intermediate and final results recorded)
                if (Recognizing in eventsMap) {
                    expect(eventsMap[Recognizing])
                        .toBeGreaterThan(eventsMap[SpeechStartDetectedEvent]);
                }

                // speech should not stop before getting the final result.
                expect(eventsMap[Recognized]).toBeLessThan(eventsMap[SpeechEndDetectedEvent]);

                expect(eventsMap[Recognizing]).toBeLessThan(eventsMap[Recognized]);

                // make sure we got a cancel event.
                expect(Canceled in eventsMap).toEqual(true);

                done();
            } catch (error) {
                done.fail(error);
            }
        });
    }, 20000);

    describe("Disables Telemetry", () => {

        // Re-enable telemetry
        afterEach(() => sdk.Recognizer.enableTelemetry(true));

        test("testStopContinuousRecognitionAsyncWithoutTelemetry", (done: jest.DoneCallback) => {
            // tslint:disable-next-line:no-console
            console.info("Name: testStopContinuousRecognitionAsyncWithoutTelemetry");
            // start with telemetry disabled
            const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
            objsToClose.push(r);

            let eventDone: boolean = false;
            let canceled: boolean = false;
            let telemetryEvents: number = 0;

            // disable telemetry data
            sdk.Recognizer.enableTelemetry(false);

            ServiceRecognizerBase.telemetryData = (json: string): void => {
                telemetryEvents++;
            };

            r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
                try {
                    eventDone = true;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                } catch (error) {
                    done.fail(error);
                }
            };

            r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                try {
                    canceled = true;
                    expect(e.errorDetails).toBeUndefined();
                    expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                } catch (error) {
                    done.fail(error);
                }
            };

            r.startContinuousRecognitionAsync(
                () => WaitForCondition(() => (eventDone && canceled), () => {
                    r.stopContinuousRecognitionAsync(
                        () => {
                            // since we disabled, there should be no telemetry
                            // event run through our handler
                            expect(telemetryEvents).toEqual(0);
                            done();
                        },
                        (err: string) => {
                            done.fail(err);
                        });
                }),
                (err: string) => {
                    done.fail(err);
                });
        });
    });

    test("Close with no recognition", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Close with no recognition");
        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);
    });

    test("Config is copied on construction", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Config is copied on construction");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.speechRecognitionLanguage = "en-US";

        const ranVal: string = Math.random().toString();

        s.setProperty("RandomProperty", ranVal);
        s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], "Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        expect(r.speechRecognitionLanguage).toEqual("en-US");
        expect(r.properties.getProperty("RandomProperty")).toEqual(ranVal);
        expect(r.properties.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice])).toEqual("Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

        // Change them.
        s.speechRecognitionLanguage = "de-DE";
        s.setProperty("RandomProperty", Math.random.toString());
        s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)");

        // Validate no change.
        expect(r.speechRecognitionLanguage).toEqual("en-US");
        expect(r.properties.getProperty("RandomProperty")).toEqual(ranVal);
        expect(r.properties.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice])).toEqual("Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

    });

    test("PushStream4KNoDelay", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: PushStream4KNoDelay");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const f: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        let i: number;

        const sendSize: number = 4096;

        for (i = sendSize - 1; i < f.byteLength; i += sendSize) {
            p.write(f.slice(i - (sendSize - 1), i + 1));
        }

        p.write(f.slice(i - (sendSize - 1), f.byteLength));
        p.close();

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                const res: sdk.SpeechRecognitionResult = p2;
                try {
                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(res.text).toEqual("What's the weather like?");
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done.fail(error);
                }

            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("PushStream4KPostRecognizePush", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: PushStream4KPostRecognizePush");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const f: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        let i: number;

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                try {
                    const res: sdk.SpeechRecognitionResult = p2;

                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(res.text).toEqual("What's the weather like?");
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });

        const sendSize: number = 4096;

        for (i = sendSize - 1; i < f.byteLength; i += sendSize) {
            p.write(f.slice(i - (sendSize - 1), i));
        }

        p.write(f.slice(i - (sendSize - 1), f.byteLength - 1));
        p.close();

    });

    test("PullStreamFullFill", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: PullStreamFullFill");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

        let bytesSent: number = 0;
        let p: sdk.PullAudioInputStream;

        p = sdk.AudioInputStream.createPullStream(
            {
                close: () => { return; },
                read: (buffer: ArrayBuffer): number => {
                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start) + 1;

                    if (bytesSent < buffer.byteLength) {
                        setTimeout(() => p.close(), 1000);
                    }

                    return (end - start) + 1;
                },
            });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                const res: sdk.SpeechRecognitionResult = p2;
                try {
                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(res.text).toEqual("What's the weather like?");
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("PullStreamHalfFill", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: PullStreamHalfFill");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

        let bytesSent: number = 0;
        let p: sdk.PullAudioInputStream;

        p = sdk.AudioInputStream.createPullStream(
            {
                close: () => { return; },
                read: (buffer: ArrayBuffer): number => {
                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const fillSize: number = Math.round(buffer.byteLength / 2);
                    const end: number = fillSize > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + fillSize - 1);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start) + 1;

                    if (bytesSent < buffer.byteLength) {
                        setTimeout(() => p.close(), 1000);
                    }

                    return (end - start) + 1;
                },
            });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                try {
                    const res: sdk.SpeechRecognitionResult = p2;

                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(res.text).toEqual("What's the weather like?");
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("InitialSilenceTimeout (pull)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
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

        testInitialSilienceTimeout(config, done, (): void => {
            const elapsed: number = Date.now() - startTime;

            // We should have sent 5 seconds of audio unthrottled and then 2x the time reco took until we got a response.
            const expectedBytesSent: number = (5 * 16000 * 2) + (2 * elapsed * 32000 / 1000);
            expect(bytesSent).toBeLessThanOrEqual(expectedBytesSent);

        });
    }, 15000);

    test("InitialSilenceTimeout (push)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: InitialSilenceTimeout (push)");
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        p.write(bigFileBuffer.buffer);
        p.close();

        testInitialSilienceTimeout(config, done);
    }, 15000);

    test("InitialSilenceTimeout (File)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: InitialSilenceTimeout (File)");

        const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
        const bigFile: File = ByteBufferAudioFile.Load(bigFileBuffer.buffer);

        const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(bigFile);

        testInitialSilienceTimeout(config, done);
    }, 15000);

    const testInitialSilienceTimeout = (config: sdk.AudioConfig, done: jest.DoneCallback, addedChecks?: () => void): void => {
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        let numReports: number = 0;

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            done.fail(e.errorDetails);
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
                done.fail(error);
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
                    done.fail(error);
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
                done.fail(error);
            }
        });
    };

    test.skip("InitialBabbleTimeout", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: InitialBabbleTimeout");

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        expect(s).not.toBeUndefined();

        s.speechRecognitionLanguage = "es-MX";

        const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
        const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
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
                    done.fail(error);
                }
            },
            (error: string) => {
                r.close();
                s.close();
                done.fail(error);
            });
    });

    test.skip("emptyFile", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: emptyFile");
        // Server Responses:
        // turn.start {"context": { "serviceTag": "<tag>"  }}
        // speech.endDetected { }
        // speech.phrase { "RecognitionStatus": "Error", "Offset": 0, "Duration": 0 }

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const blob: Blob[] = [];
        const f: File = new File(blob, "file.wav");

        const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);
        let oneCalled: boolean = false;

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);

                if (true === oneCalled) {
                    done();
                } else {
                    oneCalled = true;
                }
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                try {
                    expect(p2.reason).toEqual(sdk.ResultReason.Canceled);
                    const cancelDetails: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(p2);
                    expect(sdk.CancellationReason[cancelDetails.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                    expect(p2.properties).not.toBeUndefined();
                    expect(p2.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    if (true === oneCalled) {
                        done();
                    } else {
                        oneCalled = true;
                    }
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("PullStreamSendHalfTheFile", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: PullStreamSendHalfTheFile");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

        let bytesSent: number = 0;
        let p: sdk.PullAudioInputStream;

        p = sdk.AudioInputStream.createPullStream(
            {
                close: () => { return; },
                read: (buffer: ArrayBuffer): number => {
                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start) + 1;

                    if (bytesSent > (fileBuffer.byteLength / 2)) {
                        p.close();
                    }

                    return (end - start) + 1;
                },
            });
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                const res: sdk.SpeechRecognitionResult = p2;
                try {
                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(res.text).toEqual("What's the weather?");
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("burst of silence", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
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
                done.fail(error);
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
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("RecognizeOnceAsync is async", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: ecognizeOnceAsync is async");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.speechRecognitionLanguage = "en-US";

        const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
        const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        let postCall: boolean = false;
        let resultSeen: boolean = false;
        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            WaitForCondition(() => postCall, () => {
                resultSeen = true;
                try {
                    expect(e.result.errorDetails).toBeUndefined();
                    expect(e.result.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                    expect(e.result.text).toEqual(Settings.WaveFileText);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync();

        expect(resultSeen).toEqual(false);
        postCall = true;
    });

    test("InitialSilenceTimeout Continous", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: InitialSilenceTimeout Continous");
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
            done.fail(e.errorDetails);
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
                done.fail(error);
            });

        WaitForCondition(() => passed, () => {
            r.stopContinuousRecognitionAsync(() => {
                done();
            }, (error: string) => done.fail(error));
        });

    }, 30000);

    test("Audio Config is optional", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Audio Config is optional");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
        objsToClose.push(r);
        expect(r instanceof sdk.Recognizer).toEqual(true);
    });

    test("Default mic is used when audio config is not specified.", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Default mic is used when audio config is not specified.");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        let r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);

        expect(r instanceof sdk.Recognizer).toEqual(true);
        // Node.js doesn't have a microphone natively. So we'll take the specific message that indicates that microphone init failed as evidence it was attempted.
        r.recognizeOnceAsync(() => fail("RecognizeOnceAsync returned success when it should have failed"),
            (error: string): void => {
                expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
            });

        r = new sdk.SpeechRecognizer(s);

        r.startContinuousRecognitionAsync(() => fail("startContinuousRecognitionAsync returned success when it should have failed"),
            (error: string): void => {
                expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
            });
    });

    test("Using disposed recognizer invokes error callbacks.", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Using disposed recognizer invokes error callbacks.");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
        expect(r instanceof sdk.Recognizer).toEqual(true);

        r.close();

        r.recognizeOnceAsync(() => fail("RecognizeOnceAsync on closed recognizer called success callback"),
            (error: string): void => {
                expect(error).toEqual("Error: the object is already disposed");
            });

        r.startContinuousRecognitionAsync(() => fail("startContinuousRecognitionAsync on closed recognizer called success callback"),
            (error: string): void => {
                expect(error).toEqual("Error: the object is already disposed");
            });

        r.stopContinuousRecognitionAsync(() => fail("stopContinuousRecognitionAsync on closed recognizer called success callback"),
            (error: string): void => {
                expect(error).toEqual("Error: the object is already disposed");
            });
    });

    test.skip("Endpoint URL Test", (done: jest.DoneCallback) => {
        let uri: string;

        Events.instance.attachListener({
            onEvent: (event: PlatformEvent) => {
                if (event instanceof ConnectionStartEvent) {
                    const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                    uri = connectionEvent.uri;
                }
            },
        });

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.endpointId = Settings.SpeechTestEndpointId;

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                try {
                    const res: sdk.SpeechRecognitionResult = p2;
                    expect(res).not.toBeUndefined();
                    expect(res.errorDetails).toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect("What's the weather like?").toEqual(res.text);
                    expect(uri).not.toBeUndefined();
                    expect(uri.search(QueryParameterNames.DeploymentIdParamName + "=" + Settings.SpeechTestEndpointId)).not.toEqual(-1);
                    expect(uri.search(QueryParameterNames.LanguageParamName)).toEqual(-1);

                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });

    describe("Connection URL Tests", () => {
        let uri: string;
        let detachObject: IDetachable;

        beforeEach(() => {
            detachObject = Events.instance.attachListener({
                onEvent: (event: PlatformEvent) => {
                    if (event instanceof ConnectionStartEvent) {
                        const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                        uri = connectionEvent.uri;
                    }
                },
            });
        });

        afterEach(() => {
            if (undefined !== detachObject) {
                detachObject.detach();
                detachObject = undefined;
            }

            uri = undefined;
        });

        test("Endpoint URL With Parameter Test", (done: jest.DoneCallback) => {
            // tslint:disable-next-line:no-console
            console.info("Name: Endpoint URL With Parameter Test");

            const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL("wss://fake.host.name?somequeryParam=Value"), "fakekey");
            objsToClose.push(s);

            const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
            objsToClose.push(r);

            r.recognizeOnceAsync(
                (p2: sdk.SpeechRecognitionResult) => {
                    try {
                        expect(uri).not.toBeUndefined();
                        // Make sure there's only a single ? in the URL.
                        expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));

                        expect(p2.errorDetails).not.toBeUndefined();
                        expect(sdk.ResultReason[p2.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);

                        const cancelDetails: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(p2);
                        expect(sdk.CancellationReason[cancelDetails.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                        expect(sdk.CancellationErrorCode[cancelDetails.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                        done();
                    } catch (error) {
                        done.fail(error);
                    }
                });
        });
    });

    test("Connection Errors Propogate Async", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Connection Errors Propogate Async");
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("badKey", Settings.SpeechRegion);
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                done();
            } catch (error) {
                done.fail(error);
            }
        };

        r.startContinuousRecognitionAsync();

    });

    test("Connection Errors Propogate Sync", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Connection Errors Propogate Sync");
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("badKey", Settings.SpeechRegion);
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        let doneCount: number = 0;
        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");
                doneCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
            try {
                const e: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");
                doneCount++;
            } catch (error) {
                done.fail(error);
            }
        });

        WaitForCondition(() => (doneCount === 2), done);

    });

    test("RecognizeOnce Bad Language", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: RecognizeOnce Bad Language");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "BadLanguage";

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);
        let doneCount: number = 0;

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");
                doneCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
            try {
                const e: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");

                doneCount++;
            } catch (error) {
                done.fail(error);
            }
            WaitForCondition(() => (doneCount === 2), done);
        });
    });

    test("Silence After Speech", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
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
                done.fail(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
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
                        expect(speechEnded).toEqual(noMatchCount);
                        expect(noMatchCount).toEqual(2);
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
    }, 30000);

    test("Silence Then Speech", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
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
                done.fail(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
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
                        expect(speechEnded).toEqual(noMatchCount + 1);
                        expect(noMatchCount).toEqual(2);
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
    }, 35000);
});

test("Push Stream Async", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Push Stream Async");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    fs.createReadStream(Settings.WaveFile).on("data", (buffer: Buffer) => {
        p.write(buffer.buffer);
    }).on("end", () => {
        p.close();
    });

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
        done.fail(e.errorDetails);
    };

    r.recognizeOnceAsync(
        (p2: sdk.SpeechRecognitionResult) => {
            const res: sdk.SpeechRecognitionResult = p2;

            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            done();
        },
        (error: string) => {
            done.fail(error);
        });
}, 10000);

test("Connect / Disconnect", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Connect / Disconnect");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
    objsToClose.push(r);

    let connected: boolean = false;
    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (args: sdk.ConnectionEventArgs) => {
        connected = true;
    };

    connection.disconnected = (args: sdk.ConnectionEventArgs) => {
        done();
    };

    connection.openConnection();

    WaitForCondition(() => {
        return connected;
    }, () => {
        connection.closeConnection();
    });
});

test("Multiple RecognizeOnce calls share a connection", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Multiple RecognizeOnce calls share a connection");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let connected: number = 0;
    let firstReco: boolean = false;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (e: sdk.ConnectionEventArgs): void => {
        connected++;
    };

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.SpeechRecognitionResult) => {
            try {
                const res: sdk.SpeechRecognitionResult = p2;

                expect(res).not.toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(res.text).toEqual("What's the weather like?");
                expect(disconnected).toEqual(false);
                firstReco = true;
                sendSilence = false;
            } catch (error) {
                done.fail(error);
            }
        },
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return firstReco;
    }, () => {
        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                try {
                    const res: sdk.SpeechRecognitionResult = p2;

                    expect(res).not.toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(res.text).toEqual("What's the weather like?");
                    expect(disconnected).toEqual(false);
                    expect(connected).toEqual(1);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
    });
}, 15000);

test("Multiple ContReco calls share a connection", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Multiple ContReco calls share a connection");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;
    let sessionId: string;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        if (undefined === sessionId) {
            sessionId = e.sessionId;
        } else {
            try {
                expect(e.sessionId).toEqual(sessionId);
            } catch (error) {
                done.fail(error);
            }
        }
    };

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            // tslint:disable-next-line:no-console
            console.warn(e);
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toContain("the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {

            sendSilence = false;

            r.startContinuousRecognitionAsync(
                undefined,
                (error: string) => {
                    done.fail(error);
                });
        });
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {
            done();
        });
    });
}, 20000);

test("StopContinous Reco does", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: StopContinous Reco does");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;
    let recognizing: boolean = true;
    let failed: boolean = false;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {

                try {
                    expect(recognizing).toEqual(true);
                } catch (error) {
                    failed = true;
                    done.fail(error);
                }

                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(recognizing).toEqual(true);
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {
            recognizing = false;
            sendSilence = false;

            setTimeout(() => {
                if (!failed) {
                    done();
                }
            }, 5000);
        });
    });

}, 10000);

test("Disconnect during reco cancels.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Disconnect during reco cancels.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {

                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
        try {
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
            expect(e.errorDetails).toContain("Disconnect");
            done();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        connection.closeConnection();
    });

}, 10000);

test("Open during reco has no effect.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Open during reco has no effect.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {

                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let connectionCount: number = 0;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (e: sdk.ConnectionEventArgs): void => {
        connectionCount++;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            expect(connectionCount).toEqual(1);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            done();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        connection.openConnection();
        sendSilence = false;
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        p.close();
    });

}, 10000);

test("Connecting before reco works for cont", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Connecting before reco works for cont");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let connected: number = 0;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (e: sdk.ConnectionEventArgs): void => {
        connected++;
    };

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    connection.openConnection();

    WaitForCondition(() => {
        return connected === 1;
    }, () => {
        r.startContinuousRecognitionAsync(
            undefined,
            (error: string) => {
                done.fail(error);
            });
    });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {
            try {
                expect(connected).toEqual(1);
                done();
            } catch (error) {
                done.fail(error);
            }
        });
    });

}, 10000);

test("Switch RecoModes during a connection (cont->single)", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Switch RecoModes during a connection (cont->single)");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toContain("the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {

            sendSilence = false;

            r.recognizeOnceAsync(
                undefined,
                (error: string) => {
                    done.fail(error);
                });
        });
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        done();
    });
}, 20000);

test("Switch RecoModes during a connection (single->cont)", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Switch RecoModes during a connection (single->cont)");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toContain("the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {

        sendSilence = false;

        r.startContinuousRecognitionAsync(
            undefined,
            (error: string) => {
                done.fail(error);
            });
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        sendSilence = false;
    });

    WaitForCondition(() => {
        return recoCount === 3;
    }, () => {
        done();
    });
}, 20000);

test("Ambiguous Speech default as expected", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Ambiguous Speech default as expected");

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.SpeechRecognitionResult) => {
            try {
                const res: sdk.SpeechRecognitionResult = p2;
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                expect(res).not.toBeUndefined();
                expect(res.text).toEqual("Recognize speech.");
                done();
            } catch (error) {
                done.fail(error);
            }
        },
        (error: string) => {
            done.fail(error);
        });
});

// This test validates our ability to add features to the SDK in parallel / ahead of implementation by the Speech Service with no ill effects.
test("Service accepts random speech.context sections w/o error", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Service accepts random speech.context sections w/o error.");

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    const serviceBase: ServiceRecognizerBase = r.internalData as ServiceRecognizerBase;
    serviceBase.speechContext.setSection("BogusSection", { Value: "Some Text." });

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.SpeechRecognitionResult) => {
            try {
                const res: sdk.SpeechRecognitionResult = p2;
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                expect(res).not.toBeUndefined();
                expect(res.text).toEqual("Recognize speech.");
                done();
            } catch (error) {
                done.fail(error);
            }
        },
        (error: string) => {
            done.fail(error);
        });
});

test("Phraselist assists speech Reco.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Phraselist assists speech Reco.");

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    const phraseList: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    phraseList.addPhrase("Wreck a nice beach");

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.SpeechRecognitionResult) => {
            try {
                const res: sdk.SpeechRecognitionResult = p2;
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                expect(res).not.toBeUndefined();
                expect(res.text).toEqual("Wreck a nice beach.");
                done();
            } catch (error) {
                done.fail(error);
            }
        },
        (error: string) => {
            done.fail(error);
        });
});

test("Phraselist extra phraselists have no effect.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Phraselist extra phraselists have no effect.");

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    const phraseList: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    phraseList.addPhrase("Wreck a nice beach");
    phraseList.addPhrase("Escaped robot fights for his life, film at 11.");

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.SpeechRecognitionResult) => {
            try {
                const res: sdk.SpeechRecognitionResult = p2;
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                expect(res).not.toBeUndefined();
                expect(res.text).toEqual("Wreck a nice beach.");
                done();
            } catch (error) {
                done.fail(error);
            }
        },
        (error: string) => {
            done.fail(error);
        });
});

test("Phraselist Clear works.", (done: jest.DoneCallback) => {

    // tslint:disable-next-line:no-console
    console.info("Name: Phraselist Clear works.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.AmbiguousWaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let recoCount: number = 0;
    let phraseAdded: boolean = true;
    const dynamicPhrase: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    dynamicPhrase.addPhrase("Wreck a nice beach");

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            if (phraseAdded) {
                expect(res.text).toContain("Wreck a nice beach.");
            } else {
                expect(res.text).toEqual("Recognize speech.");
            }
            recoCount++;
        } catch (error) {
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        dynamicPhrase.clear();
        phraseAdded = false;
        sendSilence = false;

        r.startContinuousRecognitionAsync(
            undefined,
            (error: string) => {
                done.fail(error);
            });
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        done();
    });
}, 20000);
