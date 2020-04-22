// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
} from "../src/common.browser/Exports";
import {
    Events,
    EventType
} from "../src/common/Exports";

import { ByteBufferAudioFile } from "./ByteBufferAudioFile";
import { Settings } from "./Settings";
import { default as WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linerally, still looking for a way to get the test name to print that doesn't mean changing each test.
beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
    // tslint:disable-next-line:no-console
    console.info("Sart Time: " + new Date(Date.now()).toLocaleString());
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

const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechTranslationConfig) => sdk.TranslationRecognizer = (speechConfig?: sdk.SpeechTranslationConfig): sdk.TranslationRecognizer => {

    let s: sdk.SpeechTranslationConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

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

test("GetOutputVoiceName", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: GetOutputVoiceName");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const voice: string = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";
    s.voiceName = voice;

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    expect(r.voiceName).toEqual(voice);
});

test("TranslateVoiceRoundTrip", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: TranslateVoiceRoundTrip");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    let synthCount: number = 0;
    let synthFragmentCount: number = 0;

    const rEvents: { [id: number]: ArrayBuffer; } = {};

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs) => {
        switch (e.result.reason) {
            case sdk.ResultReason.Canceled:
                done.fail(sdk.ResultReason[e.result.reason]);
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

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
        try {
            switch (e.reason) {
                case sdk.CancellationReason.Error:
                    done.fail(e.errorDetails);
                    break;
                case sdk.CancellationReason.EndOfStream:
                    expect(synthCount).toEqual(1);
                    canceled = true;
                    break;
            }
        } catch (error) {
            done.fail(error);
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
        () => {
            r.stopContinuousRecognitionAsync(() => {
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

                const inputStream: File = ByteBufferAudioFile.Load([result]);
                const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(inputStream);
                const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
                objsToClose.push(speechConfig);
                speechConfig.speechRecognitionLanguage = "de-DE";

                const r2: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, config);
                objsToClose.push(r2);

                r2.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
                    try {
                        expect(e.errorDetails).toBeUndefined();
                    } catch (error) {
                        done.fail(error);
                    }
                };

                r2.recognizeOnceAsync((speech: sdk.SpeechRecognitionResult) => {
                    expect(speech.errorDetails).toBeUndefined();
                    expect(speech.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                    expect(speech.text).toEqual("Wie ist das Wetter?");
                    done();
                }, (error: string) => done.fail(error));
            }, (error: string) => done.fail(error));
        });
}, 10000);

test("TranslateVoiceInvalidVoice", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: TranslateVoiceInvalidVoice");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "Microsoft Server Speech Text to Speech Voice (BadVoice)";

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs) => {
        try {
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);
        } catch (error) {
            done.fail(error);
        }

    });

    let stopReco: boolean = false;
    let pass: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
        try {
            stopReco = true;
            if (!pass) {
                expect(e.errorDetails).toEqual("Synthesis service failed with code:  - Could not identify the voice 'Microsoft Server Speech Text to Speech Voice (BadVoice)' for the text to speech service ");
            } else {
                expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            }

            pass = true;
        } catch (error) {
            done.fail(error);
        }
    });

    r.startContinuousRecognitionAsync();

    WaitForCondition(() => stopReco, () => {
        r.stopContinuousRecognitionAsync(() => {
            if (pass) {
                done();
            }
        });
    });
});

test("TranslateVoiceUSToGerman", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: TranslateVoiceUSToGerman");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    let synthCount: number = 0;
    let synthFragmentCount: number = 0;

    const rEvents: { [id: number]: ArrayBuffer; } = {};

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs) => {
        try {
            switch (e.result.reason) {
                case sdk.ResultReason.Canceled:
                    done.fail(sdk.ResultReason[e.result.reason]);
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
            done.fail(error);
        }
    });

    let canceled: boolean = false;
    let inTurn: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
        try {
            switch (e.reason) {
                case sdk.CancellationReason.Error:
                    done.fail(e.errorDetails);
                    break;
                case sdk.CancellationReason.EndOfStream:
                    expect(synthCount).toEqual(1);
                    canceled = true;
                    break;
            }
        } catch (error) {
            done.fail(error);
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
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync();

    // wait until we get at least on final result
    WaitForCondition((): boolean => (canceled && !inTurn),
        () => {
            r.stopContinuousRecognitionAsync(() => {
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
                        done.fail(error);
                    }
                };

                r2.recognizeOnceAsync((speech: sdk.SpeechRecognitionResult) => {
                    expect(speech.errorDetails).toBeUndefined();
                    expect(speech.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
                    expect(speech.text).toEqual("Wie ist das Wetter?");
                    done();
                }, (error: string) => {
                    done.fail(error);
                });
            }, (error: string) => {
                done.fail(error);
            });
        });
}, 10000);

test("MultiPhrase", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: MultiPhrase");
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";
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

    r.synthesizing = ((o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs) => {
        try {
            switch (e.result.reason) {
                case sdk.ResultReason.Canceled:
                    done.fail(sdk.ResultReason[e.result.reason]);
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
            done.fail(error);
        }
    });

    let canceled: boolean = false;
    let inTurn: boolean = false;

    r.canceled = ((o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs) => {
        switch (e.reason) {
            case sdk.CancellationReason.Error:
                done.fail(e.errorDetails);
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
        () => {
            r.stopContinuousRecognitionAsync(() => {
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

                r2.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs) => {
                    try {
                        expect(e.result.text).toEqual("Wie ist das Wetter?");
                        expect(e.result.properties).not.toBeUndefined();
                        expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                        numEvents++;
                    } catch (error) {
                        done.fail(error);
                    }
                };

                r2.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
                    switch (e.reason) {
                        case sdk.CancellationReason.EndOfStream:
                            canceled = true;
                            break;
                        case sdk.CancellationReason.Error:
                            done.fail(e.errorDetails);
                            break;
                    }
                };

                r2.startContinuousRecognitionAsync(() => {
                    WaitForCondition(() => (canceled && !inTurn),
                        () => {
                            r2.stopContinuousRecognitionAsync(() => {
                                try {
                                    expect(synthCount).toEqual(numPhrases);
                                    expect(numEvents).toEqual(numPhrases);
                                    done();
                                } catch (error) {
                                    done.fail(error);
                                }

                            }, (error: string) => {
                                done.fail(error);
                            });
                        });
                },
                    (error: string) => {
                        done.fail(error);
                    });

            }, (error: string) => {
                done.fail(error);
            });
        });
}, 45000);

test("Config is copied on construction", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: Config is copied on construction");
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    s.speechRecognitionLanguage = "en-US";
    s.addTargetLanguage("en-US");

    const ranVal: string = Math.random().toString();
    s.setProperty("RandomProperty", ranVal);
    s.voiceName = "Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)";

    const f: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, config);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    expect(r.speechRecognitionLanguage).toEqual("en-US");
    expect(r.properties.getProperty("RandomProperty")).toEqual(ranVal);
    expect(r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_TranslationVoice)).toEqual("Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

    // Change them.
    s.speechRecognitionLanguage = "de-DE";
    s.setProperty("RandomProperty", Math.random.toString());
    s.voiceName = "Microsoft Server Speech Text to Speech Voice (de-DE, Hedda)";

    // Validate no change.
    expect(r.speechRecognitionLanguage).toEqual("en-US");
    expect(r.properties.getProperty("RandomProperty")).toEqual(ranVal);
    expect(r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_TranslationVoice)).toEqual("Microsoft Server Speech Text to Speech Voice (en-US, ZiraRUS)");

});
