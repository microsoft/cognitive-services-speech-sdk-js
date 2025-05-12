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
//   Settings.AmbiguousWaveFile
//
/* eslint-disable no-console */

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { DefaultAzureCredential, AzurePipelinesCredential } from "@azure/identity";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { Events, EventType, PlatformEvent } from "../src/common/Exports";
import { Settings } from "./Settings";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";
import { closeAsyncObjects, RepeatingPullStream, WaitForCondition } from "./Utilities";


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

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

export const BuildTranscriberFromWaveFile: (speechConfig?: sdk.SpeechConfig, fileName?: string) => sdk.ConversationTranscriber = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.ConversationTranscriber => {

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

    const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, config);
    expect(r).not.toBeUndefined();

    return r;
};

const BuildSpeechConfig = (useTokenCredential: boolean = false): sdk.SpeechConfig => {

    let s: sdk.SpeechConfig;
    if (undefined === Settings.SpeechEndpoint) {
        s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    } else if (useTokenCredential) {
        s = sdk.SpeechConfig.fromEndpoint(new URL(Settings.SpeechEndpoint), new DefaultAzureCredential());
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

test("testGetLanguage1", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetLanguage1");
    const r: sdk.ConversationTranscriber = BuildTranscriberFromWaveFile();
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

    const r: sdk.ConversationTranscriber = BuildTranscriberFromWaveFile(s);
    objsToClose.push(r);

    expect(r.speechRecognitionLanguage).not.toBeNull();
    expect(language === r.speechRecognitionLanguage);
});

test("testGetOutputFormatDefault", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetOutputFormatDefault");
    const r: sdk.ConversationTranscriber = BuildTranscriberFromWaveFile();
    objsToClose.push(r);

    expect(r.outputFormat === sdk.OutputFormat.Simple);
});

test("testGetParameters", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetParameters");
    const r: sdk.ConversationTranscriber = BuildTranscriberFromWaveFile();
    objsToClose.push(r);

    expect(r.properties).not.toBeUndefined();
    // expect(r.language ==  r.properties.getProperty(RecognizerParameterNames.SpeechRecognitionLanguage));
    // expect(r.deploymentId == r.properties.getProperty(RecognizerParameterNames.SpeechMspeechConfigImpl// TODO: is this really the correct mapping?
    expect(r.speechRecognitionLanguage).not.toBeUndefined();
    expect(r.endpointId === r.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_EndpointId, null)); // todo: is this really the correct mapping?
});

test("testStrategy", () => {
    // eslint-disable-next-line no-console
    console.info("Name: testStrategy");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    const segStrategy = "semantic";
    s.setProperty(sdk.PropertyId.Speech_SegmentationStrategy, "semantic");
    objsToClose.push(s);
    const r: sdk.ConversationTranscriber = BuildTranscriberFromWaveFile(s);
    objsToClose.push(r);
    expect(segStrategy === r.properties.getProperty(sdk.PropertyId.Speech_SegmentationStrategy, null));
});

describe.each([[true], [false]])("Checking intermediate diazatation", (intermediateDiazaration: boolean) => {

    test("testTranscriptionFromPushStreamAsync", (done: jest.DoneCallback) => {
        // eslint-disable-next-line no-console
        console.info("Name: testTranscriptionFromPushStreamAsync");

        const s: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(s);

        if (intermediateDiazaration) {
            s.setProperty(sdk.PropertyId.SpeechServiceResponse_DiarizeIntermediateResults, "true");
        }

        const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
        const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps);

        const fileBuff: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFileSingleChannel);
        ps.write(fileBuff);
        ps.write(new ArrayBuffer(1024 * 32));
        ps.write(fileBuff);
        ps.close();

        const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, audio);
        objsToClose.push(r);

        let recoCount: number = 0;
        let canceled: boolean = false;
        let hypoCounter: number = 0;
        let sessionId: string;
        let guestFound: boolean = false;
        let intermediateGuestFound: boolean = false;

        r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
            try {
                // eslint-disable-next-line no-console
                console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
                recoCount++;
                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(e.result.properties).not.toBeUndefined();
                expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
                expect(e.result.speakerId).not.toBeUndefined();
                if (e.result.speakerId.startsWith("Guest")) {
                    guestFound = true;
                }

            } catch (error) {
                done(error);
            }
        };

        r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
            hypoCounter++;
            console.info("[Transcribing] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            if (e.result.speakerId.startsWith("Guest")) {
                intermediateGuestFound = true;
            }
        };

        r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                canceled = true;
                expect(e.errorDetails).toBeUndefined();
                expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
            } catch (error) {
                done(error);
            }
        };

        r.startTranscribingAsync(
            () => WaitForCondition(() => (canceled), () => {
                try {
                    expect(guestFound).toBeTruthy();
                    console.info("intermediateDiazaration: ");
                    console.info( intermediateDiazaration ? "true" : "false");
                    console.info(" intermediateGuestFound: ");
                    console.info(intermediateGuestFound ? "true" : "false");
                    expect(intermediateDiazaration).toEqual(intermediateGuestFound);
                    done();
                } catch (err) {
                    done(err);
                }
            }),
            (err: string) => {
                done(err);
            });
    }, 45000);
});

