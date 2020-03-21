// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { setTimeout } from "timers";

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { Events, EventType } from "../src/common/Exports";

import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import { Settings } from "./Settings";
import { default as WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

import { AudioStreamFormatImpl } from "../src/sdk/Audio/AudioStreamFormat";

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
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // tslint:disable-next-line:no-console
    console.log(`Heap memory usage before test: ${Math.round(used * 100) / 100} MB`);
});

afterEach(() => {
    // tslint:disable-next-line:no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: any, index: number, array: any[]) => {
        if (typeof value.close === "function") {
            value.close();
        }
    });
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    // tslint:disable-next-line:no-console
    console.log(`Heap memory usage after test: ${Math.round(used * 100) / 100} MB`);
});

const ValidateResultMatchesWaveFile = (res: sdk.SpeechRecognitionResult): void => {
    expect(res).not.toBeUndefined();
    expect(res.text).toEqual(Settings.LuisWavFileText);
    expect(Math.abs(res.duration - Settings.LuisWaveFileDuration) / Settings.LuisWaveFileDuration).toBeLessThanOrEqual(0.10);
    expect(Math.abs(res.offset - Settings.LuisWaveFileOffset) / Settings.LuisWaveFileOffset).toBeLessThanOrEqual(0.10);
};

const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechConfig, audioFileName?: string) => sdk.IntentRecognizer = (speechConfig?: sdk.SpeechConfig, audioFileName?: string): sdk.IntentRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const fileName: string = undefined === audioFileName ? Settings.LuisWaveFile : audioFileName;
    const f: File = WaveFileAudioInput.LoadFile(fileName);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const language: string = Settings.WaveFileLanguage;
    if (s.speechRecognitionLanguage === undefined) {
        s.speechRecognitionLanguage = language;
    }

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.LuisSubscriptionKey, Settings.LuisRegion);
    expect(s).not.toBeUndefined();
    return s;
};

