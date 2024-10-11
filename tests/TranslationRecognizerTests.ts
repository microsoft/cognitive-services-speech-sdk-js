// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
    WebsocketMessageAdapter,
} from "../src/common.browser/Exports";
import {
    Events,
} from "../src/common/Exports";

import { Settings } from "./Settings";
import {
    closeAsyncObjects,
    WaitForCondition
} from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


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

const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechTranslationConfig, fileName?: string) => sdk.TranslationRecognizer = (speechConfig?: sdk.SpeechTranslationConfig, fileName?: string): sdk.TranslationRecognizer => {

    let s: sdk.SpeechTranslationConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);

    const language: string = Settings.WaveFileLanguage;
    if (s.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_RecoLanguage]) === undefined) {
        s.speechRecognitionLanguage = language;
    }
    s.addTargetLanguage("de-DE");

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
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

test("GetTargetLanguages", () => {
    // eslint-disable-next-line no-console
    console.info("Name: GetTargetLanguages");
    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    expect(r.targetLanguages).not.toBeUndefined();
    expect(r.targetLanguages).not.toBeNull();
    expect(r.targetLanguages.length).toEqual(1);
    expect(r.targetLanguages[0]).toEqual(r.properties.getProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages]));
});

test.skip("GetOutputVoiceNameNoSetting", () => {
    // eslint-disable-next-line no-console
    console.info("Name: GetOutputVoiceNameNoSetting");
    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);
    expect(r.voiceName).not.toBeUndefined();
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

    test("Translate Multiple Targets", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Translate Multiple Targets");
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.addTargetLanguage("fr-FR");

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };

        r.recognizeOnceAsync(
            (res: sdk.TranslationRecognitionResult) => {
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                expect("Wie ist das Wetter?").toEqual(res.translations.get("de", ""));
                expect(res.translations.get("fr", "")).toContain("Quel temps fait-il");
                expect(res.translations.languages).toEqual(["fr", "de"]);
                expect(r.targetLanguages.length).toEqual(res.translations.languages.length);
                r.removeTargetLanguage("de-DE");
                expect(r.targetLanguages.includes("de-DE")).toBeFalsy();
                r.addTargetLanguage("es-MX");
                expect(r.targetLanguages.includes("es-MX")).toBeTruthy();
                r.recognizeOnceAsync(
                    (secondRes: sdk.TranslationRecognitionResult) => {
                        expect(secondRes).not.toBeUndefined();
                        expect(secondRes.errorDetails).toBeUndefined();
                        expect(sdk.ResultReason[secondRes.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                        expect(secondRes.translations.get("fr", "")).toContain("Quel temps fait-il");
                        expect(secondRes.translations.languages.includes("es")).toBeTruthy();
                        expect(secondRes.translations.languages.includes("fr")).toBeTruthy();
                        expect(secondRes.translations.languages.includes("de")).toBeFalsy();
                        expect("¿Cómo es el clima?").toEqual(secondRes.translations.get("es", ""));
                        done();
                    },
                    (error: string) => {
                        done(error);
                    });
            },
            (error: string) => {
                done(error);
            });
    }, 30000);

    test("Translate Bad Language", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: Translate Bad Language");
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);

        s.addTargetLanguage("zz");

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        expect(r).not.toBeUndefined();

        expect(r instanceof sdk.Recognizer).toEqual(true);

        r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs) => {
            try {
                if (e.result.reason === sdk.ResultReason.Canceled) {
                    done(sdk.ResultReason[e.result.reason]);
                }
            } catch (error) {
                done(error);
            }
        });

        r.recognizeOnceAsync(
            (res: sdk.TranslationRecognitionResult) => {
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).not.toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(res.text).toEqual("What's the weather like?");
                done();
            },
            (error: string) => {
                done(error);
            });
    });

    test("RecognizeOnce Bad Language", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: RecognizeOnce Bad Language");
        const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "BadLanguage";
        s.addTargetLanguage("en-US");

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);
        let doneCount: number = 0;

        r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
            try {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.errorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.BadRequestParameters]);
                expect(e.errorDetails).toContain("1007");
                doneCount++;
            } catch (error) {
                done(error);
            }
        };

        r.recognizeOnceAsync((result: sdk.TranslationRecognitionResult) => {
            try {
                const e: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[e.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.BadRequestParameters]);
                expect(e.errorDetails).toContain("1007");
                doneCount++;
            } catch (error) {
                done(error);
            }
        });

        WaitForCondition(() => (doneCount === 2), done);
    }, 15000);

    test("fromEndPoint with Subscription key", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: fromEndPoint with Subscription key");

        const endpoint = "wss://" + Settings.SpeechRegion + ".s2s.speech.microsoft.com/speech/translation/cognitiveservices/v1";

        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromEndpoint(new URL(endpoint), Settings.SpeechSubscriptionKey);
        objsToClose.push(s);

        s.addTargetLanguage("de-DE");
        s.speechRecognitionLanguage = "en-US";
        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        r.canceled = (o: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
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
                done();
            },
            (error: string) => {
                done(error);
            });
    }, 12000);

    test("fromV2EndPoint with Subscription key", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: fromV2EndPoint with Subscription key");

        const targetLanguage = "de-DE";
        const endpoint = `wss://${Settings.SpeechRegion}.stt.speech.microsoft.com/speech/universal/v2`;

        const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromEndpoint(new URL(endpoint), Settings.SpeechSubscriptionKey);
        objsToClose.push(s);

        s.addTargetLanguage(targetLanguage);
        s.speechRecognitionLanguage = "en-US";

        const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        r.canceled = (o: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done(error);
            }
        };
        r.recognizeOnceAsync(
            (res: sdk.TranslationRecognitionResult) => {
                expect(res).not.toBeUndefined();
                expect(res.errorDetails).toBeUndefined();
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.TranslatedSpeech]);
                expect(res.translations.get(targetLanguage, undefined) !== undefined).toEqual(true);
                expect("Wie ist das Wetter?").toEqual(res.translations.get(targetLanguage, ""));
                expect(res.text).toEqual("What's the weather like?");
                done();
            },
            (error: string) => {
                done(error);
            });
    }, 12000);
});
