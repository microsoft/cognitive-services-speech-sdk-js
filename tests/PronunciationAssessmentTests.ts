// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    PronunciationAssessmentGradingSystem,
    PronunciationAssessmentGranularity
} from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
    WebsocketMessageAdapter
} from "../src/common.browser/Exports";
import {
    Events,
} from "../src/common/Exports";
import { Settings } from "./Settings";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


let objsToClose: any[];

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
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechConfig, audioFileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, audioFileName?: string): sdk.SpeechRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const fileName: string = undefined === audioFileName ? Settings.LuisWaveFile : audioFileName;
    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName);

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
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_Region, Settings.SpeechRegion);
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

test("testPronunciationAssessmentConfig::normal", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: testPronunciationAssessmentConfig:::normal");
    let pronConfig: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig("reference");
    let j = JSON.parse(pronConfig.toJSON());
    expect(j.referenceText).toEqual("reference");
    expect(j.gradingSystem).toEqual("FivePoint");
    expect(j.granularity).toEqual("Phoneme");
    expect(j.dimension).toEqual("Comprehensive");
    expect(j.scenarioId).toBeUndefined();

    pronConfig = new sdk.PronunciationAssessmentConfig("reference",
        PronunciationAssessmentGradingSystem.HundredMark,
        PronunciationAssessmentGranularity.Word, true);
    pronConfig.referenceText = "new reference";
    j = JSON.parse(pronConfig.toJSON());
    expect(j.referenceText).toEqual("new reference");
    expect(j.gradingSystem).toEqual("HundredMark");
    expect(j.granularity).toEqual("Word");
    expect(j.dimension).toEqual("Comprehensive");
    expect(j.enableMiscue).toBeTruthy();

    pronConfig = new sdk.PronunciationAssessmentConfig("reference",
        PronunciationAssessmentGradingSystem.HundredMark,
        PronunciationAssessmentGranularity.FullText, true);
    j = JSON.parse(pronConfig.toJSON());
    expect(j.gradingSystem).toEqual("HundredMark");
    expect(j.granularity).toEqual("FullText");
    expect(j.dimension).toEqual("Comprehensive");
    expect(j.enableMiscue).toBeTruthy();

    pronConfig.phonemeAlphabet = "ipa";
    pronConfig.nbestPhonemeCount = 5;
    j = JSON.parse((pronConfig.toJSON()));
    expect(j.phonemeAlphabet).toEqual("ipa");
    expect(j.nbestPhonemeCount).toEqual(5);

    done();
});

test("testPronunciationAssessmentConfig::fromJson", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: testPronunciationAssessmentConfig::fromJson");
    const jsonString = `{"dimension": "Comprehensive", "enableMiscue": false, "key": "value"}`;
    const pronConfig = sdk.PronunciationAssessmentConfig.fromJSON(jsonString);
    expect(JSON.parse(pronConfig.toJSON())).toEqual(JSON.parse(jsonString));
    done();
});

