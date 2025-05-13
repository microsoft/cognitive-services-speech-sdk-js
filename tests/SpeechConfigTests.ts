// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { log } from "console";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
    WebsocketMessageAdapter,
} from "../src/common.browser/Exports";
import {
    ConnectionStartEvent,
    Events,
    EventType,
    IDetachable,
    PlatformEvent,
} from "../src/common/Exports";
import { createNoDashGuid } from "../src/common/Guid";
import { Settings } from "./Settings";
import { closeAsyncObjects } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


let objsToClose: any[];
beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

const BuildSpeechRecognizerFromWaveFile: (speechConfig: sdk.SpeechConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);
    const language: string = Settings.WaveFileLanguage;
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = language;
    }

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildIntentRecognizerFromWaveFile: (speechConfig: sdk.SpeechConfig, fileName?: string) => sdk.IntentRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.IntentRecognizer => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);

    const language: string = Settings.WaveFileLanguage;
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = language;
    }

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildTranslationRecognizerFromWaveFile: (speechConfig: sdk.SpeechTranslationConfig, fileName?: string) => sdk.TranslationRecognizer = (speechConfig?: sdk.SpeechTranslationConfig, fileName?: string): sdk.TranslationRecognizer => {

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);

    const language: string = Settings.WaveFileLanguage;
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = language;
    }
    speechConfig.addTargetLanguage("en-us");

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildSpeechSynthesizerToFileOutput: (speechConfig: sdk.SpeechConfig, fileName?: string) => sdk.SpeechSynthesizer =
    (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechSynthesizer => {
        const config: sdk.AudioConfig = fileName === undefined ? null : sdk.AudioConfig.fromAudioFileOutput(fileName);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, config);
        expect(s).not.toBeUndefined();

        return s;
    };

test("Null Param Check, both.", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromSubscription(null, null)).toThrowError();
});

test("Null Param Check, Region", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, null)).toThrowError();
});

test("Null Param Check, Key", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromSubscription(null, Settings.SpeechRegion)).toThrowError();
});

test("Valid Params", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    s.close();
});

test("From Endpoint, but null", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromEndpoint(null, null)).toThrowError();
});

test("From Endpoint, endpoint url null", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromEndpoint(null, Settings.SpeechSubscriptionKey)).toThrowError();
});

test("From Endpoint, key null", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromEndpoint(new URL("http://www.example.com"), null)).toThrowError();
});

test.skip("From endpoint, invalid key format.", (): void => {
    expect((): sdk.SpeechConfig => sdk.SpeechConfig.fromEndpoint(new URL("http://www.example.com"), "illegal-subscription")).toThrowError();
});

// TODO use an endpoint that we control so the subscription key is not leaked!
test("From endpoint, valid Params", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL("http://www.example.com"), "Settings.SpeechSubscriptionKey");
    expect(s).not.toBeUndefined();
    s.close();
});

test("TypedParametersAccessibleViaPropBag", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    TestParam((): string => s.authorizationToken, (val: string) => (s.authorizationToken = val), sdk.PropertyId.SpeechServiceAuthorization_Token, s);
    TestParam((): string => s.endpointId, (val: string) => (s.endpointId = val), sdk.PropertyId.SpeechServiceConnection_EndpointId, s);
    TestParam((): string => s.speechRecognitionLanguage, (val: string) => (s.speechRecognitionLanguage = val), sdk.PropertyId.SpeechServiceConnection_RecoLanguage, s);
    TestParam((): string => s.speechSynthesisLanguage, (val: string) => (s.speechSynthesisLanguage = val), sdk.PropertyId.SpeechServiceConnection_SynthLanguage, s);
    TestParam((): string => s.speechSynthesisVoiceName, (val: string) => (s.speechSynthesisVoiceName = val), sdk.PropertyId.SpeechServiceConnection_SynthVoice, s);
});

