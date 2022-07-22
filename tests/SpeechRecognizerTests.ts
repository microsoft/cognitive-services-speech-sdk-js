// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

//
// Test Settings
//
// Mandatory settings that do not have default values in Settings.ts. You must define them
// before running the test (see README.md).
//   Settings.SpeechSubscriptionKey
//   Settings.SpeechRegion
//   Settings.SpeechTestEndpointId
//
// Mandatory settings that have defaults in Settings.ts. You do not need to define them.
//   Settings.WaveFile
//   Settings.WaveFile44k
//   Settings.WaveFileText
//   Settings.WaveFileLanguage
//   Settings.AmbiguousWaveFile
//   Settings.VoiceSignatureEnrollmentEndpoint
//   Settings.VoiceSignatureWaveFile
//
// Optional settings for this test. They do not have default values.
//   Settings.SpeechEndpoint
//   Settings.proxyServer
//   Settings.proxyPort
//
// This one is used for a test that is commented out:
// Settings.VoiceSignatureEnrollmentKey
//

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { DetailedSpeechPhrase, ServiceRecognizerBase } from "../src/common.speech/Exports";
import { HeaderNames } from "../src/common.speech/HeaderNames";
import { QueryParameterNames } from "../src/common.speech/QueryParameterNames";
import { ConnectionStartEvent, createNoDashGuid, IDetachable } from "../src/common/Exports";
import { Events, EventType, PlatformEvent } from "../src/common/Exports";

import { Settings } from "./Settings";
import { validateTelemetry } from "./TelemetryUtil";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

import * as fs from "fs";
import * as request from "request";

import { setTimeout } from "timers";
import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import { closeAsyncObjects, RepeatingPullStream, WaitForCondition } from "./Utilities";

import { AudioStreamFormatImpl } from "../src/sdk/Audio/AudioStreamFormat";
import { Console } from "console";
import { utils } from "../external/ocsp/ocsp";
import { PullAudioInputStream } from "../microsoft.cognitiveservices.speech.sdk";

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

afterEach(async (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
    done();
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
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

/*
test("speech.event from service", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: speech.event from service");

    expect(Settings.VoiceSignatureEnrollmentEndpoint && Settings.VoiceSignatureEnrollmentEndpoint.length > 0);
    expect(Settings.VoiceSignatureEnrollmentKey && Settings.VoiceSignatureEnrollmentKey.length > 0);

    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL(Settings.VoiceSignatureEnrollmentEndpoint), Settings.VoiceSignatureEnrollmentKey);
    objsToClose.push(s);

    const file: File = WaveFileAudioInput.LoadFile(Settings.VoiceSignatureWaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(file);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let sessionDone: boolean = false;

    const phraseList: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    let expectedText: string;
    expectedText = "Hello, it's a good day for me to teach you the sound of my voice. You have learned what I look like, now you can hear what I sound like.";
    expectedText += "The sound of my voice will help the transcription service to recognize my unique voice in the future.";
    expectedText += "Training will provide a better experience with greater accuracy when talking or dictating.";
    expectedText += "Thank you and goodbye.";

    phraseList.addPhrase(expectedText);
    let sessionId: string;
    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.sessionStopped = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionDone = true;
    };

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    let receivedSpeechEvent: boolean = false;
    connection.receivedServiceMessage = (e: sdk.ServiceEventArgs): void => {
       // eslint-disable-next-line no-console
       console.info("Receuved a Service message: '" + e.jsonString + "'");
       if ( e.eventName === "speech.event" ) {
           receivedSpeechEvent = true;
       }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        sessionDone = true;
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => (sessionDone), () => {
        r.stopContinuousRecognitionAsync(() => {
           expect(receivedSpeechEvent).toEqual(true);
           done();
        });
    });

}, 200000);
*/
test("testDetailedSpeechPhrase1", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: testDetailedSpeechPhrase1");
    try {
        const testJsonString: string = `{"Id":"1234","RecognitionStatus":"Success","Offset":1,"Duration":4000000,"DisplayText":"This","NBest":[{"Confidence":0.9,"Lexical":"this","ITN":"this","MaskedITN":"this","Display":"This.","Words":[{"Word":"this","Offset":2,"Duration":4000000}]},{"Confidence":0.0,"Lexical":"","ITN":"","MaskedITN":"","Display":""}]}`;
        const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(testJsonString);
        const offsetCorrectedJson: string = detailed.getJsonWithCorrectedOffsets(3);
        expect(offsetCorrectedJson).not.toBeUndefined();
        done();
    } catch (err) {
        done.fail(err);
    }
});

test("testSpeechRecognizer1", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testSpeechRecognizer1");
    const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(speechConfig).not.toBeUndefined();

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);
});

