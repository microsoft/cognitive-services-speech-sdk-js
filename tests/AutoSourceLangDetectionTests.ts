// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

//
// Test Settings
//
// Mandatory settings that do not have default values in Settings.ts. You must define them
// before running the test (see README.md).
//   Settings.SpeechSubscriptionKey
//   Settings.SpeechRegion
//
// Mandatory settings that have defaults in Settings.ts. You do not need to define them.
//   Settings.WaveFile
//   Settings.WaveFileText
//
// Optional settings for this test. They do not have default values.
//   Settings.SpeechEndpoint
//   Settings.proxyServer
//   Settings.proxyPort
//

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { Events, EventType } from "../src/common/Exports";

import { Settings } from "./Settings";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

beforeAll((): void => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
    jest.setTimeout(12000);
});

afterEach(async (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
    done();
});

export const BuildRecognizer: (speechConfig?: sdk.SpeechConfig, autoConfig?: sdk.AutoDetectSourceLanguageConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, autoConfig?: sdk.AutoDetectSourceLanguageConfig, fileName?: string): sdk.SpeechRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }
    let a: sdk.AutoDetectSourceLanguageConfig = autoConfig;
    if (a === undefined) {
        a = BuildAutoConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(a);
    }

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);

    const r: sdk.SpeechRecognizer = sdk.SpeechRecognizer.FromConfig(s, a, config);
    expect(r).not.toBeUndefined();

    return r;
};