test.skip("testTranscriptionWithAADTokenCredentialAsync", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: testTranscriptionWithAADTokenCredentialAsync");

    const s: sdk.SpeechConfig = BuildSpeechConfig(true);
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFileSingleChannel);
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

                if (bytesSent === fileBuffer.byteLength) {
                    p.close();
                }

                return (end - start);
            },
        });

    const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, audio);
    objsToClose.push(r);

    let recoCount: number = 0;
    let canceled: boolean = false;
    let sessionId: string;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            // eslint-disable-next-line no-console
            console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => (canceled), () => {
            try {
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
}, 45000);

test("testTranscriptionFromPullStreamAsync", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: testTranscriptionFromPullStreamAsync");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFileSingleChannel);
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

                if (bytesSent === fileBuffer.byteLength) {
                    p.close();
                }

                return (end - start);
            },
        });

    const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, audio);
    objsToClose.push(r);

    let recoCount: number = 0;
    let canceled: boolean = false;
    let hypoCounter: number = 0;
    let sessionId: string;
    let guestFound: boolean = false;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            // eslint-disable-next-line no-console
            console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            expect(e.result.speakerId).not.toBeUndefined();
            if (e.result.speakerId.startsWith("Guest")) {
                guestFound = true;
            }

        } catch (error) {
            done(error);
        }
    };

    r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
        hypoCounter++;
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => (canceled), () => {
            try {
                expect(guestFound).toEqual(true);
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
}, 45000);

test("testTranscriptionWithDetailedOutputFormatAsync", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: testTranscriptionWithDetailedOutputFormatAsync");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    s.outputFormat = sdk.OutputFormat.Detailed;
    objsToClose.push(s);

    const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
    const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps);

    const fileBuff: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFileSingleChannel);
    ps.write(fileBuff);
    ps.write(new ArrayBuffer(1024 * 32));
    ps.write(fileBuff);
    ps.close();

    const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, audio);
    objsToClose.push(r);

    let recoCount: number = 0;
    let canceled: boolean = false;
    let hypoCounter: number = 0;
    let sessionId: string;
    let guestFound: boolean = false;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            // eslint-disable-next-line no-console
            console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            let jsonResult: string = e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
            let detailedResultFound: boolean = false;
            if (jsonResult.search("MaskedITN") > 0) {
                detailedResultFound = true;
            }
            expect(detailedResultFound).toEqual(true);
            expect(e.result.speakerId).not.toBeUndefined();
            if (e.result.speakerId.startsWith("Guest")) {
                guestFound = true;
            }

        } catch (error) {
            done(error);
        }
    };

    r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
        hypoCounter++;
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => (canceled), () => {
            try {
                expect(guestFound).toEqual(true);
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
}, 45000);

test("testTranscriptionWithWordLevelTimingsAsync", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: testTranscriptionWithWordLevelTimingsAsync");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    s.requestWordLevelTimestamps();
    objsToClose.push(s);

    const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
    const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps);

    const fileBuff: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFileSingleChannel);
    ps.write(fileBuff);
    ps.write(new ArrayBuffer(1024 * 32));
    ps.write(fileBuff);
    ps.close();

    const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, audio);
    objsToClose.push(r);

    let recoCount: number = 0;
    let canceled: boolean = false;
    let hypoCounter: number = 0;
    let sessionId: string;
    let guestFound: boolean = false;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            // eslint-disable-next-line no-console
            console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            let jsonResult: string = e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
            let wordLevelTimestampsFound: boolean = false;
            if (jsonResult.search("Duration") > 0) {
                wordLevelTimestampsFound = true;
            }
            expect(wordLevelTimestampsFound).toEqual(true);
            expect(e.result.speakerId).not.toBeUndefined();
            if (e.result.speakerId.startsWith("Guest")) {
                guestFound = true;
            }

        } catch (error) {
            done(error);
        }
    };

    r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
        hypoCounter++;
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => (canceled), () => {
            try {
                expect(guestFound).toEqual(true);
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
}, 45000);

test("Phraselist assists conversation transcription.", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: Phraselist assists conversation transcription.");

    const r: sdk.ConversationTranscriber = BuildTranscriberFromWaveFile(undefined, Settings.AmbiguousWaveFile);
    objsToClose.push(r);

    const phraseList: sdk.PhraseListGrammar = sdk.PhraseListGrammar.fromRecognizer(r);
    phraseList.addPhrase("Wreck a nice beach");

    let recoCount: number = 0;
    let canceled: boolean = false;
    let hypoCounter: number = 0;
    let sessionId: string;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.text).toEqual("Wreck a nice beach.");
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

        } catch (error) {
            done(error);
        }
    };

    r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
        hypoCounter++;
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => ((recoCount === 1) && canceled), () => {
            try {
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
});