test("testGetLanguage1", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetLanguage1");
    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.speechRecognitionLanguage).not.toBeNull();
});

test("testGetLanguage2", () => {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.info("Name: testGetOutputFormatDefault");
    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.outputFormat === sdk.OutputFormat.Simple);
});

test("testGetParameters", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetParameters");
    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
    // expect(r.language ==  r.properties.getProperty(RecognizerParameterNames.SpeechRecognitionLanguage));
    // expect(r.deploymentId == r.properties.getProperty(RecognizerParameterNames.SpeechMspeechConfigImpl// TODO: is this really the correct mapping?
    expect(r.speechRecognitionLanguage).not.toBeUndefined();
    expect(r.endpointId === r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_EndpointId, null)); // todo: is this really the correct mapping?
});

test("BadWavFileProducesError", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: BadWavFileProducesError");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
    let config: sdk.AudioConfig;
    if (typeof File !== "undefined") {
        const inputStream: File = ByteBufferAudioFile.Load([bigFileBuffer.buffer]);
        config = sdk.AudioConfig.fromWavFileInput(inputStream);
    } else {
        const b: Buffer = Buffer.from(bigFileBuffer, bigFileBuffer.byteOffset, bigFileBuffer.byteLength);
        config = sdk.AudioConfig.fromWavFileInput(b);
    }

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);

    /* tslint:disable:no-empty */
    r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
    }, (error: string) => {
        try {
            expect(error).not.toBeUndefined();
            done();
        } catch (error) {
            done.fail(error);
        }
    });
}, 15000);