const TestParam = (getAccess: () => string, setAccess: (val: string) => void, propEnum: sdk.PropertyId, config: sdk.SpeechConfig): void => {
    const testString: string = createNoDashGuid();

    setAccess(testString);
    expect(config.getProperty(sdk.PropertyId[propEnum])).toEqual(testString);
    expect(getAccess()).toEqual(testString);

    const testString2: string = createNoDashGuid();
    config.setProperty(sdk.PropertyId[propEnum], testString2);
    expect(config.getProperty(sdk.PropertyId[propEnum])).toEqual(testString2);
    expect(getAccess()).toEqual(testString2);
};

test("Unset param return default", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const name: string = createNoDashGuid();
    const value: string = createNoDashGuid();

    expect(s.getProperty(name, value)).toEqual(value);
    expect(s.getProperty(name)).toBeUndefined();

    s.close();
});

test("Create Recognizer", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Properties are passed to recognizer", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = createNoDashGuid();
    s.authorizationToken = createNoDashGuid();
    s.endpointId = createNoDashGuid();

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);
    expect(r.authorizationToken).toEqual(s.authorizationToken);
    expect(r.endpointId).toEqual(s.endpointId);
    expect(r.speechRecognitionLanguage).toEqual(s.speechRecognitionLanguage);

    r.close();
    s.close();
});

test("Create SR from AudioConfig", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Null Language Throws", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = null;

    expect((): sdk.SpeechRecognizer => new sdk.SpeechRecognizer(s)).toThrowError();

    s.close();
});

test("Create recognizer with language and audioConfig", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);

    expect(r).not.toBeUndefined();

    s.close();
});

test("Create Intent Recognizer", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s);

    s.close();
});

test("testCreateIntentRecognizerLanguage1", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = null;

    expect((): sdk.IntentRecognizer => new sdk.IntentRecognizer(s)).toThrow();

    s.close();
});

test("Intent Recognizer Success", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-US";

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Intent Recognizer with Wave File.", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-US";

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Intent Recognizer null language Throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recognizer No Target Languages Throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recognizer No Source Language Throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.addTargetLanguage("en-EN");

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog success", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";
    s.addTargetLanguage("en-US");

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Translation Recognizer Null target languages throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);
    s.speechRecognitionLanguage = "illegal";

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Test Translation Recognizer empty target list throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "");

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();
    s.close();
});

test("Translation Null voice value throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "illegal");
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);
    s.speechRecognitionLanguage = "en-EN";

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recognizer success.", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "en-US");
    s.speechRecognitionLanguage = "en-EN";

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Translation Recog Nul via prop set for targets", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);

    expect((): void => s.speechRecognitionLanguage = null).toThrow();

    s.close();
});

test("Translation Recog Null via propset voice and targets", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog Null via propset voice and targets with Language", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog with empty targets via prop", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "");
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog, Null voice via prop throws", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "en-US");
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect((): sdk.TranslationRecognizer => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog success", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "en-US");
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], "en-US");

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("testClose", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    s.close();
});

test("bad segmentation silence value", (done: jest.DoneCallback): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    s.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "150000000");
    const a: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
    objsToClose.push(r);

    r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
        try {
            expect(e).not.toBeUndefined();
            expect(e.errorDetails).not.toBeUndefined();
            expect(e.errorDetails).toContain("1007");
            done();
        } catch (error) {
            done(error);
        }
    });
}, 30000);

describe("NPM proxy test", (): void => {

    afterEach((): void => {
        // Reset the WebSocket test hook to browser.
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    // Require manual setup of a proxy server.
    test.skip("valid proxy set", (done: jest.DoneCallback): void => {
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);

        // Fiddler default port
        s.setProxy("localhost", 8888);
        WebsocketMessageAdapter.forceNpmWebSocket = true;
        const a: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
        objsToClose.push(r);

        r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
            try {
                expect(e.text).toEqual(Settings.WaveFileText);
                done();
            } catch (error) {
                done(error);
            }
        }, (error: string): void => {
            done(error);
        });
    });

    test("proxy set to bad port", (done: jest.DoneCallback): void => {
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);

        s.setProxy("localhost", 8880);
        WebsocketMessageAdapter.forceNpmWebSocket = true;
        const a: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
        objsToClose.push(r);

        r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
            try {
                expect(e).not.toBeUndefined();
                expect(e.errorDetails).not.toBeUndefined();
                expect(e.errorDetails).toContain("1006");
                done();
            } catch (error) {
                done(error);
            }
        });
    }, 30000);

});

