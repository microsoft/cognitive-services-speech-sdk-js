// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DefaultAzureCredential } from "@azure/identity";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
} from "../src/common.browser/Exports";
import {
    Events,
    EventType
} from "../src/common/Exports";

import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import { ConfigLoader } from "./ConfigLoader";
import { Settings } from "./Settings";
import { SubscriptionsRegionsKeys } from "./SubscriptionRegion";
import {
    closeAsyncObjects,
    WaitForCondition
} from "./Utilities";
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
    // eslint-disable-next-line no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechTranslationConfig) => sdk.TranslationRecognizer = (speechConfig?: sdk.SpeechTranslationConfig): sdk.TranslationRecognizer => {

    let s: sdk.SpeechTranslationConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

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

// Derives the translation endpoint from the configured unified speech subscription. The translation
// recognizer connects over the universal v2 STT route, which is exactly what the unified subscription
// endpoint points at (carrying the resource's custom-domain name so the service can validate the AAD
// token against the correct resource), so we can use it as-is for Entra ID token authentication.
const BuildEntraIdTokenCredentialEndpoint: () => URL = (): URL => {
    const configLoader: ConfigLoader = ConfigLoader.instance;
    configLoader.initialize();
    const sub = configLoader.getSubscriptionRegion(SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION);
    const configured: string = (sub && sub.Endpoint) || Settings.SpeechEndpoint;
    if (!configured) {
        throw new Error("No endpoint configured for the unified speech subscription.");
    }
    return new URL(configured);
};

// Builds a SpeechTranslationConfig that authenticates with an Entra ID (AAD) TokenCredential
// instead of a subscription key. Requires an Entra ID enabled Speech resource.
const BuildSpeechConfigWithTokenCredential: () => sdk.SpeechTranslationConfig = (): sdk.SpeechTranslationConfig => {
    const credential: DefaultAzureCredential = new DefaultAzureCredential();
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromEndpoint(BuildEntraIdTokenCredentialEndpoint(), credential);
    expect(s).not.toBeUndefined();
    return s;
};

test("GetOutputVoiceName", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: GetOutputVoiceName");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const voice: string = "de-DE-KatjaNeural";
    s.voiceName = voice;

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    expect(r.voiceName).toEqual(voice);
});

test("TranslateVoiceRoundTrip", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: TranslateVoiceRoundTrip");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    let synthCount: number = 0;
    let synthFragmentCount: number = 0;

    const rEvents: { [id: number]: ArrayBuffer } = {};

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        switch (e.result.reason) {
            case sdk.ResultReason.Canceled:
                done(sdk.ResultReason[e.result.reason]);
                break;
            case sdk.ResultReason.SynthesizingAudio:
                const result: ArrayBuffer = e.result.audio;
                rEvents[synthFragmentCount++] = result;
                break;
            case sdk.ResultReason.SynthesizingAudioCompleted:
                synthCount++;
                break;
        }
    });

    let canceled: boolean = false;
    let inTurn: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        try {
            switch (e.reason) {
                case sdk.CancellationReason.Error:
                    done(e.errorDetails);
                    break;
                case sdk.CancellationReason.EndOfStream:
                    expect(synthCount).toEqual(1);
                    canceled = true;
                    break;
            }
        } catch (error) {
            done(error);
        }
    });

    r.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = true;
    });

    r.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = false;
    });

    r.startContinuousRecognitionAsync();

    WaitForCondition((): boolean => (canceled && !inTurn),
        (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                let byteCount: number = 0;

                for (let i: number = 0; i < synthFragmentCount; i++) {
                    byteCount += rEvents[i].byteLength;
                }

                const result: Uint8Array = new Uint8Array(byteCount);

                byteCount = 0;
                for (let i: number = 0; i < synthFragmentCount; i++) {
                    result.set(new Uint8Array(rEvents[i]), byteCount);
                    byteCount += rEvents[i].byteLength;
                }

                let config: sdk.AudioConfig;
                if (typeof File !== "undefined") {
                    const inputStream: File = ByteBufferAudioFile.Load([result]);
                    config = sdk.AudioConfig.fromWavFileInput(inputStream);
                } else {
                    const b: Buffer = Buffer.from(result, result.byteOffset, result.byteLength);
                    config = sdk.AudioConfig.fromWavFileInput(b);
                }
                const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
                objsToClose.push(speechConfig);
                speechConfig.speechRecognitionLanguage = "de-DE";

                const r2: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, config);
                objsToClose.push(r2);

                r2.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                    try {
                        expect(e.errorDetails).toBeUndefined();
                    } catch (error) {
                        done(error);
                    }
                };

                r2.recognizeOnceAsync((speech: sdk.SpeechRecognitionResult) => {
                    expect(speech.errorDetails).toBeUndefined();
                    expect(speech.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                    expect(speech.text).toEqual("Wie ist das Wetter?");
                    done();
                }, (error: string) => done(error));
            }, (error: string) => done(error));
        });
}, 10000);