describe.each([true])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("44Khz Wave File", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: 44Khz Wave File");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.outputFormat = sdk.OutputFormat.Detailed;

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s, Settings.WaveFile44k);
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
                expect(result.errorDetails).toBeUndefined();
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

    test("testGetOutputFormatDetailed", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
                expect(result.errorDetails).toBeUndefined();
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
        // eslint-disable-next-line no-console
        console.info("Name: testGetOutputFormatDetailed");

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
        // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
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

            r.sessionStopped = (s: sdk.SpeechRecognizer, e: sdk.SpeechRecognitionEventArgs) => {
                try {
                    expect(telemetryEvents).toEqual(1);
                    done();
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

                    } catch (error) {
                        done.fail(error);
                    }

                },
                (error: string) => {
                    done.fail(error);
                });
        });

        test("testStopContinuousRecognitionAsyncWithTelemetry", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-string-literal
            eventsMap[SpeechStartDetectedEvent] = now;
        };
        r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SpeechEndDetectedEvent] = now;
        };

        r.sessionStarted = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SessionStartedEvent] = now;
            eventsMap[SessionStartedEvent + "-" + Date.now().toPrecision(4)] = now;
        };
        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SessionStoppedEvent] = now;
            eventsMap[SessionStoppedEvent + "-" + Date.now().toPrecision(4)] = now;
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

                    // Event order is:
                    // SessionStarted
                    // SpeechStartDetected
                    // 0 or more Recognizing
                    // SpeechEnded
                    // Recognized
                    // SessionEnded

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

                    // make sure, first end of speech, then final result
                    expect((LAST_RECORDED_EVENT_ID - 2)).toEqual(eventsMap[SpeechEndDetectedEvent]);
                    expect((LAST_RECORDED_EVENT_ID - 1)).toEqual(eventsMap[Recognized]);

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
                    done.fail(error);
                }
            }, (error: string) => {
                done.fail(error);
            });

    });

    test("Event Tests (Continuous)", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-string-literal
            eventsMap[SpeechStartDetectedEvent] = now;
        };
        r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SpeechEndDetectedEvent] = now;
        };

        r.sessionStarted = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SessionStartedEvent] = now;
            eventsMap[SessionStartedEvent + "-" + Date.now().toPrecision(4)] = now;
        };

        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            const now: number = eventIdentifier++;
            eventsMap[SessionStoppedEvent] = now;
            eventsMap[SessionStoppedEvent + "-" + Date.now().toPrecision(4)] = now;
            sessionStopped = true;
        };

        r.startContinuousRecognitionAsync();

        WaitForCondition(() => sessionStopped, () => {
            try {
                // session events are first and last event
                const LAST_RECORDED_EVENT_ID: number = --eventIdentifier;
                expect(LAST_RECORDED_EVENT_ID).toBeGreaterThan(FIRST_EVENT_ID);

                expect(SessionStartedEvent in eventsMap).toEqual(true);

                expect(eventsMap[SessionStartedEvent]).toEqual(FIRST_EVENT_ID);

                expect(SessionStoppedEvent in eventsMap).toEqual(true);
                expect(LAST_RECORDED_EVENT_ID).toEqual(eventsMap[SessionStoppedEvent]);

                // end events come after start events.
                if (SessionStoppedEvent in eventsMap) {
                    expect(eventsMap[SessionStartedEvent])
                        .toBeLessThan(eventsMap[SessionStoppedEvent]);
                }

                expect(eventsMap[SpeechStartDetectedEvent])
                    .toBeLessThan(eventsMap[SpeechEndDetectedEvent]);
                expect((FIRST_EVENT_ID + 1)).toEqual(eventsMap[SpeechStartDetectedEvent]);

                // make sure, first end of speech, then final result
                expect((LAST_RECORDED_EVENT_ID - 1)).toEqual(eventsMap[Canceled]);
                expect((LAST_RECORDED_EVENT_ID - 2)).toEqual(eventsMap[SpeechEndDetectedEvent]);
                expect((LAST_RECORDED_EVENT_ID - 3)).toEqual(eventsMap[Recognized]);

                // recognition events come after session start but before session end events
                expect(eventsMap[SessionStartedEvent])
                    .toBeLessThan(eventsMap[SpeechStartDetectedEvent]);

                if (SessionStoppedEvent in eventsMap) {
                    expect(eventsMap[SpeechEndDetectedEvent])
                        .toBeLessThan(eventsMap[SessionStoppedEvent]);
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
            // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.info("Name: Close with no recognition");
        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);
    });

    test("Config is copied on construction", () => {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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

    test("Detailed output continuous recognition stops correctly", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Detailed output continuous recognition stops correctly");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "en-US";
        s.outputFormat = sdk.OutputFormat.Detailed;

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.LongerWaveFile);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);
        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        r.sessionStopped = (s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            done();
        };

        r.recognizing = (s: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
            r.stopContinuousRecognitionAsync();
        };

        r.startContinuousRecognitionAsync();
    }, 15000);

    test("PushStream start-stop-start continuous recognition on PushStream", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: PushStream start-stop-start continuous recognition on PushStream");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        const pushStream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();

        // open the file and push it to the push stream.
        fs.createReadStream(Settings.LongerWaveFile).on("data", (arrayBuffer: Buffer) => {
            pushStream.write(arrayBuffer.slice());
        }).on("end", () => {
            pushStream.close();
        });

        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        let previouslyStopped: boolean = false;
        r.sessionStopped = (s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            if (!previouslyStopped) {
                previouslyStopped = true;
                r.startContinuousRecognitionAsync();
            }
        };

        r.recognizing = (s: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
            if (previouslyStopped) {
                expect(e).not.toBeUndefined();
                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizingSpeech]);
                expect(e.result.properties).not.toBeUndefined();
                expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                done();
            }
            r.stopContinuousRecognitionAsync();
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.startContinuousRecognitionAsync();
    }, 15000);

    test("PushStream44K, muLaw, Alaw files", async (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: PushStream44K, muLaw, Alaw files");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        let success: number = 0;

        const formatTestFiles: { file: string, sampleRate: number, bitRate: number, channels: number, formatTag: sdk.AudioFormatTag }[] = [
            { file: Settings.WaveFile44k, sampleRate: 44100, bitRate: 16, channels: 1, formatTag: sdk.AudioFormatTag.PCM },
            { file: Settings.WaveFileAlaw, sampleRate: 16000, bitRate: 16, channels: 1, formatTag: sdk.AudioFormatTag.ALaw },
            { file: Settings.WaveFileMulaw, sampleRate: 16000, bitRate: 16, channels: 1, formatTag: sdk.AudioFormatTag.MuLaw },
        ];

        for (const testFile of formatTestFiles) {
            const format: sdk.AudioStreamFormat = sdk.AudioStreamFormat.getWaveFormat(testFile.sampleRate, testFile.bitRate, testFile.channels, testFile.formatTag);
            const f: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(testFile.file);
            const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream(format);
            const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

            p.write(f);
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

                        success++;
                    } catch (error) {
                        done.fail(error);
                    }

                },
                (error: string) => {
                    done.fail(error);
                });

        }
        WaitForCondition(() => success === 3, done);
    });

    test("PushStream4KPostRecognizePush", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength) : (bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start);

                    if (bytesSent < buffer.byteLength) {
                        setTimeout(() => p.close(), 1000);
                    }

                    return (end - start);
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

    test("PullStream44K", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: PullStream44K");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile44k);

        let bytesSent: number = 0;
        let p: sdk.PullAudioInputStream;

        p = sdk.AudioInputStream.createPullStream(
            {
                close: () => { return; },
                read: (buffer: ArrayBuffer): number => {
                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength) : (bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start);

                    if (bytesSent < buffer.byteLength) {
                        setTimeout(() => p.close(), 1000);
                    }

                    return (end - start);
                },
            },
            sdk.AudioStreamFormat.getWaveFormatPCM(44100, 16, 1));

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
    }, 120000);

    test("PullStreamHalfFill", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
                    const end: number = fillSize > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength) : (bytesSent + fillSize);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start);

                    if (bytesSent < buffer.byteLength) {
                        setTimeout(() => p.close(), 1000);
                    }

                    return (end - start);
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

    test.skip("emptyFile", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
                    const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength) : (bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                    bytesSent += (end - start);

                    if (bytesSent > (fileBuffer.byteLength / 3)) {
                        p.close();
                    }

                    return (end - start);
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
                    expect(res.text.startsWith("What's")).toBeTruthy();
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
        // eslint-disable-next-line no-console
        console.info("Name: RecognizeOnceAsync is async");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.speechRecognitionLanguage = "en-US";

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

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
    }, 100000);

    test("Audio Config is optional", () => {
        // eslint-disable-next-line no-console
        console.info("Name: Audio Config is optional");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
        objsToClose.push(r);
        expect(r instanceof sdk.Recognizer).toEqual(true);
    });

    Settings.testIfDOMCondition("Default mic is used when audio config is not specified.", () => {
        // eslint-disable-next-line no-console
        console.info("Name: Default mic is used when audio config is not specified.");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        let r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
        objsToClose.push(r);

        expect(r instanceof sdk.Recognizer).toEqual(true);
        // Node.js doesn't have a microphone natively. So we'll take the specific message that indicates that microphone init failed as evidence it was attempted.
        r.recognizeOnceAsync(() => fail("RecognizeOnceAsync returned success when it should have failed"),
            (error: string): void => {
                expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
            });

        r = new sdk.SpeechRecognizer(s);
        objsToClose.push(r);

        r.startContinuousRecognitionAsync(() => fail("startContinuousRecognitionAsync returned success when it should have failed"),
            (error: string): void => {
                expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
            });
    });

    test("Using disposed recognizer invokes error callbacks.", async (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Using disposed recognizer invokes error callbacks.");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
        expect(r instanceof sdk.Recognizer).toEqual(true);

        let success: number = 0;

        await new Promise<void>((resolve: () => void, reject: (reason: string) => void) => {
            r.close(resolve, reject);
        });

        r.recognizeOnceAsync(() => fail("RecognizeOnceAsync on closed recognizer called success callback"),
            (error: string): void => {
                try {
                    expect(error).toEqual("Error: the object is already disposed");
                    success++;
                } catch (error) {
                    done.fail(error);
                }
            });

        r.startContinuousRecognitionAsync(() => fail("startContinuousRecognitionAsync on closed recognizer called success callback"),
            (error: string): void => {
                try {
                    expect(error).toEqual("Error: the object is already disposed");
                    success++;
                } catch (error) {
                    done.fail(error);
                }
            });

        r.stopContinuousRecognitionAsync(() => fail("stopContinuousRecognitionAsync on closed recognizer called success callback"),
            (error: string): void => {
                try {
                    expect(error).toEqual("Error: the object is already disposed");
                    success++;
                } catch (error) {
                    done.fail(error);
                }
            });

        WaitForCondition(() => success === 3, done);
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
                    expect(uri.search(QueryParameterNames.CustomSpeechDeploymentId + "=" + Settings.SpeechTestEndpointId)).not.toEqual(-1);
                    expect(uri.search(QueryParameterNames.Language)).toEqual(-1);

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
                detachObject.detach().catch((error: string) => {
                    throw new Error(error);
                });
                detachObject = undefined;
            }

            uri = undefined;
        });

        test("Endpoint URL With Parameter Test", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
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
        }, 100000);

        test("Endpoint URL With Auth Token Bearer added", (done: jest.DoneCallback) => {
            // eslint-disable-next-line no-console
            console.info("Name: Endpoint URL With Auth Token Bearer added");

            const fakeToken: string = createNoDashGuid();
            const s: sdk.SpeechConfig = sdk.SpeechConfig.fromAuthorizationToken(fakeToken, "westus");
            objsToClose.push(s);

            const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
            objsToClose.push(r);

            r.recognizeOnceAsync(
                (p2: sdk.SpeechRecognitionResult) => {
                    try {
                        expect(uri).not.toBeUndefined();
                        // make sure "bearer " is being added to uri
                        expect(uri.indexOf("bearer " + fakeToken)).not.toBeUndefined();

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
        }, 100000);
    });

    test("Connection Errors Propogate Async", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Connection Errors Propogate Async");
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("badKey", Settings.SpeechRegion);
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);

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
        // eslint-disable-next-line no-console
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

    }, 100000);

    test("RecognizeOnce Bad Language", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
});