const BuildSourceLanguageConfigs: () => sdk.SourceLanguageConfig[] = (): sdk.SourceLanguageConfig[] => {
    const s1: sdk.SourceLanguageConfig = sdk.SourceLanguageConfig.fromLanguage("en-US");
    expect(s1).not.toBeUndefined();
    const s2: sdk.SourceLanguageConfig = sdk.SourceLanguageConfig.fromLanguage("de-DE");
    expect(s2).not.toBeUndefined();
    return [s1, s2];
};

test("testTranscriptionWithContinuousLanguageIdentificationAsync", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: testTranscriptionWithContinuousLanguageIdentificationAsync");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const configs: sdk.SourceLanguageConfig[] = BuildSourceLanguageConfigs();
    configs.forEach((c: sdk.SourceLanguageConfig) => { objsToClose.push(c); });
    let a: sdk.AutoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromSourceLanguageConfigs(configs);
    a.mode = sdk.LanguageIdMode.Continuous;
    expect(a.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_LanguageIdMode)).toEqual("Continuous");
    objsToClose.push(a);

    const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
    const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps);

    const fileBuff: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFileSingleChannel);
    ps.write(fileBuff);
    ps.write(new ArrayBuffer(1024 * 32));
    ps.write(fileBuff);
    ps.close();

    const r: sdk.ConversationTranscriber = sdk.ConversationTranscriber.FromConfig(s, a, audio);
    objsToClose.push(r);

    let recoCount: number = 0;
    let canceled: boolean = false;
    let hypoCounter: number = 0;
    let sessionId: string;
    let guestFound: boolean = false;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            // eslint-disable-next-line no-console
            console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            const autoDetectResult: sdk.AutoDetectSourceLanguageResult = sdk.AutoDetectSourceLanguageResult.fromConversationTranscriptionResult(e.result);
            expect(autoDetectResult).not.toBeUndefined();
            expect(autoDetectResult.language).not.toBeUndefined();
            expect(autoDetectResult.languageDetectionConfidence).not.toBeUndefined();
            expect(e.result.speakerId).not.toBeUndefined();
            if (e.result.speakerId.startsWith("Guest")) {
                guestFound = true;
            }

        } catch (error) {
            done(error);
        }
    };

    r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
        hypoCounter++;
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => (canceled), () => {
            try {
                expect(guestFound).toEqual(true);
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
}, 45000);

test("test Conversation Transcriber with Pronunciation Assessment without reference text", (done: jest.DoneCallback) => {
    // eslint-disable-next-line no-console
    console.info("Name: test Conversation Transcriber with Pronunciation Assessment without reference text");
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
    const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps);

    const fileBuff: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
    ps.write(fileBuff);
    ps.write(new ArrayBuffer(1024 * 32));
    ps.write(fileBuff);
    ps.close();

    const r: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, audio);
    objsToClose.push(r);

    const p: sdk.PronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig("");
    objsToClose.push(p);
    p.applyTo(r);

    let recoCount: number = 0;
    let canceled: boolean = false;
    let hypoCounter: number = 0;
    let sessionId: string;

    r.sessionStarted = (r: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    r.transcribed = (o: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs) => {
        try {
            // eslint-disable-next-line no-console
            console.info("[Transcribed] SpeakerId: " + e.result.speakerId + " Text: " + e.result.text);
            recoCount++;
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(e.result.properties).not.toBeUndefined();
            expect(e.result.text).toEqual(Settings.WaveFileText);
            expect(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
            expect(e.result.speakerId).not.toBeUndefined();
            const pronResult = sdk.PronunciationAssessmentResult.fromResult(e.result);
            expect(pronResult).not.toBeUndefined();
            expect(pronResult.detailResult).not.toBeUndefined();
            expect(pronResult.detailResult.Words[0].Word).not.toBeUndefined();
            expect(pronResult.pronunciationScore).toBeGreaterThan(0);
            expect(pronResult.accuracyScore).toBeGreaterThan(0);
            expect(pronResult.fluencyScore).toBeGreaterThan(0);
            expect(pronResult.completenessScore).toBeGreaterThan(0);
        } catch (error) {
            done(error);
        }
    };

    r.transcribing = (s: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => {
        hypoCounter++;
    };

    r.canceled = (o: sdk.ConversationTranscriber, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            canceled = true;
            expect(e.errorDetails).toBeUndefined();
            expect(e.reason).toEqual(sdk.CancellationReason.EndOfStream);
        } catch (error) {
            done(error);
        }
    };

    r.startTranscribingAsync(
        () => WaitForCondition(() => (canceled), () => {
            try {
                done();
            } catch (err) {
                done(err);
            }
        }),
        (err: string) => {
            done(err);
        });
});