// Requires an Entra ID (AAD) enabled Speech resource and ambient Azure credentials
// (e.g. Azure CLI login, or AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET).
test("TranslateVoiceWithEntraIdTokenCredential", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: TranslateVoiceWithEntraIdTokenCredential");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfigWithTokenCredential();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    let synthCount: number = 0;
    let synthFragmentCount: number = 0;

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        switch (e.result.reason) {
            case sdk.ResultReason.Canceled:
                done(sdk.ResultReason[e.result.reason]);
                break;
            case sdk.ResultReason.SynthesizingAudio:
                expect(e.result.audio).not.toBeUndefined();
                expect(e.result.audio.byteLength).toBeGreaterThan(0);
                synthFragmentCount++;
                break;
            case sdk.ResultReason.SynthesizingAudioCompleted:
                synthCount++;
                break;
        }
    });

    let canceled: boolean = false;
    let inTurn: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        try {
            switch (e.reason) {
                case sdk.CancellationReason.Error:
                    done(e.errorDetails);
                    break;
                case sdk.CancellationReason.EndOfStream:
                    expect(synthCount).toEqual(1);
                    expect(synthFragmentCount).toBeGreaterThan(0);
                    canceled = true;
                    break;
            }
        } catch (error) {
            done(error);
        }
    });

    r.sessionStarted = ((o: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = true;
    });

    r.sessionStopped = ((o: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = false;
    });

    r.startContinuousRecognitionAsync();

    WaitForCondition((): boolean => (canceled && !inTurn),
        (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                done();
            }, (error: string) => done(error));
        });
}, 10000);

test("TranslateVoiceInvalidVoice", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: TranslateVoiceInvalidVoice");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const voiceName: string = "Microsoft Server Speech Text to Speech Voice (BadVoice)";
    s.voiceName = voiceName;

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        try {
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);
        } catch (error) {
            done(error);
        }

    });

    let stopReco: boolean = false;
    let pass: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        try {
            stopReco = true;
            if (!pass) {
                expect(e.errorDetails).toContain(voiceName);
            } else {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            }

            pass = true;
        } catch (error) {
            done(error);
        }
    });

    r.startContinuousRecognitionAsync();

    WaitForCondition((): boolean => stopReco, (): void => {
        r.stopContinuousRecognitionAsync((): void => {
            if (pass) {
                done();
            }
        });
    });
});

test("TranslateVoiceUSToGerman", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: TranslateVoiceUSToGerman");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    let synthCount: number = 0;
    let synthFragmentCount: number = 0;

    const rEvents: { [id: number]: ArrayBuffer; } = {};

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        try {
            switch (e.result.reason) {
                case sdk.ResultReason.Canceled:
                    done(sdk.ResultReason[e.result.reason]);
                    break;
                case sdk.ResultReason.SynthesizingAudio:
                    const result: ArrayBuffer = e.result.audio;
                    rEvents[synthFragmentCount++] = result;
                    break;
                case sdk.ResultReason.SynthesizingAudioCompleted:
                    synthCount++;
                    break;
            }
        } catch (error) {
            done(error);
        }
    });

    let canceled: boolean = false;
    let inTurn: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        try {
            switch (e.reason) {
                case sdk.CancellationReason.Error:
                    done(e.errorDetails);
                    break;
                case sdk.CancellationReason.EndOfStream:
                    expect(synthCount).toEqual(1);
                    canceled = true;
                    break;
            }
        } catch (error) {
            done(error);
        }
    });

    r.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = true;
    });

    r.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = false;
    });

    r.recognizing = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        try {
            expect(e.result.reason).toEqual(sdk.ResultReason.TranslatingSpeech);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    r.startContinuousRecognitionAsync();

    // wait until we get at least on final result
    WaitForCondition((): boolean => (canceled && !inTurn),
        (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();

                for (let i: number = 0; i < synthFragmentCount; i++) {
                    p.write(rEvents[i]);
                }
                p.close();

                const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
                const s2: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
                objsToClose.push(s2);
                s2.speechRecognitionLanguage = "de-DE";

                const r2: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s2, config);
                objsToClose.push(r2);

                r2.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                    try {
                        expect(e.errorDetails).toBeUndefined();
                    } catch (error) {
                        done(error);
                    }
                };

                r2.recognizeOnceAsync((speech: sdk.SpeechRecognitionResult) => {
                    expect(speech.errorDetails).toBeUndefined();
                    expect(speech.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                    expect(speech.text).toEqual("Wie ist das Wetter?");
                    done();
                }, (error: string) => {
                    done(error);
                });
            }, (error: string) => {
                done(error);
            });
        });
}, 10000);