describe.each([true, false])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeEach(() => {
        // tslint:disable-next-line:no-console
        console.info("forceNodeWebSocket: " + forceNodeWebSocket);
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("NoIntentsRecognizesSpeech", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: NoIntentsRecognizesSpeech");
        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.IntentRecognitionResult) => {

                const res: sdk.IntentRecognitionResult = p2;
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                ValidateResultMatchesWaveFile(res);
                done();
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("AddNullIntent", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: AddNullIntent");
        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        expect(() => r.addIntent("phrase", null)).toThrow();
    });

    test("AddNullPhrase", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: AddNullPhrase");
        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        expect(() => r.addIntent(null, "ID")).toThrow();
    });

    test("RoundTripWithGoodIntent", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: RoundTripWithGoodIntent");

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromAppId(Settings.LuisAppId);

        r.addIntentWithLanguageModel(Settings.LuisValidIntentId, lm);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.IntentRecognitionResult) => {
                const res: sdk.IntentRecognitionResult = p2;
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedIntent]);
                expect(res.intentId).toEqual(Settings.LuisValidIntentId);
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                ValidateResultMatchesWaveFile(res);
                done();
            },
            (error: string) => {
                done.fail(error);
            });
    });

    class BadLangModel extends sdk.LanguageUnderstandingModel {
        public constructor() {
            super();
        }
        public appId: string;
    }

    test("AddIntentWithBadModel", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: AddIntentWithBadModel");
        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const langModel: BadLangModel = new BadLangModel();
        langModel.appId = "";

        expect(() => r.addIntentWithLanguageModel("IntentId", langModel, "IntentName")).toThrow();
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

        testInitialSilenceTimeout(config, done, (): void => {
            const elapsed: number = Date.now() - startTime;

            // We should have sent 5 seconds of audio unthrottled and then 2x the time reco took until we got a response.
            const expectedBytesSent: number = (5 * 16000 * 2) + (2 * elapsed * 32000 / 1000);
            expect(bytesSent).toBeLessThanOrEqual(expectedBytesSent);
        });
    });

    test("InitialSilenceTimeout (push)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: InitialSilenceTimeout (push)");

        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

        p.write(bigFileBuffer.buffer);
        p.close();

        testInitialSilenceTimeout(config, done);
    });

    test("InitialSilenceTimeout (File)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: InitialSilenceTimeout (File)");
        const audioFormat: AudioStreamFormatImpl = sdk.AudioStreamFormat.getDefaultInputFormat() as AudioStreamFormatImpl;

        const bigFileBuffer: Uint8Array = new Uint8Array(1024 * 1024);
        const bigFile: File = ByteBufferAudioFile.Load([audioFormat.header, bigFileBuffer.buffer]);

        const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(bigFile);

        testInitialSilenceTimeout(config, done);
    });

    const testInitialSilenceTimeout = (config: sdk.AudioConfig, done: jest.DoneCallback, addedChecks?: () => void): void => {
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        let numReports: number = 0;

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs) => {
            done.fail(e.errorDetails);
        };

        r.recognized = (o: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs) => {
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
            (p2: sdk.IntentRecognitionResult) => {
                const res: sdk.IntentRecognitionResult = p2;
                numReports++;

                expect(res).not.toBeUndefined();
                expect(sdk.ResultReason.NoMatch).toEqual(res.reason);
                expect(res.errorDetails).toBeUndefined();
                expect(res.text).toBeUndefined();
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                const nmd: sdk.NoMatchDetails = sdk.NoMatchDetails.fromResult(res);
                expect(nmd.reason).toEqual(sdk.NoMatchReason.InitialSilenceTimeout);
            },
            (error: string) => {
                fail(error);
            });

        WaitForCondition(() => (numReports === 2), () => {
            setTimeout(done, 1);
            if (!!addedChecks) {
                addedChecks();
            }
        });
    };

    test("Continous Recog With Intent", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Continous Recog With Intent");

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromSubscription(Settings.LuisAppKey, Settings.LuisAppId, Settings.LuisRegion);
        r.addIntentWithLanguageModel(Settings.LuisValidIntentId, lm);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizing = (o: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs): void => {
            try {
                expect(e.result.reason).toEqual(sdk.ResultReason.RecognizingIntent);
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognized = (o: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs) => {
            try {
                const res: sdk.IntentRecognitionResult = e.result;
                expect(res).not.toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedIntent);
                expect(res.intentId).toEqual(Settings.LuisValidIntentId);
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                ValidateResultMatchesWaveFile(res);

                r.stopContinuousRecognitionAsync(() => {
                    done();
                }, (error: string) => {
                    done.fail(error);
                });
            } catch (error) {
                done.fail(error);
            }
        };

        r.startContinuousRecognitionAsync(
            /* tslint:disable:no-empty */
            () => { },
            (error: string) => {
                done.fail(error);
            });
    });

    test("RoundTripWithGoodModelWrongIntent", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: RoundTripWithGoodModelWrongIntent");

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromAppId(Settings.LuisAppId);

        r.addIntentWithLanguageModel(Settings.LuisValidIntentId + "-Bad", lm);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.IntentRecognitionResult) => {
                const res: sdk.IntentRecognitionResult = p2;
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                expect(res.intentId).toBeUndefined();
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                ValidateResultMatchesWaveFile(res);
                done();
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("MultiPhrase Intent", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: MultiPhrase Intent");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        s.speechRecognitionLanguage = Settings.LuisWaveFileLanguage;

        const f: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.LuisWaveFile);
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        const numPhrases: number = 3;

        // Adding some extra silence to ensure SR goes smmothly since the goal here isn't to test
        // the SR engine, but rather the multi-phrase reconnect code.
        const silenceBuffer: Uint8Array = new Uint8Array(16 * 1024); // ~500ms

        for (let i: number = 0; i <= 2; i++) {
            p.write(f);
            p.write(silenceBuffer.buffer);
        }

        p.close();

        const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();
        expect(r instanceof sdk.Recognizer);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromSubscription(Settings.LuisAppKey, Settings.LuisAppId, Settings.LuisRegion);
        r.addIntentWithLanguageModel(Settings.LuisValidIntentId, lm);

        let numIntents: number = 0;
        let inTurn: boolean = false;
        let canceled: boolean = false;

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs) => {
            try {
                switch (e.reason) {
                    case sdk.CancellationReason.Error:
                        done.fail(e.errorDetails);
                        break;
                    case sdk.CancellationReason.EndOfStream:
                        canceled = true;
                        break;
                }
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

        r.recognized = (o: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs) => {
            try {
                const res: sdk.IntentRecognitionResult = e.result;
                expect(res).not.toBeUndefined();
                if (numIntents !== numPhrases) {
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedIntent]);
                    expect(res.intentId).toEqual(Settings.LuisValidIntentId);
                    expect(res.text).toEqual(Settings.LuisWavFileText);
                    expect(res.properties).not.toBeUndefined();
                    expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                    numIntents++;
                } else {
                    expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.NoMatch]);
                }
            } catch (error) {
                done.fail(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => {
                return (canceled && !inTurn);
            }, () => {
                try {
                    expect(numIntents).toEqual(numPhrases);
                    r.stopContinuousRecognitionAsync(() => {
                        done();
                    }, (error: string) => {
                        done.fail(error);
                    });
                } catch (error) {
                    done.fail(error);
                }
            });
        },
            (error: string) => {
                done.fail(error);
            });
    }, 15000);

    test("IntentAlias", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: IntentAlias");

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromAppId(Settings.LuisAppId);
        const intentName: string = "SomeName";

        r.addIntentWithLanguageModel(Settings.LuisValidIntentId, lm, intentName);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.IntentRecognitionResult) => {
                const res: sdk.IntentRecognitionResult = p2;
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(res.reason).toEqual(sdk.ResultReason.RecognizedIntent);
                expect(res.intentId).toEqual(intentName);
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                ValidateResultMatchesWaveFile(res);
                done();
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("Add All Intents", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Add All Intents");

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromAppId(Settings.LuisAppId);

        r.addAllIntents(lm);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.IntentRecognitionResult) => {
                const res: sdk.IntentRecognitionResult = p2;
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedIntent]);
                expect(res.intentId).toEqual(Settings.LuisValidIntentId);
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                ValidateResultMatchesWaveFile(res);
                expect(res.properties.getProperty(sdk.PropertyId.LanguageUnderstandingServiceResponse_JsonResult)).not.toBeUndefined();
                done();
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("Add All Intents with alias", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Add All Intents with alias");

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile();
        objsToClose.push(r);

        const lm: sdk.LanguageUnderstandingModel = sdk.LanguageUnderstandingModel.fromAppId(Settings.LuisAppId);

        r.addAllIntents(lm, "alias");

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync(
            (p2: sdk.IntentRecognitionResult) => {
                const res: sdk.IntentRecognitionResult = p2;
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedIntent]);
                expect(res.intentId).toEqual("alias");
                expect(res.properties).not.toBeUndefined();
                expect(res.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

                ValidateResultMatchesWaveFile(res);
                done();
            },
            (error: string) => {
                done.fail(error);
            });
    });

    test("Audio Config is optional", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Audio Config is optional");

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);
        expect(s).not.toBeUndefined();
        s.speechRecognitionLanguage = "en-US";

        const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s);
        objsToClose.push(r);
        expect(r instanceof sdk.Recognizer).toEqual(true);
    });

    test("Default mic is used when audio config is not specified.", () => {
        // tslint:disable-next-line:no-console
        console.info("Name: Default mic is used when audio config is not specified.");

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        expect(s).not.toBeUndefined();
        s.speechRecognitionLanguage = "en-US";

        let r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s);
        expect(r instanceof sdk.Recognizer).toEqual(true);
        // Node.js doesn't have a microphone natively. So we'll take the specific message that indicates that microphone init failed as evidence it was attempted.
        r.recognizeOnceAsync(() => fail("RecognizeOnceAsync returned success when it should have failed"),
            (error: string): void => {
                expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
            });

        r = new sdk.IntentRecognizer(s);

        r.startContinuousRecognitionAsync(() => fail("startContinuousRecognitionAsync returned success when it should have failed"),
            (error: string): void => {
                expect(error).toEqual("Error: Browser does not support Web Audio API (AudioContext is not available).");
            });
    });

    test("Connection Errors Propogate Async", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Connection Errors Propogate Async");

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("badKey", Settings.SpeechRegion);
        objsToClose.push(s);

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile(s);

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs) => {
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

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        let doneCount: number = 0;
        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1006");
                doneCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.IntentRecognitionResult) => {
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

    // Bing Speech does not behave the same as Unified Speech for a bad language. It closes the connection far more gracefully.
    test.skip("RecognizeOnce Bad Language", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: RecognizeOnce Bad Language");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "BadLanguage";

        const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);
        let doneCount: number = 0;

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1007");
                doneCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.IntentRecognitionResult) => {
            try {
                const e: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                expect(e.errorDetails).toContain("1007");
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

        const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let noMatchCount: number = 0;
        let speechEnded: number = 0;
        let inTurn = false;
        let canceled: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs) => {
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

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
                canceled = true;
            } catch (error) {
                done.fail(error);
            }
        };

        let sessionDone = false;
        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            sessionDone = true;
        };

        r.speechEndDetected = (o: sdk.Recognizer, e: sdk.RecognitionEventArgs): void => {
            speechEnded++;
        };

        r.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            inTurn = true;
        });

        r.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            inTurn = false;
        });

        r.startContinuousRecognitionAsync(() => { },
            (err: string) => {
                done.fail(err);
            });

        WaitForCondition(() => (canceled && !inTurn), () => {
            r.stopContinuousRecognitionAsync(() => {
                try {
                    expect(speechEnded).toEqual(noMatchCount + 1); // +1 for the end of the valid speech.
                    expect(noMatchCount).toEqual(7); // 5 seconds for intent based reco.
                    done();
                } catch (error) {
                    done.fail(error);
                }

            }, (error: string) => {
                done.fail(error);
            });
        });

    }, 35000);

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

        const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let noMatchCount: number = 0;
        let speechEnded: number = 0;
        let canceled: boolean = false;
        let inTurn: boolean = false;

        r.recognized = (o: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs) => {
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

        r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
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

        r.startContinuousRecognitionAsync(() => { },
            (err: string) => {
                done.fail(err);
            });

        WaitForCondition(() => (canceled && !inTurn), () => {
            try {
                expect(speechEnded).toEqual(noMatchCount + 1);
                expect(noMatchCount).toEqual(6); // 5 seconds for intent based reco.
            } catch (error) {
                done.fail(error);
            }

            r.stopContinuousRecognitionAsync(() => {
                done();
            }, (error: string) => {
                done.fail(error);
            });
        });

    }, 35000);
});