describe.each([true, false])("Service based tests", (forceNodeWebSocket: boolean): void => {

    beforeAll((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("test Pronunciation Assessment with reference text", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: test Pronunciation Assessment with reference text");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s, Settings.WaveFile);
        objsToClose.push(r);

        const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(Settings.WaveFileText,
            PronunciationAssessmentGradingSystem.HundredMark, PronunciationAssessmentGranularity.Phoneme, false);
        objsToClose.push(p);
        p.applyTo(r);

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
                const jsonString = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
                expect(jsonString).not.toBeUndefined();
                const jsonResult = JSON.parse(jsonString);
                expect(jsonResult.SNR).toBeGreaterThan(0);
                const pronResult = sdk.PronunciationAssessmentResult.fromResult(result);
                expect(pronResult).not.toBeUndefined();
                expect(pronResult.detailResult).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Word).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Phonemes[0].Phoneme).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Syllables[0].Syllable).not.toBeUndefined();
                expect(pronResult.pronunciationScore).toBeGreaterThan(0);
                expect(pronResult.accuracyScore).toBeGreaterThan(0);
                expect(pronResult.fluencyScore).toBeGreaterThan(0);
                expect(pronResult.completenessScore).toBeGreaterThan(0);
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    });

    test("test Pronunciation Assessment with miscue enabled", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: test Pronunciation Assessment with miscue enabled");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s, Settings.WaveFile);
        objsToClose.push(r);

        const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(Settings.WaveFileText + " buddy",
            PronunciationAssessmentGradingSystem.HundredMark, PronunciationAssessmentGranularity.Phoneme, true);
        objsToClose.push(p);
        p.applyTo(r);

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
                const jsonString = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
                expect(jsonString).not.toBeUndefined();
                const jsonResult = JSON.parse(jsonString);
                expect(jsonResult.SNR).toBeGreaterThan(0);
                const pronResult = sdk.PronunciationAssessmentResult.fromResult(result);
                expect(pronResult).not.toBeUndefined();
                expect(pronResult.detailResult).not.toBeUndefined();
                expect(pronResult.detailResult.Words[4].Word).not.toBeUndefined();
                expect(pronResult.detailResult.Words[4].PronunciationAssessment.ErrorType).toEqual("Omission")
                expect(pronResult.pronunciationScore).toBeGreaterThan(0);
                expect(pronResult.accuracyScore).toBeGreaterThan(0);
                expect(pronResult.fluencyScore).toBeGreaterThan(0);
                expect(pronResult.completenessScore).toBeGreaterThan(0);
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    });

    test("test Pronunciation Assessment without reference text", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: test Pronunciation Assessment without reference text");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s, Settings.WaveFile);
        objsToClose.push(r);

        const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig("");
        objsToClose.push(p);
        p.applyTo(r);

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
                const pronResult = sdk.PronunciationAssessmentResult.fromResult(result);
                expect(pronResult).not.toBeUndefined();
                expect(pronResult.detailResult).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Word).not.toBeUndefined();
                expect(pronResult.pronunciationScore).toBeGreaterThan(0);
                expect(pronResult.accuracyScore).toBeGreaterThan(0);
                expect(pronResult.fluencyScore).toBeGreaterThan(0);
                expect(pronResult.completenessScore).toBeGreaterThan(0);
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    });

    test("test Pronunciation Assessment with ipa phoneme set", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: test Pronunciation Assessment with ipa phoneme set");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s, Settings.WaveFile);
        objsToClose.push(r);

        const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(Settings.WaveFileText,
            PronunciationAssessmentGradingSystem.HundredMark, PronunciationAssessmentGranularity.Phoneme, true);
        objsToClose.push(p);
        p.phonemeAlphabet = "IPA";
        p.nbestPhonemeCount = 5;
        p.applyTo(r);

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
                const jsonString = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
                expect(jsonString).not.toBeUndefined();
                const jsonResult = JSON.parse(jsonString);
                expect(jsonResult.SNR).toBeGreaterThan(0);
                const pronResult = sdk.PronunciationAssessmentResult.fromResult(result);
                expect(pronResult).not.toBeUndefined();
                expect(pronResult.detailResult).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Word).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Phonemes[0].Phoneme).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Phonemes[0].Phoneme).toEqual("w");
                expect(pronResult.detailResult.Words[0].Phonemes[0].PronunciationAssessment.NBestPhonemes[0].Phoneme).not.toBeUndefined();
                expect(pronResult.detailResult.Words[0].Syllables[0].Syllable).not.toBeUndefined();
                expect(pronResult.pronunciationScore).toBeGreaterThan(0);
                expect(pronResult.accuracyScore).toBeGreaterThan(0);
                expect(pronResult.fluencyScore).toBeGreaterThan(0);
                expect(pronResult.completenessScore).toBeGreaterThan(0);
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    });

    test("test Pronunciation Assessment with prosody and content", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: test Pronunciation Assessment with prosody and content");
        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s, Settings.WaveFile);
        objsToClose.push(r);

        const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(Settings.WaveFileText,
            PronunciationAssessmentGradingSystem.HundredMark, PronunciationAssessmentGranularity.Phoneme, true);
        objsToClose.push(p);
        p.enableProsodyAssessment = true;
        p.enableContentAssessmentWithTopic("greetings");
        p.applyTo(r);

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
                const jsonString = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
                expect(jsonString).not.toBeUndefined();
                const jsonResult = JSON.parse(jsonString);
                expect(jsonResult.SNR).toBeGreaterThan(0);
                const pronResult = sdk.PronunciationAssessmentResult.fromResult(result);
                expect(pronResult).not.toBeUndefined();
                expect(pronResult.pronunciationScore).toBeGreaterThan(0);
                expect(pronResult.accuracyScore).toBeGreaterThan(0);
                expect(pronResult.fluencyScore).toBeGreaterThan(0);
                expect(pronResult.completenessScore).toBeGreaterThan(0);
                expect(pronResult.prosodyScore).toBeGreaterThan(0);
                expect(pronResult.contentAssessmentResult).not.toBeUndefined();
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string) => {
            done(error);
        });
    });

    // Disable until Yulin can correct this
    test.skip("Continuous pronunciation assessment with content", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Continuous pronunciation assessment with content");
        const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(undefined, Settings.PronunciationFallWaveFile);
        objsToClose.push(r);

        const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig("",
            PronunciationAssessmentGradingSystem.HundredMark, PronunciationAssessmentGranularity.Phoneme, true);
        objsToClose.push(p);
        p.enableProsodyAssessment = true;
        p.enableContentAssessmentWithTopic("greetings");
        p.applyTo(r);

        let sessionStopped: boolean = false;

        const pronunciationAssessmentResults: sdk.PronunciationAssessmentResult[] = [];

        r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
            pronunciationAssessmentResults.push(sdk.PronunciationAssessmentResult.fromResult(e.result));
        };

        r.sessionStopped = (o: sdk.Recognizer, e: sdk.SessionEventArgs) => {
            sessionStopped = true;
        };

        r.startContinuousRecognitionAsync();

        WaitForCondition(() => sessionStopped, () => {
            try {
                expect(pronunciationAssessmentResults.length).toBeGreaterThan(2);
                const firstResult = pronunciationAssessmentResults[0];
                expect(firstResult).not.toBeUndefined();
                expect(firstResult.prosodyScore).toBeGreaterThan(0);
                expect(firstResult.contentAssessmentResult).toBeUndefined();
                const lastResult = pronunciationAssessmentResults[pronunciationAssessmentResults.length - 1];
                expect(lastResult).not.toBeUndefined();
                expect(lastResult.prosodyScore).toBeUndefined();
                expect(lastResult.contentAssessmentResult).not.toBeUndefined();
                expect(lastResult.contentAssessmentResult.grammarScore).toBeGreaterThan(0);
                expect(lastResult.contentAssessmentResult.vocabularyScore).toBeGreaterThan(0);
                expect(lastResult.contentAssessmentResult.topicScore).toBeGreaterThan(0);
                done();
            } catch (error) {
                done(error);
            }
        });
    }, 60000);
});
