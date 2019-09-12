// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

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
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
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

const BuildSpeechRecognizerFromWaveFile: (speechConfig: sdk.SpeechConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer => {

    const f: File = WaveFileAudioInput.LoadFile(fileName === undefined ? Settings.WaveFile : fileName);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const language: string = Settings.WaveFileLanguage;
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = language;
    }

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildIntentRecognizerFromWaveFile: (speechConfig: sdk.SpeechConfig, fileName?: string) => sdk.IntentRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.IntentRecognizer => {

    const f: File = WaveFileAudioInput.LoadFile(fileName === undefined ? Settings.WaveFile : fileName);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const language: string = Settings.WaveFileLanguage;
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = language;
    }

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildTranslationRecognizerFromWaveFile: (speechConfig: sdk.SpeechTranslationConfig, fileName?: string) => sdk.TranslationRecognizer = (speechConfig?: sdk.SpeechTranslationConfig, fileName?: string): sdk.TranslationRecognizer => {

    const f: File = WaveFileAudioInput.LoadFile(fileName === undefined ? Settings.WaveFile : fileName);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const language: string = Settings.WaveFileLanguage;
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = language;
    }
    speechConfig.addTargetLanguage("en-us");

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();

    return r;
};

test("Null Param Check, both.", () => {
    expect(() => sdk.SpeechConfig.fromSubscription(null, null)).toThrowError();
});

test("Null Param Check, Region", () => {
    expect(() => sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, null)).toThrowError();
});

test("Null Param Check, Key", () => {
    expect(() => sdk.SpeechConfig.fromSubscription(null, Settings.SpeechRegion)).toThrowError();
});

test("Valid Params", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    s.close();
});

test("From Endpoint, but null", () => {
    expect(() => sdk.SpeechConfig.fromEndpoint(null, null)).toThrowError();
});

test("From Endpoint, endpoihnt numm null", () => {
    expect(() => sdk.SpeechConfig.fromEndpoint(null, Settings.SpeechSubscriptionKey)).toThrowError();
});

test("From Endpoint, key null", () => {
    expect(() => sdk.SpeechConfig.fromEndpoint(new URL("http://www.example.com"), null)).toThrowError();
});

test.skip("From endpoint, invalid key format.", () => {
    expect(() => sdk.SpeechConfig.fromEndpoint(new URL("http://www.example.com"), "illegal-subscription")).toThrowError();
});

// TODO use an endpoint that we control so the subscription key is not leaked!
test("From endpoing, valid Params", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL("http://www.example.com"), "Settings.SpeechSubscriptionKey");
    expect(s).not.toBeUndefined();
    s.close();
});

test("TypedParametersAccessableViaPropBag", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    TestParam(() => s.authorizationToken, (val: string) => (s.authorizationToken = val), sdk.PropertyId.SpeechServiceAuthorization_Token, s);
    TestParam(() => s.endpointId, (val: string) => (s.endpointId = val), sdk.PropertyId.SpeechServiceConnection_EndpointId, s);
    TestParam(() => s.speechRecognitionLanguage, (val: string) => (s.speechRecognitionLanguage = val), sdk.PropertyId.SpeechServiceConnection_RecoLanguage, s);
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

test("Unset param return default", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const name: string = createNoDashGuid();
    const value: string = createNoDashGuid();

    expect(s.getProperty(name, value)).toEqual(value);
    expect(s.getProperty(name)).toBeUndefined();

    s.close();
});

test("Create Recognizer", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Proeprties are passed to recognizer", () => {
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

test("Create SR from AudioConfig", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Null Language Throws", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = null;

    expect(() => new sdk.SpeechRecognizer(s)).toThrowError();

    s.close();
});

test("Create recognizer with language and audioConfig", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);

    expect(r).not.toBeUndefined();

    s.close();
});

test("Create Intent Recognizer", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s);

    s.close();
});

test("testCreateIntentRecognizerLanguage1", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = null;

    expect(() => new sdk.IntentRecognizer(s)).toThrow();

    s.close();
});

test("Intent Recognizer Success", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-US";

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Intent Recognizer with Wave File.", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-US";

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const r: sdk.IntentRecognizer = new sdk.IntentRecognizer(s, config);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Intent Recognizer null language Throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recognizer No Target Languages Throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recognizer No Source Language Throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.addTargetLanguage("en-EN");

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog success", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";
    s.addTargetLanguage("en-US");

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Translation Recognizer Null target languages throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);
    s.speechRecognitionLanguage = "illegal";

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Test Translation Recognizer emty target list throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.speechRecognitionLanguage = "en-EN";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "");

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();
    s.close();
});

test("Translation Null voice value throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "illegal");
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);
    s.speechRecognitionLanguage = "en-EN";

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translition Recognizer success.", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "en-US");
    s.speechRecognitionLanguage = "en-EN";

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("Translation Recog Nul via prop set for targets", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);

    expect(() => { s.speechRecognitionLanguage = null; }).toThrow();

    s.close();
});

test("Translation Recog Null via propset voice and targets", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog Null via propset voice and targets with Language", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], null);
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog with empty targets via prop", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "");
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog, Null voice via prop throws", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "en-US");
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], null);

    expect(() => new sdk.TranslationRecognizer(s)).toThrow();

    s.close();
});

test("Translation Recog success", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationToLanguages], "en-US");
    s.speechRecognitionLanguage = "en-US";
    s.setProperty(sdk.PropertyId[sdk.PropertyId.SpeechServiceConnection_TranslationVoice], "en-US");

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s);
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("testClose", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    s.close();
});

