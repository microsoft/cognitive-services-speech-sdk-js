// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
    WebsocketMessageAdapter,
} from "../src/common.browser/Exports";
import { ServiceRecognizerBase } from "../src/common.speech/Exports";
import {
    Events,
    EventType
} from "../src/common/Exports";

import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import { Settings } from "./Settings";
import { validateTelemetry } from "./TelemetryUtil";
import {
    closeAsyncObjects,
    RepeatingPullStream,
    WaitForCondition
} from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

import { AudioStreamFormatImpl } from "../src/sdk/Audio/AudioStreamFormat";


let objsToClose: any[];

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
});

beforeEach(() => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // eslint-disable-next-line no-console
    console.info("Sart Time: " + new Date(Date.now()).toLocaleString());
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechTranslationConfig, audioConfig?: sdk.AudioConfig) => sdk.TranslationRecognizer = (speechConfig?: sdk.SpeechTranslationConfig, audioConfig?: sdk.AudioConfig): sdk.TranslationRecognizer => {

    let s: sdk.SpeechTranslationConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }
    let a: sdk.AudioConfig = audioConfig;
    if (a === undefined) {
        a = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(a);
    }


    const language: string = Settings.WaveFileLanguage;
    if (s.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage]) === undefined) {
        s.speechRecognitionLanguage = language;
    }
    s.addTargetLanguage("de-DE");

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, a);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildSpeechConfig: () => sdk.SpeechTranslationConfig = (): sdk.SpeechTranslationConfig => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    return s;
};

const FIRST_EVENT_ID: number = 1;
const Recognizing: string = "Recognizing";
const Recognized: string = "Recognized";
const Canceled: string = "Canceled";

let eventIdentifier: number;

test("TranslationRecognizerMicrophone", () => {
    // eslint-disable-next-line no-console
    console.info("Name: TranslationRecognizerMicrophone");

    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);
    expect(s).not.toBeUndefined();
    s.addTargetLanguage("en-US");
    s.speechRecognitionLanguage = "en-US";

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    objsToClose.push(r);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer).toEqual(true);
});

test("TranslationRecognizerWavFile", () => {
    // eslint-disable-next-line no-console
    console.info("Name: TranslationRecognizerWavFile");
    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);
});

test("GetSourceLanguage", () => {
    // eslint-disable-next-line no-console
    console.info("Name: GetSourceLanguage");
    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);
    expect(r.speechRecognitionLanguage).not.toBeUndefined();
    expect(r.speechRecognitionLanguage).not.toBeNull();
    expect(r.speechRecognitionLanguage).toEqual(r.properties.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage]));
});

test("GetParameters", () => {
    // eslint-disable-next-line no-console
    console.info("Name: GetParameters");
    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
    expect(r.speechRecognitionLanguage).toEqual(r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_RecoLanguage, ""));

    // TODO this cannot be true, right? comparing an array with a string parameter???
    expect(r.targetLanguages.length).toEqual(1);
    expect(r.targetLanguages[0]).toEqual(r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages));
});