// TODO: fix and re-enable (Translation service change)
test.skip("MultiPhrase", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: MultiPhrase");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";
    s.addTargetLanguage("de-DE");
    s.speechRecognitionLanguage = Settings.WaveFileLanguage;

    const f: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
    const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
    const numPhrases: number = 3;
    const silentBuffer: ArrayBuffer = new ArrayBuffer(32000);

    for (let i: number = 0; i < 3; i++) {
        p.write(f);
        p.write(silentBuffer);
    }

    p.close();

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer).toEqual(true);
    objsToClose.push(r);

    let synthCount: number = 0;
    let synthFragmentCount: number = 0;

    const rEvents: { [id: number]: ArrayBuffer; } = {};

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        try {
            switch (e.result.reason) {
                case sdk.ResultReason.Canceled:
                    done(sdk.ResultReason[e.result.reason]);
                    break;
                case sdk.ResultReason.SynthesizingAudio:
                    const result: ArrayBuffer = e.result.audio;
                    rEvents[synthFragmentCount++] = result;
                    break;
                case sdk.ResultReason.SynthesizingAudioCompleted:
                    synthCount++;
                    break;
            }
        } catch (error) {
            done(error);
        }
    });

    let canceled: boolean = false;
    let inTurn: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        switch (e.reason) {
            case sdk.CancellationReason.Error:
                done(e.errorDetails);
                break;
            case sdk.CancellationReason.EndOfStream:
                canceled = true;
                break;
        }
    });

    r.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = true;
    });

    r.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        inTurn = false;
    });

    r.startContinuousRecognitionAsync();

    WaitForCondition((): boolean => (canceled && !inTurn),
        (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                const p: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();

                for (let i: number = 0; i < synthFragmentCount; i++) {
                    p.write(rEvents[i]);
                    p.write(silentBuffer);
                }
                p.close();

                const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);
                const s2: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
                objsToClose.push(s2);
                s2.speechRecognitionLanguage = "de-DE";

                const r2: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s2, config);
                objsToClose.push(r2);

                let numEvents: number = 0;
                canceled = false;

                r2.sessionStarted = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
                    inTurn = true;
                });

                r2.sessionStopped = ((s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
                    inTurn = false;
                });

                r2.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
                    try {
                        expect(e.result.text).toEqual("Wie ist das Wetter?");
                        expect(e.result.properties).not.toBeUndefined();
                        expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                        numEvents++;
                    } catch (error) {
                        done(error);
                    }
                };

                r2.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                    switch (e.reason) {
                        case sdk.CancellationReason.EndOfStream:
                            canceled = true;
                            break;
                        case sdk.CancellationReason.Error:
                            done(e.errorDetails);
                            break;
                    }
                };

                r2.startContinuousRecognitionAsync((): void => {
                    WaitForCondition((): boolean => (canceled && !inTurn),
                        (): void => {
                            r2.stopContinuousRecognitionAsync((): void => {
                                try {
                                    expect(synthCount).toBeGreaterThanOrEqual(numPhrases);
                                    expect(numEvents).toEqual(numPhrases);
                                    done();
                                } catch (error) {
                                    done(error);
                                }

                            }, (error: string): void => {
                                done(error);
                            });
                        });
                },
                    (error: string): void => {
                        done(error);
                    });

            }, (error: string): void => {
                done(error);
            });
        });
}, 45000);

test("Config is copied on construction", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Config is copied on construction");
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    s.speechRecognitionLanguage = "en-US";
    s.addTargetLanguage("en-US");

    const ranVal: string = Math.random().toString();
    s.setProperty("RandomProperty", ranVal);
    s.voiceName = "Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)";

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    expect(r.speechRecognitionLanguage).toEqual("en-US");
    expect(r.properties.getProperty("RandomProperty")).toEqual(ranVal);
    expect(r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_TranslationVoice)).toEqual("Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

    // Change them.
    s.speechRecognitionLanguage = "de-DE";
    s.setProperty("RandomProperty", Math.random.toString());
    s.voiceName = "de-DE-KatjaNeural";

    // Validate no change.
    expect(r.speechRecognitionLanguage).toEqual("en-US");
    expect(r.properties.getProperty("RandomProperty")).toEqual(ranVal);
    expect(r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_TranslationVoice)).toEqual("Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

});