Settings.testIfDOMCondition("Push Stream Async", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
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

test("Multiple RecognizeOnce calls share a connection", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Multiple RecognizeOnce calls share a connection");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: PullAudioInputStream = pullStreamSource.PullStream;

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
                pullStreamSource.StartRepeat();
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
    // eslint-disable-next-line no-console
    console.info("Name: Multiple ContReco calls share a connection");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    let sessionId: string;

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: PullAudioInputStream = pullStreamSource.PullStream;;

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
            // eslint-disable-next-line no-console
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
            expect(disconnected).toEqual(false);
            if (0 !== recoCount % 2) {
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.NoMatch]);
            } else {
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(res.text).toContain("the weather like?");
            }
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

            pullStreamSource.StartRepeat();

            r.startContinuousRecognitionAsync(
                undefined,
                (error: string) => {
                    done.fail(error);
                });
        });
    });

    WaitForCondition(() => {
        return recoCount === 3;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {
            done();
        });
    });
}, 20000);

test("StopContinous Reco does", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: StopContinous Reco does");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    let recognizing: boolean = true;
    let failed: boolean = false;

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: PullAudioInputStream = pullStreamSource.PullStream;

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
            expect(disconnected).toEqual(false);
            if (0 === recoCount) {
                // First the phrase
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(res.text).toEqual("What's the weather like?");
                recoCount++;
            } else {
                // Then the silence we sent after it.
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.NoMatch]);
            }
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
            pullStreamSource.StartRepeat();

            setTimeout(() => {
                if (!failed) {
                    done();
                }
            }, 5000);
        });
    });

}, 100000);

describe("PhraseList tests", () => {
    test("Ambiguous Speech default as expected", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
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
    }, 10000);

    test("Phraselist Clear works.", (done: jest.DoneCallback) => {

        // eslint-disable-next-line no-console
        console.info("Name: Phraselist Clear works.");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        let gotReco: boolean = false;

        const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.AmbiguousWaveFile);
        const p: PullAudioInputStream = pullStreamSource.PullStream;

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
                if (!gotReco) {
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    if (phraseAdded) {
                        expect(res.text).toContain("Wreck a nice beach.");
                    } else {
                        expect(res.text).toEqual("Recognize speech.");
                    }
                    gotReco = true;
                    recoCount++;
                }

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
            pullStreamSource.StartRepeat();
            gotReco = false;

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
});
