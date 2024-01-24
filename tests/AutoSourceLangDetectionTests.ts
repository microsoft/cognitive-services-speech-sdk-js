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
import { Events } from "../src/common/Exports";

import { Settings } from "./Settings";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


let objsToClose: any[];
const defaultTargetLanguage: string = "de-DE";

beforeAll((): void => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
    jest.setTimeout(12000);
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
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

export const BuildTranslationRecognizer: (speechTranslationConfig?: sdk.SpeechTranslationConfig, autoConfig?: sdk.AutoDetectSourceLanguageConfig, fileName?: string) => sdk.TranslationRecognizer = (speechTranslationConfig?: sdk.SpeechTranslationConfig, autoConfig?: sdk.AutoDetectSourceLanguageConfig, fileName?: string): sdk.TranslationRecognizer => {

    let s: sdk.SpeechTranslationConfig = speechTranslationConfig;
    if (s === undefined) {
        s = BuildSpeechTranslationConfig();
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

    const language: string = Settings.WaveFileLanguage;
    if (s.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage]) === undefined) {
        s.speechRecognitionLanguage = language;
    }
    s.addTargetLanguage(defaultTargetLanguage);

    const r: sdk.TranslationRecognizer = sdk.TranslationRecognizer.FromConfig(s, a, config);
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
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_Region, Settings.SpeechRegion);
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