Settings.testIfDOMCondition("Proxy has no effect on browser WebSocket", (done: jest.DoneCallback): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    // Fiddler default port
    s.setProxy("localhost", 8880);
    const a: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
    objsToClose.push(r);

    r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.text).toEqual(Settings.WaveFileText);
            done();
        } catch (error) {
            done(error);
        }
    }, (error: string): void => {
        done(error);
    });
});

test("Region & Key getter test (Speech)", (): void => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    expect(s.subscriptionKey).toEqual(Settings.SpeechSubscriptionKey);
    expect(s.region).toEqual(Settings.SpeechRegion);
});

test("Region & Key getter test (Translation)", (): void => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    expect(s.subscriptionKey).toEqual(Settings.SpeechSubscriptionKey);
    expect(s.region).toEqual(Settings.SpeechRegion);
});

describe("Connection URL Tests", (): void => {

    const testHostConnection = (
        createMethod: (url: URL, key: string) => sdk.SpeechConfig | sdk.SpeechTranslationConfig,
        hostName: string,
        expectedHostName: string,
        recognizerCreateMethod: (config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => sdk.SpeechRecognizer | sdk.TranslationRecognizer | sdk.IntentRecognizer | sdk.SpeechSynthesizer,
        done: jest.DoneCallback
    ): void => {

        const s: sdk.SpeechConfig | sdk.SpeechTranslationConfig = createMethod(new URL(hostName), "fakekey");
        objsToClose.push(s);

        const r = recognizerCreateMethod(s);
        objsToClose.push(r);

        let recognizeOrSynthesizeOnceAsync: (cb: (p2: any) => void) => void;
        let uri: string;
        const detachObject: IDetachable = Events.instance.attachListener({
            onEvent: (event: PlatformEvent): void => {
                if (event instanceof ConnectionStartEvent) {
                    const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                    uri = connectionEvent.uri;
                }
            },
        });

        if (r instanceof sdk.Recognizer) {
            recognizeOrSynthesizeOnceAsync = (cb: (p2: any) => void): void => {
                r.recognizeOnceAsync(cb);
            };
        } else if (r instanceof sdk.SpeechSynthesizer) {
            recognizeOrSynthesizeOnceAsync = (cb: (p2: any) => void): void => {
                r.speakTextAsync("", cb);
            };
        }
        recognizeOrSynthesizeOnceAsync(
            (p2: sdk.RecognitionResult): void => {
                try {
                    expect(uri).not.toBeUndefined();
                    // Make sure there's only a single ? in the URL.
                    expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                    expect(uri).toContain(expectedHostName);
                    expect(uri.startsWith(expectedHostName)).toBe(true);
                    expect(uri).toContain(expectedHostName);
                    expect(p2.errorDetails).not.toBeUndefined();
                    expect(sdk.ResultReason[p2.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);

                    const cancelDetails: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(p2);
                    expect(sdk.CancellationReason[cancelDetails.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                    expect(sdk.CancellationErrorCode[cancelDetails.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                    done();
                } catch (error) {
                    done(error);
                } finally {
                    void detachObject.detach();

                    uri = undefined;
                }
            });
    };

    describe.each([
        [sdk.SpeechConfig.fromHost, BuildSpeechRecognizerFromWaveFile],
        [sdk.SpeechTranslationConfig.fromHost, BuildTranslationRecognizerFromWaveFile],
        [sdk.SpeechConfig.fromHost, BuildIntentRecognizerFromWaveFile],
        [sdk.SpeechConfig.fromHost, BuildSpeechSynthesizerToFileOutput]
    ])("FromHost Tests", (createMethod: any, recognizerCreateMethod: (
        config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) =>
        sdk.SpeechRecognizer | sdk.TranslationRecognizer | sdk.IntentRecognizer | sdk.SpeechSynthesizer) => {

        test("Simple Host and protocol", (done: jest.DoneCallback): void => {
            // eslint-disable-next-line no-console
            console.info("Name: Simple Host and protocol");

            testHostConnection(createMethod,
                "ws://fakehost",
                "ws://fakehost/",
                recognizerCreateMethod,
                done);
        }, 30000);

        test("Simple Host, protocol, and port", (done: jest.DoneCallback): void => {
            // eslint-disable-next-line no-console
            console.info("Name: Simple Host, protocol, and port");

            testHostConnection(createMethod,
                "ws://fakehost:8080",
                "ws://fakehost:8080/",
                recognizerCreateMethod,
                done);
        }, 30000);
    });

    const testUrlParameter = (
        createMethod: (url: URL, key: string) => sdk.SpeechConfig | sdk.SpeechTranslationConfig,
        setMethod: (config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => void,
        recognizerCreateMethod: (config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => sdk.SpeechRecognizer | sdk.TranslationRecognizer | sdk.IntentRecognizer | sdk.SpeechSynthesizer,
        done: jest.DoneCallback,
        ...urlSubStrings: string[]
    ): void => {

        const s: sdk.SpeechConfig | sdk.SpeechTranslationConfig = createMethod(new URL("wss://random.host.name"), "fakekey");
        objsToClose.push(s);

        setMethod(s);

        const r = recognizerCreateMethod(s);
        objsToClose.push(r);

        let recognizeOrSynthesizeOnceAsync: (cb: (p2: any) => void) => void;
        const detachObject: IDetachable = Events.instance.attachListener({
            onEvent: (event: PlatformEvent): void => {
                if (event instanceof ConnectionStartEvent) {
                    const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                    const uri: string = connectionEvent.uri;
                    try {
                        expect(uri).not.toBeUndefined();
                        // Make sure there's only a single ? in the URL.
                        expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                        urlSubStrings.forEach((value: string, index: number, array: string[]): void => {
                            expect(uri).toContain(value);
                        });
                    } catch (error) {
                        done(error);
                    };

                    void detachObject.detach();
                }
            },
        });

        if (r instanceof sdk.Recognizer) {
            recognizeOrSynthesizeOnceAsync = (cb: (p2: any) => void): void => {
                r.recognizeOnceAsync(cb,
                    (e: string): void => {
                        done(e);
                    });
            };
        } else if (r instanceof sdk.SpeechSynthesizer) {
            recognizeOrSynthesizeOnceAsync = (cb: (p2: any) => void): void => {
                r.speakTextAsync("", cb);
            };
        }

        recognizeOrSynthesizeOnceAsync(
            (p2: sdk.RecognitionResult): void => {
                try {
                    expect(p2.errorDetails).not.toBeUndefined();
                    expect(sdk.ResultReason[p2.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);

                    const cancelDetails: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(p2);
                    expect(sdk.CancellationReason[cancelDetails.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                    expect(sdk.CancellationErrorCode[cancelDetails.ErrorCode]).toEqual(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]);
                    done();
                } catch (error) {
                    done(error);
                }
            });
    };

    describe.each([
        [sdk.SpeechConfig.fromEndpoint, BuildSpeechRecognizerFromWaveFile],
        [sdk.SpeechTranslationConfig.fromEndpoint, BuildTranslationRecognizerFromWaveFile],
        [sdk.SpeechConfig.fromEndpoint, BuildIntentRecognizerFromWaveFile]])
        ("Common URL Tests",
            (createMethod: any, recognizerCreateMethod: (
                config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => sdk.SpeechRecognizer | sdk.TranslationRecognizer | sdk.IntentRecognizer | sdk.SpeechSynthesizer): void => {
                test("setServiceProperty (single)", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: setServiceProperty (single)");

                    const propName: string = "someProperty";
                    const val: string = "someValue";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setServiceProperty(propName, val, sdk.ServicePropertyChannel.UriQueryParameter);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val);
                });

                test("setServiceProperty (change)", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: setServiceProperty (change)");

                    const propName: string = "someProperty";
                    const val: string = "someValue";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setServiceProperty(propName, val, sdk.ServicePropertyChannel.UriQueryParameter);
                            s.setServiceProperty(propName, val + "1", sdk.ServicePropertyChannel.UriQueryParameter);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val + "1");
                });

                test("setServiceProperty (multiple)", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: setServiceProperty (multiple)");

                    const propName: string = "someProperty";
                    const val: string = "someValue";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setServiceProperty(propName + "1", val + "1", sdk.ServicePropertyChannel.UriQueryParameter);
                            s.setServiceProperty(propName + "2", val + "2", sdk.ServicePropertyChannel.UriQueryParameter);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "1" + "=" + val + "1",
                        propName + "2" + "=" + val + "2"
                    );
                });

                test("setProfanity", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: setProfanity");

                    const propName: string = "profanity";
                    const val: string = "masked";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setProfanity(sdk.ProfanityOption.Masked);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });

                test("enableAudioLogging", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: enableAudioLogging");

                    const propName: string = "storeAudio";
                    const val: string = "true";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.enableAudioLogging();
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });

                test("requestWordLevelTimestamps", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: requestWordLevelTimestamps");

                    const propName: string = "wordLevelTimestamps";
                    const val: string = "true";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.requestWordLevelTimestamps();
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });

                test("initialSilenceTimeoutMs", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: initialSilenceTimeoutMs");

                    const propName: string = "initialSilenceTimeoutMs";
                    const val: string = "251";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs], val);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });

                test("endSilenceTimeoutMs", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: endSilenceTimeoutMs");

                    const propName: string = "endSilenceTimeoutMs";
                    const val: string = "251";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs], val);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });

                test("segmentationSilenceTimeoutMs", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: segmentationSilenceTimeoutMs");

                    const propName: string = "segmentationSilenceTimeoutMs";
                    const val: string = "452";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setProperty(sdk.PropertyId[sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs], val);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });

                test("stableIntermediateThreshold", (done: jest.DoneCallback): void => {
                    // eslint-disable-next-line no-console
                    console.info("Name: stableIntermediateThreshold");

                    const propName: string = "stableIntermediateThreshold";
                    const val: string = "5";

                    testUrlParameter(createMethod,
                        (s: sdk.SpeechConfig): void => {
                            s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceResponse_StablePartialResultThreshold], val);
                        },
                        recognizerCreateMethod,
                        done,
                        propName + "=" + val
                    );
                });
            });

    test("enableDictation (Speech)", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: enableDictation");

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);

        s.enableDictation();

        const r: sdk.SpeechRecognizer = BuildSpeechRecognizerFromWaveFile(s);
        objsToClose.push(r);
        let uri: string;
        const detachObject: IDetachable = Events.instance.attachListener({
            onEvent: (event: PlatformEvent): void => {
                if (event instanceof ConnectionStartEvent) {
                    const connectionEvent: ConnectionStartEvent = event as ConnectionStartEvent;
                    uri = connectionEvent.uri;
                }
            },
        });

        r.canceled = (s, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).not.toBeUndefined();
                expect(sdk.ResultReason[e.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);
            } catch (error) {
                done(error);
            }
        };

        r.startContinuousRecognitionAsync(
            (): void => {
                try {
                    expect(uri).not.toBeUndefined();
                    // Make sure there's only a single ? in the URL.
                    expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                    expect(uri).toContain("/dictation/");
                    expect(uri).not.toContain("/conversation/");
                    expect(uri).not.toContain("/interactive/");

                    done();
                } catch (error) {
                    done(error);
                } finally {
                    void detachObject.detach();
                    uri = undefined;
                }
            });
    });
});