describe.each([false])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.info("forceNodeWebSocket: " + forceNodeWebSocket);
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });
    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    describe("Counts Telemetry", () => {
        afterAll(() => {
            ServiceRecognizerBase.telemetryData = undefined;
        });

        // telemetry counts aren't lining up - investigate
        test.skip("RecognizeOnceAsync1", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
            console.info("Name: RecognizeOnceAsync1");
            const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
            objsToClose.push(r);

            let telemetryEvents: number = 0;
            let sessionId: string;
            let hypoCounter: number = 0;

            r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
                sessionId = e.sessionId;
            };

            r.recognizing = (s: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
                hypoCounter++;
            };

            ServiceRecognizerBase.telemetryData = (json: string): void => {
                // Only record telemetry events from this session.
                if (json !== undefined &&
                    sessionId !== undefined &&
                    json.indexOf(sessionId) > 0) {
                    try {
                        expect(hypoCounter).toBeGreaterThanOrEqual(1);
                        validateTelemetry(json, 1, hypoCounter);
                    } catch (error) {
                        done(error);
                    }
                    telemetryEvents++;
                }
            };

            r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
                try {
                    expect(e.errorDetails).toBeUndefined();
                } catch (error) {
                    done(error);
                }
            };

            r.sessionStopped = (s: sdk.SpeechRecognizer, e: sdk.SpeechRecognitionEventArgs) => {
                try {
                    expect(telemetryEvents).toEqual(1);
                    done();
                } catch (error) {
                    done(error);
                }
            };

            r.recognizeOnceAsync(
                (res: sdk.TranslationRecognitionResult) => {
                    expect(res).not.toBeUndefined();
                    expect(res.errorDetails).toBeUndefined();
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                    expect(res.translations.get("de", undefined) !== undefined).toEqual(true);
                    expect("Wie ist das Wetter?").toEqual(res.translations.get("de", ""));
                    expect(res.text).toEqual("What's the weather like?");
                },
                (error: string) => {
                    done(error);
                });
        });
    });

    test("Validate Event Ordering", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Validate Event Ordering");
        const SpeechStartDetectedEvent = "SpeechStartDetectedEvent";
        const SpeechEndDetectedEvent = "SpeechEndDetectedEvent";
        const SessionStartedEvent = "SessionStartedEvent";
        const SessionStoppedEvent = "SessionStoppedEvent";

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const eventsMap: { [id: string]: number; } = {};
        eventIdentifier = 1;

        r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            eventsMap[Recognized] = eventIdentifier++;
        };

        r.recognizing = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[Recognizing + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[Recognizing] = now;
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
            eventsMap[Canceled] = eventIdentifier++;
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        // TODO eventType should be renamed and be a function getEventType()
        r.speechStartDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SpeechStartDetectedEvent + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[SpeechStartDetectedEvent] = now;
        };
        r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SpeechEndDetectedEvent + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[SpeechEndDetectedEvent] = now;
        };

        r.sessionStarted = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SessionStartedEvent + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[SessionStartedEvent] = now;
        };
        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SessionStoppedEvent + "-" + Date.now().toPrecision(4)] = now;
            eventsMap[SessionStoppedEvent] = now;
        };

        // Event order is:
        // SessionStarted
        // SpeechStartDetected
        // 0 or more Recognizing
        // SpeechEnded
        // Recognized
        // SessionEnded

        r.recognizeOnceAsync((res: sdk.TranslationRecognitionResult) => {
            try {
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                expect(res.translations.get("de", "No Translation")).toEqual("Wie ist das Wetter?");

                // session events are first and last event
                const LAST_RECORDED_EVENT_ID: number = eventIdentifier - 1;
                expect(LAST_RECORDED_EVENT_ID).toBeGreaterThan(FIRST_EVENT_ID);

                // The session started and stopped.
                expect(SessionStartedEvent in eventsMap).toEqual(true);
                expect(SessionStoppedEvent in eventsMap).toEqual(true);

                // The session events bookended the rest.
                expect(eventsMap[SessionStartedEvent]).toEqual(FIRST_EVENT_ID);
                expect(eventsMap[SessionStoppedEvent]).toEqual(LAST_RECORDED_EVENT_ID);

                // Start always before end.
                expect(eventsMap[SessionStartedEvent]).toBeLessThan(eventsMap[SessionStoppedEvent]);
                expect(eventsMap[SpeechStartDetectedEvent]).toBeLessThan(eventsMap[SpeechEndDetectedEvent]);

                // SpeechStart was the 2nd event.
                expect((FIRST_EVENT_ID + 1)).toEqual(eventsMap[SpeechStartDetectedEvent]);

                // Translation uses the continuous endpoint for all recos, so the order is
                // recognized then speech end.
                // expect((LAST_RECORDED_EVENT_ID - 1)).toEqual(eventsMap[SpeechEndDetectedEvent]);
                // expect((LAST_RECORDED_EVENT_ID - 2)).toEqual(eventsMap[Recognized]);

                // Speech ends before the session stops.
                expect(eventsMap[SpeechEndDetectedEvent]).toBeLessThan(eventsMap[SessionStoppedEvent]);

                // there is no partial result reported after the final result
                // (and check that we have intermediate and final results recorded)
                if (Recognizing in eventsMap) {
                    expect(eventsMap[Recognizing]).toBeGreaterThan(eventsMap[SpeechStartDetectedEvent]);
                    expect(eventsMap[Recognizing]).toBeLessThan(eventsMap[Recognized]);
                }

                // make sure events we don't expect, don't get raised
                // The canceled event comes *after* the callback.
                expect(Canceled in eventsMap).toBeFalsy();
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    });

    test("StartContinuousRecognitionAsync", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: StartContinuousRecognitionAsync");
        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {

            // Just long enough to start the connection, but not as long as recognition takes.
            const end: number = Date.now() + 1000;

            WaitForCondition(() => {
                return end <= Date.now();
            }, () => {
                r.stopContinuousRecognitionAsync(() => {
                    done();
                }, (error: string) => done(error));
            });
        }, (error: string) => done(error));
    });

    test("StopContinuousRecognitionAsync", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: StopContinuousRecognitionAsync");
        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).not.toEqual(sdk.CancellationReason.Error);
            } catch (error) {
                done(error);
            }
        };
        r.startContinuousRecognitionAsync(() => {
            const end: number = Date.now() + 1000;

            WaitForCondition(() => {
                return end <= Date.now();
            }, () => {
                r.stopContinuousRecognitionAsync(() => done(), (error: string) => done(error));
            });
        }, (error: string) => done(error));
    });

    test("StartStopContinuousRecognitionAsync", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: StartStopContinuousRecognitionAsync");
        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const rEvents: { [id: string]: string; } = {};

        r.recognized = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            const result: string = e.result.translations.get("de", "");
            rEvents["Result@" + Date.now()] = result;
            try {
                expect(e.result.properties).not.toBeUndefined();
                expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            } catch (error) {
                done(error);
            }
        });

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync();

        WaitForCondition((): boolean => {
            return Object.keys(rEvents).length > 0;
        }, () => {
            try {
                expect(rEvents[Object.keys(rEvents)[0]]).toEqual("Wie ist das Wetter?");
            } catch (error) {
                done(error);
            }
            r.stopContinuousRecognitionAsync(() => done(), (error: string) => done(error));
        });
    });
    
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
    }, 20000);

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
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.addTargetLanguage("de-DE");
        s.speechRecognitionLanguage = "en-US";

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        let numReports: number = 0;

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
            done(e.errorDetails);
        };

        r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            try {
                const res: sdk.SpeechRecognitionResult = e.result;
                expect(res).not.toBeUndefined();
                expect(sdk.ResultReason.NoMatch).toEqual(res.reason);
                expect(res.text).toBeUndefined();

                const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
                expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
            } catch (error) {
                done(error);
            } finally {
                numReports++;
            }

        };

        r.recognizeOnceAsync(
            (p2: sdk.TranslationRecognitionResult) => {
                const res: sdk.TranslationRecognitionResult = p2;
                numReports++;

                expect(res).not.toBeUndefined();
                expect(sdk.ResultReason.NoMatch).toEqual(res.reason);
                expect(res.errorDetails).toBeUndefined();
                expect(res.text).toBeUndefined();

                const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
                expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
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

    test.skip("emptyFile", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: emptyFile");
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const blob: Blob[] = [];
        const f: File = new File(blob, "file.wav");

        const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);
        let oneCalled: boolean = false;

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.reason).toEqual(sdk.CancellationReason.Error);
                const cancelDetails: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(e.result);
                expect(cancelDetails.reason).toEqual(sdk.CancellationReason.Error);

                if (true === oneCalled) {
                    done();
                } else {
                    oneCalled = true;
                }
            } catch (error) {
                done(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.SpeechRecognitionResult) => {
                if (true === oneCalled) {
                    done();
                } else {
                    oneCalled = true;
                }

            },
            (error: string) => {
                done(error);
            });
    });

    test("Audio Config is optional", () => {
        // eslint-disable-next-line no-console
        console.info("Name: Audio Config is optional");
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.addTargetLanguage("de-DE");
        s.speechRecognitionLanguage = Settings.WaveFileLanguage;

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
        objsToClose.push(r);

        expect(r instanceof sdk.Recognizer).toEqual(true);

    });

    Settings.testIfDOMCondition("Default mic is used when audio config is not specified. (once)", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Default mic is used when audio config is not specified. (once)");
        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        expect(s).not.toBeUndefined();
        s.speechRecognitionLanguage = "en-US";
        s.addTargetLanguage("en-US");

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
        expect(r instanceof sdk.Recognizer).toEqual(true);
        // Node.js doesn't have a microphone natively. So we'll take the specific message that indicates that microphone init failed as evidence it was attempted.
        r.recognizeOnceAsync(() => done("RecognizeOnceAsync returned success when it should have failed"),
            (error: string): void => {
                try {
                    expect(error).not.toBeUndefined();
                    expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    Settings.testIfDOMCondition("Default mic is used when audio config is not specified. (Cont)", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Default mic is used when audio config is not specified. (Cont)");
        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        expect(s).not.toBeUndefined();
        s.speechRecognitionLanguage = "en-US";
        s.addTargetLanguage("en-US");

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
        expect(r instanceof sdk.Recognizer).toEqual(true);

        r.startContinuousRecognitionAsync(() => done("startContinuousRecognitionAsync returned success when it should have failed"),
            (error: string): void => {
                try {
                    expect(error).not.toBeUndefined();
                    expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
                    done();
                } catch (error) {
                    done(error);
                }
            });
    });

    test("Connection Errors Propogate Async", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Connection Errors Propogate Async");
        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription("badKey", Settings.SpeechRegion);
        objsToClose.push(s);
        s.addTargetLanguage("en-US");

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                done();
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync();
    }, 15000);

    test("Connection Errors Propogate Sync", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Connection Errors Propogate Sync");
        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription("badKey", Settings.SpeechRegion);
        objsToClose.push(s);
        s.addTargetLanguage("en-US");

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);

        let doneCount: number = 0;
        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");
                doneCount++;
            } catch (error) {
                done(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.TranslationRecognitionResult) => {
            try {
                const e: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");
                doneCount++;
            } catch (error) {
                done(error);
            }

            WaitForCondition(() => (doneCount === 2), done);

        });
    }, 15000);

    test("Silence After Speech", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Silence After Speech");
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(32 * 1024 * 30); // ~30 seconds.
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        s.addTargetLanguage("de-DE");
        s.speechRecognitionLanguage = "en-US";
        objsToClose.push(s);

        p.write(WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile));
        p.write(bigFileBuffer.buffer);
        p.close();

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let noMatchCount: number = 0;
        let speechEnded: number = 0;

        r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            try {
                if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
                    expect(speechRecognized).toEqual(false);
                    speechRecognized = true;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                    expect(speechRecognized).toEqual(true);
                    noMatchCount++;
                }
            } catch (error) {
                done(error);
            }
        };

        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            inTurn = true;
        });

        r.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            inTurn = false;
        });

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                canceled = true;
            } catch (error) {
                done(error);
            }
        };

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

    test("Silence Then Speech", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Silence Then Speech");
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(32 * 1024 * 30); // ~30 seconds.
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "en-US";
        s.addTargetLanguage("de-DE");

        p.write(bigFileBuffer.buffer);
        p.write(WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile));
        p.close();

        const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let noMatchCount: number = 0;
        let speechEnded: number = 0;

        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                switch (e.reason) {
                    case sdk.CancellationReason.Error:
                        done(e.errorDetails);
                        break;
                    case sdk.CancellationReason.EndOfStream:
                        canceled = true;
                        break;
                }
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

        r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            try {
                const res: sdk.TranslationRecognitionResult = e.result;
                expect(res).not.toBeUndefined();
                if (res.reason === sdk.ResultReason.TranslatedSpeech) {
                    expect(speechRecognized).toEqual(false);
                    expect(noMatchCount).toBeGreaterThanOrEqual(1);
                    speechRecognized = true;
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                    expect(res.text).toEqual("What's the weather like?");
                } else if (res.reason === sdk.ResultReason.NoMatch) {
                    expect(speechRecognized).toEqual(false);
                    noMatchCount++;
                }
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (canceled && !inTurn), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
                        // TODO: investigate speech end in translation
                        // expect(speechEnded).toEqual(noMatchCount + 1);
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
    }, 35000);
});

test("Multiple Phrase Latency Reporting", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Multiple Phrase Latency Reporting");

    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);
    s.addTargetLanguage("de-DE");
    s.speechRecognitionLanguage = "en-US";

    let numSpeech: number = 0;
    
    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: sdk.PullAudioInputStream = pullStreamSource.PullStream;

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.speechEndDetected = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        pullStreamSource.StartRepeat();
    };

    let lastOffset: number = 0;

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(disconnected).toEqual(false);
            expect(e.offset).toBeGreaterThan(lastOffset);
            lastOffset = e.offset;
            recoCount++;

            if ((e.result.reason === sdk.ResultReason.TranslatedSpeech) && (++numSpeech % 2 === 0)) {
                pullStreamSource.StartRepeat();
            }

        } catch (error) {
            done(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done(error);
        });

    WaitForCondition(() => (recoCount === 16), () => {
        r.stopContinuousRecognitionAsync(() => {
            done();
        });
    });
}, 120000);