describe("NPM proxy test", () => {

    afterEach(() => {
        // Reset the WebSocket test hook to browser.
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    // Require manual setup of a proxy server.
    test.skip("valid proxy set", (done: jest.DoneCallback) => {
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);

        // Fiddler default port
        s.setProxy("localhost", 8888);
        WebsocketMessageAdapter.forceNpmWebSocket = true;
        const a: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(WaveFileAudioInput.LoadFile(Settings.WaveFile));

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
        objsToClose.push(r);

        r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
            try {
                expect(e.text).toEqual(Settings.WaveFileText);
                done();
            } catch (error) {
                done.fail(error);
            }
        }, (error: string): void => {
            done.fail(error);
        });
    });

    test("proxy set to bad port", (done: jest.DoneCallback) => {
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);

        s.setProxy("localhost", 8880);
        WebsocketMessageAdapter.forceNpmWebSocket = true;
        const a: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(WaveFileAudioInput.LoadFile(Settings.WaveFile));

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
        objsToClose.push(r);

        r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
            try {
                expect(e).not.toBeUndefined();
                expect(e.errorDetails).not.toBeUndefined();
                expect(e.errorDetails).toContain("1006");
            } catch (error) {
                done.fail(error);
            }
        }, (error: string): void => {
            try {
                expect(error).toContain("1006");
                done();
            } catch (error2) {
                done.fail(error2);
            }
        });
    });
});

test("Proxy has no effect on browser WebSocket", (done: jest.DoneCallback) => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    // Fiddler default port
    s.setProxy("localhost", 8880);
    const a: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(WaveFileAudioInput.LoadFile(Settings.WaveFile));

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, a);
    objsToClose.push(r);

    r.recognizeOnceAsync((e: sdk.SpeechRecognitionResult): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(e.text).toEqual(Settings.WaveFileText);
            done();
        } catch (error) {
            done.fail(error);
        }
    }, (error: string): void => {
        done.fail(error);
    });
});

test("Region & Key getter test (Speech)", () => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    expect(s.subscriptionKey).toEqual(Settings.SpeechSubscriptionKey);
    expect(s.region).toEqual(Settings.SpeechRegion);
});

test("Region & Key getter test (Translation)", () => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    objsToClose.push(s);

    expect(s.subscriptionKey).toEqual(Settings.SpeechSubscriptionKey);
    expect(s.region).toEqual(Settings.SpeechRegion);
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

    function testUrlParameter(
        createMethod: (url: URL, key: string) => sdk.SpeechConfig | sdk.SpeechTranslationConfig,
        setMethod: (config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => void,
        recognizerCreateMethod: (config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => sdk.SpeechRecognizer | sdk.TranslationRecognizer | sdk.IntentRecognizer,
        done: jest.DoneCallback,
        ...urlSubStrings: string[]
    ): void {

        const s: sdk.SpeechConfig | sdk.SpeechTranslationConfig = createMethod(new URL("wss://fake.host.name"), "fakekey");
        objsToClose.push(s);

        setMethod(s);

        const r: { recognizeOnceAsync: (cb?: (e: sdk.RecognitionResult) => void, err?: (e: string) => void) => void } = recognizerCreateMethod(s);
        objsToClose.push(r);

        r.recognizeOnceAsync(
            (p2: any): void => {
                try {
                    expect(uri).not.toBeUndefined();
                    // Make sure there's only a single ? in the URL.
                    expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                    urlSubStrings.forEach((value: string, index: number, array: string[]) => {
                        expect(uri).toContain(value);
                    });

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
    }

    describe.each([
        [sdk.SpeechConfig.fromEndpoint, BuildSpeechRecognizerFromWaveFile],
        [sdk.SpeechTranslationConfig.fromEndpoint, BuildTranslationRecognizerFromWaveFile],
        [sdk.SpeechConfig.fromEndpoint, BuildIntentRecognizerFromWaveFile]])("Common URL Tests",
            (createMethod: any,
             recognizerCreateMethod: (config: sdk.SpeechConfig | sdk.SpeechTranslationConfig) => sdk.SpeechRecognizer | sdk.TranslationRecognizer | sdk.IntentRecognizer) => {
                test("setServiceProperty (single)", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
                    console.info("Name: setServiceProperty");

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

                test("setServiceProperty (change)", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
                    console.info("Name: setServiceProperty");

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

                test("setServiceProperty (multiple)", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
                    console.info("Name: setServiceProperty");

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

                test("setProfanity", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
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

                test("enableAudioLogging", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
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

                test("requestWordLevelTimestamps", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
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

                test("initialSilenceTimeoutMs", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
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

                test("endSilenceTimeoutMs", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
                    console.info("Name: initialSilenceTimeoutMs");

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

                test("stableIntermediateThreshold", (done: jest.DoneCallback) => {
                    // tslint:disable-next-line:no-console
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

    test("enableDictation (Speech)", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: enableDictation");

        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
        objsToClose.push(s);

        s.enableDictation();

        const r: sdk.SpeechRecognizer = BuildSpeechRecognizerFromWaveFile(s);
        objsToClose.push(r);

        r.startContinuousRecognitionAsync(
            () => {
                try {
                    expect(uri).not.toBeUndefined();
                    // Make sure there's only a single ? in the URL.
                    expect(uri.indexOf("?")).toEqual(uri.lastIndexOf("?"));
                    expect(uri).toContain("/dictation/");
                    expect(uri).not.toContain("/conversation/");
                    expect(uri).not.toContain("/interactive/");

                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
    });
});
