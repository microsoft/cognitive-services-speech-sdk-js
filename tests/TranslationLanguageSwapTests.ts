// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
} from "../src/common.browser/Exports";
import {
    Deferred,
    Events,
} from "../src/common/Exports";

import { Settings } from "./Settings";
import {
    closeAsyncObjects,
    RepeatingPullStream,
} from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

beforeAll((): void => {
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

const BuildSpeechConfig = (): sdk.SpeechTranslationConfig => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();
    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }
    s.speechRecognitionLanguage = Settings.WaveFileLanguage;
    return s;
};

const BuildRecognizerFromWaveFile = (speechConfig: sdk.SpeechTranslationConfig, fileName?: string): sdk.TranslationRecognizer => {
    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);
    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(speechConfig, config);
    expect(r).not.toBeUndefined();
    return r;
};

test("Remove primary target language triggers reset with synthesis", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Remove primary target language triggers reset with synthesis");
    const done: Deferred<void> = new Deferred<void>();
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";
    s.addTargetLanguage("de-DE");
    s.addTargetLanguage("fr-FR");

    const ps: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps.PullStream);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, audioConfig);
    objsToClose.push(r);

    let removedPrimary: boolean = false;
    let postResetSuccess: boolean = false;

    r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        try {
            if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {

                if (!removedPrimary) {
                    // Before removal: verify both languages present
                    expect(e.result.translations.get("de-DE", "")).toBeTruthy();
                    expect(e.result.translations.get("fr-FR", "")).toBeTruthy();
                    // Remove primary language (de-DE at index 0) — triggers resetTurn
                    r.removeTargetLanguage("de-DE");
                    removedPrimary = true;
                    ps.StartRepeat();
                } else if (!e.result.translations.languages.includes("de-DE")) {
                    // After reset: de-DE removed, fr-FR still present
                    expect(e.result.translations.get("fr-FR", "")).toBeTruthy();
                    postResetSuccess = true;
                    r.stopContinuousRecognitionAsync(
                        (): void => {
                            done.resolve();
                        },
                        (err: string): void => {
                            done.reject(err);
                        });
                    return;
                } else {
                    // In-flight result may still have old languages
                    ps.StartRepeat();
                }
            }
        } catch (error) {
            done.reject(error as string);
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            done.reject(e.errorDetails);
        }
    };

    r.startContinuousRecognitionAsync(
        (): void => {
            // started
        },
        (err: string): void => {
            done.reject(err);
        });

    await done.promise;
    expect(postResetSuccess).toBeTruthy();
}, 30000);

test("Remove primary target language without synthesis continues recognition", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Remove primary target language without synthesis continues recognition");
    const done: Deferred<void> = new Deferred<void>();
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    // No voiceName — synthesis is NOT configured, so resetTurn should not be triggered
    s.addTargetLanguage("de-DE");
    s.addTargetLanguage("fr-FR");

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            done.reject(e.errorDetails);
        }
    };

    r.recognizeOnceAsync(
        (res: sdk.TranslationRecognitionResult): void => {
            try {
                expect(res.reason).toEqual(sdk.ResultReason.TranslatedSpeech);
                expect(res.translations.get("de-DE", "")).toBeTruthy();
                expect(res.translations.get("fr-FR", "")).toBeTruthy();

                // Remove primary language without synthesis — no resetTurn triggered
                r.removeTargetLanguage("de-DE");
                expect(r.targetLanguages.includes("de-DE")).toBeFalsy();

                r.recognizeOnceAsync(
                    (secondRes: sdk.TranslationRecognitionResult): void => {
                        try {
                            expect(secondRes.reason).toEqual(sdk.ResultReason.TranslatedSpeech);
                            expect(secondRes.translations.get("fr-FR", "")).toBeTruthy();
                            expect(secondRes.translations.languages.includes("de-DE")).toBeFalsy();
                            done.resolve();
                        } catch (error) {
                            done.reject(error as string);
                        }
                    },
                    (error: string): void => {
                        done.reject(error);
                    });
            } catch (error) {
                done.reject(error as string);
            }
        },
        (error: string): void => {
            done.reject(error);
        });

    await done.promise;
}, 30000);