export const BuildRecognizerFromPushStream: (speechConfig: sdk.SpeechConfig, audioConfig: sdk.AudioConfig, autoConfig?: sdk.AutoDetectSourceLanguageConfig) => sdk.SpeechRecognizer = (speechConfig: sdk.SpeechConfig, audioConfig: sdk.AudioConfig, autoConfig?: sdk.AutoDetectSourceLanguageConfig): sdk.SpeechRecognizer => {
    let a: sdk.AutoDetectSourceLanguageConfig = autoConfig;
    if (a === undefined) {
        a = BuildAutoConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(a);
    }
    const r: sdk.SpeechRecognizer = sdk.SpeechRecognizer.FromConfig(speechConfig, a, audioConfig);
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

const BuildAutoConfig: (s?: sdk.SourceLanguageConfig[]) => sdk.AutoDetectSourceLanguageConfig = (s?: sdk.SourceLanguageConfig[]): sdk.AutoDetectSourceLanguageConfig => {
    let a: sdk.AutoDetectSourceLanguageConfig;
    if ((s === undefined) || (s.length < 1)) {
        const languages: string[] = ["en-US", "de-DE", "fr-FR"];
        a = sdk.AutoDetectSourceLanguageConfig.fromLanguages(languages);
    } else {
        a = sdk.AutoDetectSourceLanguageConfig.fromSourceLanguageConfigs(s);
    }

    expect(a).not.toBeUndefined();
    return a;
};

const BuildSourceLanguageConfigs: () => sdk.SourceLanguageConfig[] = (): sdk.SourceLanguageConfig[] => {
    const s1: sdk.SourceLanguageConfig = sdk.SourceLanguageConfig.fromLanguage("en-US");
    expect(s1).not.toBeUndefined();
    const s2: sdk.SourceLanguageConfig = sdk.SourceLanguageConfig.fromLanguage("de-DE", "otherEndpointId");
    expect(s2).not.toBeUndefined();
    return [s1, s2];
};

describe.each([true, false])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("testGetAutoDetectSourceLanguage", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testGetAutoDetectSourceLanguage");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizer(s);
        objsToClose.push(r);

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
                const autoDetectResult: sdk.AutoDetectSourceLanguageResult = sdk.AutoDetectSourceLanguageResult.fromResult(result);
                expect(autoDetectResult).not.toBeUndefined();
                expect(autoDetectResult.language).not.toBeUndefined();
                expect(autoDetectResult.languageDetectionConfidence).not.toBeUndefined();

                done();
            } catch (error) {
                done.fail(error);
            }
        }, (error: string) => {
            done.fail(error);
        });
    });

    test("testRecognizeFromSourceLanguageConfig", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testRecognizeFromSourceLanguageConfig");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        objsToClose.push(a);

        const r: sdk.SpeechRecognizer = BuildRecognizer(s, a);
        objsToClose.push(r);

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
                expect(result.language).not.toBeUndefined();
                expect(result.languageDetectionConfidence).not.toBeUndefined();
                const autoDetectResult: sdk.AutoDetectSourceLanguageResult = sdk.AutoDetectSourceLanguageResult.fromResult(result);
                expect(autoDetectResult).not.toBeUndefined();
                expect(autoDetectResult.language).not.toBeUndefined();
                expect(autoDetectResult.languageDetectionConfidence).not.toBeUndefined();

                done();
            } catch (error) {
                done.fail(error);
            }
        }, (error: string) => {
            done.fail(error);
        });
    });

    test("Silence After Speech - AutoDetect set", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Silence After Speech - AutoDetect set");
        // Pump valid speech and then silence until at least one speech end cycle hits.
        const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const bigFileBuffer: Uint8Array = new Uint8Array(32 * 1024 * 30); // ~30 seconds.
        const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        p.write(WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile));
        p.write(bigFileBuffer.buffer);
        p.close();

        const r: sdk.SpeechRecognizer = BuildRecognizerFromPushStream(s, config);
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
                    speechEnded--;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                    expect(e.result.properties).not.toBeUndefined();
                    expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                    expect(e.result.language).not.toBeUndefined();
                    expect(e.result.languageDetectionConfidence).not.toBeUndefined();
                    const autoDetectResult: sdk.AutoDetectSourceLanguageResult = sdk.AutoDetectSourceLanguageResult.fromResult(e.result);
                    expect(autoDetectResult).not.toBeUndefined();
                    expect(autoDetectResult.language).not.toBeUndefined();
                    expect(autoDetectResult.languageDetectionConfidence).not.toBeUndefined();
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
                        expect(noMatchCount).toBeGreaterThanOrEqual(2);
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

    test("testAddLIDCustomModels", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testAddLIDCustomModels");

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        objsToClose.push(a);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        const r: sdk.SpeechRecognizer = BuildRecognizer(s, a);
        objsToClose.push(r);

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message = JSON.parse(args.message.TextMessage);
                try {
                    expect(message.phraseDetection).not.toBeUndefined();
                    expect(message.phraseDetection.onInterim).not.toBeUndefined();
                    expect(message.phraseDetection.onSuccess).not.toBeUndefined();
                    expect(message.phraseDetection.onInterim.action).not.toBeUndefined();
                    expect(message.phraseDetection.onSuccess.action).not.toBeUndefined();
                    expect(message.phraseDetection.onInterim.action).toEqual("None");
                    expect(message.phraseDetection.onSuccess.action).toEqual("None");
                    expect(message.phraseDetection.onSuccess.action).toEqual("None");
                    expect(message.phraseDetection.customModels).not.toBeUndefined();
                    expect(message.phraseDetection.customModels[0]).not.toBeUndefined();
                    expect(message.phraseDetection.customModels[0].language).toEqual("en-US");
                    expect(message.phraseDetection.customModels[0].endpoint).toEqual("");
                    expect(message.phraseDetection.customModels[1]).not.toBeUndefined();
                    expect(message.phraseDetection.customModels[1].language).toEqual("de-DE");
                    expect(message.phraseDetection.customModels[1].endpoint).toEqual("otherEndpointId");
                    done();
                } catch (error) {
                    done.fail(error);
                }
            }
        };

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
            } catch (error) {
                done.fail(error);
            }
        }, (error: string) => {
            done.fail(error);
        });
    }, 10000);

    test("testContinuousLIDSpeechReco", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testContinuousLIDSpeechReco");

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        a.mode = sdk.LanguageIdMode.Continuous;
        objsToClose.push(a);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        const r: sdk.SpeechRecognizer = BuildRecognizer(s, a);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let speechContextSent: boolean = false;

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message = JSON.parse(args.message.TextMessage);
                try {
                    expect(message.languageId).not.toBeUndefined();
                    expect(message.languageId.mode).not.toBeUndefined();
                    expect(message.languageId.mode).toEqual("DetectContinuous");
                    expect(message.languageId.Priority).not.toBeUndefined();
                    expect(message.languageId.Priority).toEqual("PrioritizeLatency");
                    speechContextSent = true;
                } catch (error) {
                    done.fail(error);
                }
            }
        };

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            try {
                if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
                    expect(speechRecognized).toEqual(false);
                    speechRecognized = true;
                    expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                    expect(e.result.text).toEqual("What's the weather like?");
                    expect(e.result.properties).not.toBeUndefined();
                    expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                    expect(speechRecognized).toEqual(true);
                }
            } catch (error) {
                done.fail(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (speechContextSent), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
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
});