test("Ambiguous Speech default as expected", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Ambiguous Speech default as expected");

    const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.IntentRecognitionResult) => {

            const res: sdk.IntentRecognitionResult = p2;
            expect(res.errorDetails).toBeUndefined();
            expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
            expect(res).not.toBeUndefined();
            expect(res.text).toEqual("Recognize speech.");
            done();
        },
        (error: string) => {
            done.fail(error);
        });
});

test.skip("Phraselist assists speech Reco.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Phraselist assists speech Reco.");

    const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    const phraseList: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    phraseList.addPhrase("Wreck a nice beach.");

    r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.IntentRecognitionResult) => {

            const res: sdk.IntentRecognitionResult = p2;
            expect(res.errorDetails).toBeUndefined();
            expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
            expect(res).not.toBeUndefined();
            expect(res.text).toEqual("Wreck a nice beach.");
            done();
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

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let recoCount: number = 0;
    let phraseAdded: boolean = true;
    const dynamicPhrase: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    dynamicPhrase.addPhrase("Wreck a nice beach.");

    r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.IntentRecognitionEventArgs): void => {
        try {
            const res: sdk.IntentRecognitionResult = e.result;
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

test.skip("Phraselist extra phraselists have no effect.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Phraselist extra phraselists have no effect.");

    const r: sdk.IntentRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    const phraseList: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    phraseList.addPhrase("Wreck a nice beach.");
    phraseList.addPhrase("Escaped robot fights for his life, film at 11.");

    r.canceled = (o: sdk.Recognizer, e: sdk.IntentRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        (p2: sdk.IntentRecognitionResult) => {

            const res: sdk.IntentRecognitionResult = p2;
            expect(res.errorDetails).toBeUndefined();
            expect(res.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
            expect(res).not.toBeUndefined();
            expect(res.text).toEqual("Wreck a nice beach.");
            done();
        },
        (error: string) => {
            done.fail(error);
        });
});