test("Remove non-primary target language does not trigger reset", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Remove non-primary target language does not trigger reset");
    const done: Deferred<void> = new Deferred<void>();
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";
    s.addTargetLanguage("de-DE");
    s.addTargetLanguage("fr-FR");

    const r: sdk.TranslationRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            done.reject(e.errorDetails);
        }
    };

    r.recognizeOnceAsync(
        (res: sdk.TranslationRecognitionResult): void => {
            try {
                expect(res.reason).toEqual(sdk.ResultReason.TranslatedSpeech);
                expect(res.translations.get("de-DE", "")).toBeTruthy();
                expect(res.translations.get("fr-FR", "")).toBeTruthy();

                // Remove non-primary language (fr-FR at index 1) — no resetTurn
                r.removeTargetLanguage("fr-FR");
                expect(r.targetLanguages.includes("fr-FR")).toBeFalsy();
                expect(r.targetLanguages.includes("de-DE")).toBeTruthy();

                r.recognizeOnceAsync(
                    (secondRes: sdk.TranslationRecognitionResult): void => {
                        try {
                            expect(secondRes.reason).toEqual(sdk.ResultReason.TranslatedSpeech);
                            expect(secondRes.translations.get("de-DE", "")).toBeTruthy();
                            expect(secondRes.translations.languages.includes("fr-FR")).toBeFalsy();
                            done.resolve();
                        } catch (error) {
                            done.reject(error as string);
                        }
                    },
                    (error: string): void => {
                        done.reject(error);
                    });
            } catch (error) {
                done.reject(error as string);
            }
        },
        (error: string): void => {
            done.reject(error);
        });

    await done.promise;
}, 30000);

test("Recognition continues with correct offsets after primary language reset", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Recognition continues with correct offsets after primary language reset");
    const done: Deferred<void> = new Deferred<void>();
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";
    s.addTargetLanguage("de-DE");
    s.addTargetLanguage("fr-FR");

    const ps: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps.PullStream);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, audioConfig);
    objsToClose.push(r);

    let recognizedCount: number = 0;
    const offsets: number[] = [];

    r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        try {
            if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
                recognizedCount++;
                offsets.push(e.result.offset);

                if (recognizedCount === 2) {
                    // Remove primary language after 2nd phrase — triggers resetTurn
                    r.removeTargetLanguage("de-DE");
                }

                if (recognizedCount >= 5) {
                    r.stopContinuousRecognitionAsync(
                        (): void => {
                            // Verify offsets are monotonically non-decreasing
                            for (let i: number = 1; i < offsets.length; i++) {
                                expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]);
                            }
                            done.resolve();
                        },
                        (err: string): void => {
                            done.reject(err);
                        });
                    return;
                }
                ps.StartRepeat();
            }
        } catch (error) {
            done.reject(error as string);
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            done.reject(e.errorDetails);
        }
    };

    r.startContinuousRecognitionAsync(
        (): void => {
            // started
        },
        (err: string): void => {
            done.reject(err);
        });

    await done.promise;
    expect(recognizedCount).toBeGreaterThanOrEqual(5);
}, 60000);

test("Add remove primary add back full lifecycle", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: Add remove primary add back full lifecycle");
    const done: Deferred<void> = new Deferred<void>();
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.voiceName = "de-DE-KatjaNeural";
    s.addTargetLanguage("de-DE");

    const ps: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps.PullStream);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(s, audioConfig);
    objsToClose.push(r);

    let recognizedCount: number = 0;
    let sawDeOnly: boolean = false;

    r.recognized = (o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        try {
            if (e.result.reason === sdk.ResultReason.TranslatedSpeech) {
                recognizedCount++;
                const langs: string[] = e.result.translations.languages;

                // Track phases
                if (langs.includes("de-DE") && !langs.includes("fr-FR")) {
                    sawDeOnly = true;
                }

                switch (recognizedCount) {
                    case 1:
                        // Phase 1: [de-DE] → add fr-FR
                        r.addTargetLanguage("fr-FR");
                        break;
                    case 3:
                        // Phase 2: [de-DE, fr-FR] → remove de-DE (primary, triggers reset)
                        r.removeTargetLanguage("de-DE");
                        break;
                    case 5:
                        // Phase 3: [fr-FR] → add de-DE back
                        r.addTargetLanguage("de-DE");
                        break;
                    case 7:
                        // Phase 4: [fr-FR, de-DE] → verify and stop
                        r.stopContinuousRecognitionAsync(
                            (): void => {
                                done.resolve();
                            },
                            (err: string): void => {
                                done.reject(err);
                            });
                        return;
                }
                ps.StartRepeat();
            }
        } catch (error) {
            done.reject(error as string);
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            done.reject(e.errorDetails);
        }
    };

    r.startContinuousRecognitionAsync(
        (): void => {
            // started
        },
        (err: string): void => {
            done.reject(err);
        });

    await done.promise;

    // Verify we observed expected phases
    expect(sawDeOnly).toBeTruthy();
    expect(recognizedCount).toBeGreaterThanOrEqual(7);
}, 60000);