const BuildSpeechTranslationConfig: () => sdk.SpeechTranslationConfig = (): sdk.SpeechTranslationConfig => {

    let s: sdk.SpeechTranslationConfig;
    if (undefined === Settings.SpeechEndpoint) {
        s = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    } else {
        s = sdk.SpeechTranslationConfig.fromEndpoint(new URL(Settings.SpeechEndpoint), Settings.SpeechSubscriptionKey);
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
        const languages: string[] = ["de-DE", "fr-FR", "en-US"];
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

    beforeAll((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("testGetAutoDetectSourceLanguage", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testGetAutoDetectSourceLanguage");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizer(s);
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult): void => {
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
                done(error as string);
            }
        }, (error: string): void => {
            done(error);
        });
    }); // testGetAutoDetectSourceLanguage

    test("testRecognizeOnceFromSourceLanguageConfig", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
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
                done(error);
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
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    }); // testRecognizeOnceFromSourceLanguageConfig

    // For review: v2 service appears to be responding to silence after speech
    // with Recognized result that has empty text. Expected? 
    // TODO: Disabled for v1.32 release, investigate
    test.skip("Silence After Speech - AutoDetect set", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
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
        let emptyTextRecognizedCount: number = 0;
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
    }, 30000); // testSilenceAfterSpeechAutoDetectSet

    test("testAddLIDCustomModels", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: testAddLIDCustomModels");

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        objsToClose.push(a);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);
        const r: sdk.SpeechRecognizer = BuildRecognizer(s, a);
        objsToClose.push(r);

        expect(a.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode)).toEqual("AtStart");

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message = JSON.parse(args.message.TextMessage);
                try {
                    expect(message.languageId).not.toBeUndefined();
                    expect(message.languageId.mode).not.toBeUndefined();
                    expect(message.languageId.mode).toEqual("DetectAtAudioStart");
                    expect(message.languageId.Priority).not.toBeUndefined();
                    expect(message.languageId.Priority).toEqual("PrioritizeLatency");
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
                    done(error);
                }
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
            try {
                expect(result).not.toBeUndefined();
                expect(result.text).toEqual(Settings.WaveFileText);
                expect(result.properties).not.toBeUndefined();
                expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    }, 10000); // testAddLIDCustomModels


    test("testTransationContinuousRecoWithContinuousLID", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: testTransationContinuousRecoWithContinuousLID");

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        a.mode = sdk.LanguageIdMode.Continuous;

        expect(a.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode)).toEqual("Continuous");

        objsToClose.push(a);

        const s: sdk.SpeechTranslationConfig = BuildSpeechTranslationConfig();
        const segSilenceTimeoutMs = 1100;
        s.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, segSilenceTimeoutMs.toString());
        objsToClose.push(s);

        const r: sdk.TranslationRecognizer = BuildTranslationRecognizer(s, a);
        objsToClose.push(r);

        let speechTranslated: boolean = false;
        let speechContextSent: boolean = false;

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);
        const expectedRecognitionMode = "CONVERSATION";
        const segmentationField = "segmentation";

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message = JSON.parse(args.message.TextMessage);
                try {
                    expect(message.languageId).not.toBeUndefined();
                    expect(message.languageId.mode).not.toBeUndefined();
                    expect(message.languageId.mode).toEqual("DetectContinuous");
                    expect(message.languageId.Priority).not.toBeUndefined();
                    expect(message.languageId.Priority).toEqual("PrioritizeLatency");
                    expect(message.phraseDetection.mode).toEqual(expectedRecognitionMode);
                    expect(message.phraseDetection[expectedRecognitionMode][segmentationField].segmentationSilenceTimeoutMs).toEqual(segSilenceTimeoutMs);
                    speechContextSent = true;
                } catch (error) {
                    done(error);
                }
            }
        };

        r.recognizing = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            expect(e.result).not.toBeUndefined();
            expect(e.result.text).toContain("what's the");
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            expect(e.result.translations).not.toBeUndefined();
            expect(e.result.translations.languages[0]).toEqual(defaultTargetLanguage);
            expect(e.result.translations.get(defaultTargetLanguage)).toContain("Wie ist das");
            expect(e.result.language).not.toBeUndefined();
            expect(e.result.language).toEqual("en-US");
        }

        r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs) => {
            try {
                if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
                    expect(speechTranslated).toEqual(false);
                    speechTranslated = true;
                    expect(e.result.text).toEqual("What's the weather like?");
                    expect(e.result.properties).not.toBeUndefined();
                    expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                    expect(e.result.translations).not.toBeUndefined();
                    expect(e.result.translations.languages[0]).toEqual(defaultTargetLanguage);
                    expect(e.result.translations.get(defaultTargetLanguage)).toEqual("Wie ist das Wetter?");
                    const autoDetectResult: sdk.AutoDetectSourceLanguageResult = sdk.AutoDetectSourceLanguageResult.fromResult(e.result);
                    expect(autoDetectResult).not.toBeUndefined();
                    expect(autoDetectResult.language).not.toBeUndefined();
                    expect(autoDetectResult.languageDetectionConfidence).not.toBeUndefined();
                } else if (e.result.reason === sdk.ResultReason.NoMatch) {
                    expect(speechTranslated).toEqual(true);
                }
            } catch (error) {
                done(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (speechContextSent), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
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
    }, 30000); // testTranslationContinuousRecoWithContinuousLID

    // TODO: Update this test to use multilingual WAV file and check for language detection results
    // TODO: Test that the connection URL uses v2 endpoint
    test.skip("testContinuousRecoWithContinuousLID", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: testContinuousRecoWithContinuousLID");

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        a.mode = sdk.LanguageIdMode.Continuous;

        expect(a.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode)).toEqual("Continuous");

        objsToClose.push(a);
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        const segSilenceTimeoutMs = 1100;
        s.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, segSilenceTimeoutMs.toString());
        objsToClose.push(s);
        const r: sdk.SpeechRecognizer = BuildRecognizer(s, a);
        objsToClose.push(r);

        let speechRecognized: boolean = false;
        let speechContextSent: boolean = false;

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);
        const expectedRecognitionMode = "CONVERSATION";
        const segmentationField = "segmentation";

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message = JSON.parse(args.message.TextMessage);
                try {
                    expect(message.languageId).not.toBeUndefined();
                    expect(message.languageId.mode).not.toBeUndefined();
                    expect(message.languageId.mode).toEqual("DetectContinuous");
                    expect(message.languageId.Priority).not.toBeUndefined();
                    expect(message.languageId.Priority).toEqual("PrioritizeLatency");
                    expect(message.phraseDetection.mode).toEqual(expectedRecognitionMode);
                    expect(message.phraseDetection[expectedRecognitionMode][segmentationField].segmentationSilenceTimeoutMs).toEqual(segSilenceTimeoutMs);
                    speechContextSent = true;
                } catch (error) {
                    done(error);
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
                done(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (speechContextSent), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
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
    }, 30000); // testContinuousRecoWithContinuousLID

    test("testContinuousRecoWithAtStartLID", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: testContinuousRecoWithAtStartLID");

        const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
        configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });

        const a: sdk.AutoDetectSourceLanguageConfig = BuildAutoConfig(configs);
        a.mode = sdk.LanguageIdMode.AtStart;

        expect(a.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode)).toEqual("AtStart");

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
                    expect(message.languageId.mode).toEqual("DetectAtAudioStart");
                    expect(message.languageId.Priority).not.toBeUndefined();
                    expect(message.languageId.Priority).toEqual("PrioritizeLatency");
                    speechContextSent = true;
                } catch (error) {
                    done(error);
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
                done(error);
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(() => {
            WaitForCondition(() => (speechContextSent), () => {
                r.stopContinuousRecognitionAsync(() => {
                    try {
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
    }, 30000); // testContinuousRecoWithAtStartLID
});
