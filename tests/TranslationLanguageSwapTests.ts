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
    s.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "999999");
    s.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "9999999");

    return s;
};

// ----------------------------------------------------------------------------
// Phase-state-machine helper.
//
// These tests guard a regression where mutating target languages mid-turn
// (during continuous recognition) would silently break the translation
// synthesis pipeline so that no audio was emitted for subsequent phrases.
// Asserting that recognized text comes back is NOT sufficient — the recognizer
// has separate code paths for `updateLanguages()` (non-primary changes) and
// `primaryTargetLanguageChanged()` + `resetTurn()` (primary change while
// synthesis is configured), and the latter is the one that previously broke
// audio delivery. Each test therefore drives a phase machine that requires
// BOTH a `recognized` event matching the expected language set AND
// (when synthesis is configured) at least one `SynthesizingAudioCompleted`
// event before advancing to the next phase. Synth fragments and completions
// are bucketed to the current phase only after a matching `recognized` has
// been seen, so audio events from in-flight phrases that crossed a mutation
// boundary cannot be miscredited to the next phase.
// ----------------------------------------------------------------------------

interface PhaseSpec {
    expectSynthesis: boolean;
    expectedLanguages: string[];
    transition?: (r: sdk.TranslationRecognizer) => void;
}

interface PhaseResult {
    offsets: number[];
    recognizedCount: number[];
    synthByteCount: number[];
    synthCompleteCount: number[];
    synthFragmentCount: number[];
}

const PHASE_DEADLINE_MS: number = 25000;

const sameLanguageSet = (actual: string[], expected: string[]): boolean => {
    if (actual.length !== expected.length) {
        return false;
    }
    const a: string[] = [...actual].sort();
    const b: string[] = [...expected].sort();
    return a.every((v: string, i: number): boolean => v === b[i]);
};

const runContinuousLanguageSwapTest = async (
    speechConfig: sdk.SpeechTranslationConfig,
    initialLanguages: string[],
    phases: PhaseSpec[]
): Promise<PhaseResult> => {

    // eslint-disable-next-line no-console
    console.info(`Running test with initialLanguages=[${initialLanguages.join(",")}], phases=[${phases.map((p: PhaseSpec): string => `{expectSynthesis=${String(p.expectSynthesis)}, expectedLanguages=[${p.expectedLanguages.join(",")}]}`).join(", ")}]`);

    for (const lang of initialLanguages) {
        speechConfig.addTargetLanguage(lang);
    }

    const ps: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(ps.PullStream);

    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(speechConfig, audioConfig);
    objsToClose.push(r);

    const result: PhaseResult = {
        offsets: [],
        recognizedCount: phases.map((): number => 0),
        synthByteCount: phases.map((): number => 0),
        synthCompleteCount: phases.map((): number => 0),
        synthFragmentCount: phases.map((): number => 0),
    };

    const done: Deferred<void> = new Deferred<void>();
    let currentPhase: number = 0;
    let recognizedSeen: boolean = false;
    let synthSeen: boolean = false;
    let transitionFired: boolean = false;
    let finished: boolean = false;
    let phaseDeadlineTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (action: () => void): void => {
        if (finished) {
            return;
        }
        finished = true;
        if (phaseDeadlineTimer !== undefined) {
            clearTimeout(phaseDeadlineTimer);
            phaseDeadlineTimer = undefined;
        }
        action();
    };

    const fail = (msg: string): void => {
        finish((): void => {
            done.reject(msg);
        });
    };

    const armPhaseDeadline = (): void => {
        if (phaseDeadlineTimer !== undefined) {
            clearTimeout(phaseDeadlineTimer);
        }
        const phaseAtArm: number = currentPhase;
        phaseDeadlineTimer = setTimeout((): void => {
            if (finished || currentPhase !== phaseAtArm) {
                return;
            }
            const p: PhaseSpec = phases[phaseAtArm];
            fail(
                `Phase ${phaseAtArm} deadline (${PHASE_DEADLINE_MS}ms) hit. ` +
                `expectedLanguages=[${p.expectedLanguages.join(",")}], ` +
                `expectSynthesis=${String(p.expectSynthesis)}, ` +
                `recognizedSeen=${String(recognizedSeen)}, synthSeen=${String(synthSeen)}, ` +
                `recognizedCount=${result.recognizedCount[phaseAtArm]}, ` +
                `synthFragmentCount=${result.synthFragmentCount[phaseAtArm]}, ` +
                `synthCompleteCount=${result.synthCompleteCount[phaseAtArm]}.`);
        }, PHASE_DEADLINE_MS);
    };

    const tryAdvance = (): boolean => {
        if (finished || currentPhase >= phases.length) {
            return false;
        }
        const phase: PhaseSpec = phases[currentPhase];
        if (!recognizedSeen) {
            return false;
        }
        if (phase.expectSynthesis && !synthSeen) {
            return false;
        }

        currentPhase++;
        recognizedSeen = false;
        synthSeen = false;
        transitionFired = false;

        if (currentPhase >= phases.length) {
            // eslint-disable-next-line no-console
            console.info(`All phases completed. Total recognizedCount=${result.recognizedCount.reduce((a: number, b: number): number => a + b, 0)}, synthFragmentCount=${result.synthFragmentCount.reduce((a: number, b: number): number => a + b, 0)}, synthCompleteCount=${result.synthCompleteCount.reduce((a: number, b: number): number => a + b, 0)}.`);
            if (phaseDeadlineTimer !== undefined) {
                clearTimeout(phaseDeadlineTimer);
                phaseDeadlineTimer = undefined;
            }
            // eslint-disable-next-line no-console
            console.info("Stopping recognition and finishing test.");
            r.stopContinuousRecognitionAsync(
                (): void => finish((): void => {
                    done.resolve();
                }),
                (err: string): void => fail(err));
            return true;
        }

        ps.StartRepeat();
        armPhaseDeadline();
        return true;
    };

    r.recognized = (_o: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        if (finished) {
            return;
        }
        // eslint-disable-next-line no-console
        console.info(`Recognized event at offset ${e.result.offset}: reason=${sdk.ResultReason[e.result.reason]}, languages=[${e.result.translations.languages.join(",")}], text="${e.result.text}"`);
        try {
            if (e.result.reason !== sdk.ResultReason.TranslatedSpeech) {
                // eslint-disable-next-line no-console
                console.info(`Ignoring non-TranslatedSpeech result at offset ${e.result.offset}: ${sdk.ResultReason[e.result.reason]}`);
                return;
            }
            if (currentPhase >= phases.length) {
                // eslint-disable-next-line no-console
                console.info(`Ignoring TranslatedSpeech result at offset ${e.result.offset} after final phase: expectedLanguages=[${phases[phases.length - 1].expectedLanguages.join(",")}], actualLanguages=[${e.result.translations.languages.join(",")}]`);
                return;
            }
            result.offsets.push(e.result.offset);
            const phase: PhaseSpec = phases[currentPhase];
            const langs: string[] = e.result.translations.languages;

            if (sameLanguageSet(langs, phase.expectedLanguages)) {
                if (e.result.text !== undefined && e.result.text.length > 0) {
                    for (const lang of phase.expectedLanguages) {
                        expect(e.result.translations.get(lang, "")).toBeTruthy();
                    }
                    result.recognizedCount[currentPhase]++;
                    recognizedSeen = true;

                    // Fire the phase transition (language mutation) at the moment the
                    // customer sees finalized translation text — that's when a real
                    // application would decide to switch languages — rather than
                    // waiting for synthesis completion.
                    if (!transitionFired && phase.transition !== undefined) {
                        transitionFired = true;
                        const phaseAtFire: number = currentPhase;
                        try {
                            // eslint-disable-next-line no-console
                            console.info(`Phase ${phaseAtFire} firing transition on recognized event at offset ${e.result.offset}.`);
                            phase.transition(r);
                        } catch (transitionErr) {
                            fail(`Transition from phase ${phaseAtFire} threw: ${(transitionErr as Error).message ?? String(transitionErr)}`);
                            return;
                        }
                    }
                }
                // eslint-disable-next-line no-console
                console.info(`Phase ${currentPhase} recognized event matches expected languages. recognizedCount=${result.recognizedCount[currentPhase]}, synthFragmentCount=${result.synthFragmentCount[currentPhase]}, synthCompleteCount=${result.synthCompleteCount[currentPhase]}.`);

                const advanced: boolean = tryAdvance();
                // For synth-required phases that did not advance (still waiting on
                // SynthesizingAudioCompleted) we deliberately do NOT pump more audio:
                // emitting more phrases here would interleave with the pending synth
                // for the just-recognized phrase and risk mis-bucketing.
                if (!advanced && !phase.expectSynthesis) {
                    // eslint-disable-next-line no-console
                    console.info(`Phase ${currentPhase} did not advance and does not expect synthesis. Restarting repeat.`);
                    ps.StartRepeat();
                }
            } else {
                // eslint-disable-next-line no-console
                console.info(`Recognized event at offset ${e.result.offset} does not match expected languages for phase ${currentPhase}. expectedLanguages=[${phase.expectedLanguages.join(",")}], actualLanguages=[${langs.join(",")}].`);
                // Transitional / in-flight result: language list reflects the previous
                // service-side state (the mutation hasn't taken effect yet on the wire).
                // Pump audio so the service produces another phrase under the new state.
                ps.StartRepeat();
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`recognized handler error: ${(err as Error).message ?? String(err)}`);
            fail(`recognized handler error: ${(err as Error).message ?? String(err)}`);
        }
    };

    r.synthesizing = (_o: sdk.Recognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        if (finished) {
            return;
        }
        const audioLen: number = e.result.audio ? e.result.audio.byteLength : 0;
        // eslint-disable-next-line no-console
        console.info(`Synthesizing event: reason=${sdk.ResultReason[e.result.reason]}, audioLength=${audioLen}`);
        try {
            if (currentPhase >= phases.length) {
                // eslint-disable-next-line no-console
                console.info("Ignoring synthesis event after final phase.");
                return;
            }
            switch (e.result.reason) {
                case sdk.ResultReason.SynthesizingAudio:
                    // Only credit fragments to the current phase once a matching
                    // `recognized` for this phase has been observed. This prevents
                    // straggling audio from a transitional/in-flight phrase
                    // (delivered after a primary-language reset) from being
                    // miscredited to the next phase.
                    if (!recognizedSeen) {
                        return;
                    }
                    expect(e.result.audio).toBeDefined();
                    expect(e.result.audio.byteLength).toBeGreaterThan(0);
                    result.synthFragmentCount[currentPhase]++;
                    result.synthByteCount[currentPhase] += e.result.audio.byteLength;
                    break;
                case sdk.ResultReason.SynthesizingAudioCompleted:
                    // eslint-disable-next-line no-console
                    console.info(`SynthesizingAudioCompleted event for phase ${currentPhase}. synthFragmentCount=${result.synthFragmentCount[currentPhase]}, synthByteCount=${result.synthByteCount[currentPhase]}.`);
                    if (!recognizedSeen) {
                        return;
                    }
                    result.synthCompleteCount[currentPhase]++;
                    synthSeen = true;
                    tryAdvance();
                    break;
                case sdk.ResultReason.Canceled:
                    fail(`Synthesis Canceled at phase ${currentPhase} ` +
                        `(expectedLanguages=[${phases[currentPhase].expectedLanguages.join(",")}]).`);
                    break;
                default:
                    break;
            }
        } catch (err) {
            fail(`synthesizing handler error: ${(err as Error).message ?? String(err)}`);
        }
    };

    r.canceled = (_o: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            fail(`Recognition canceled with error at phase ${currentPhase}: ${e.errorDetails}`);
        }
    };

    armPhaseDeadline();

    r.startContinuousRecognitionAsync(
        (): void => { /* started */ },
        (err: string): void => fail(`startContinuousRecognitionAsync failed: ${err}`));

    await done.promise;
    return result;
};

// ----------------------------------------------------------------------------
// Tests
// ----------------------------------------------------------------------------

test("Continuous: remove primary with synthesis - synthesis continues after reset", async (): Promise<void> => {
    // Primary change with a configured synthesis voice exercises
    // primaryTargetLanguageChanged() + the deferred resetTurn() path. The
    // regression we're guarding against was that synthesis events stopped
    // arriving for phrases produced after the reset.
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);
    s.voiceName = "de-DE-KatjaNeural";

    const result: PhaseResult = await runContinuousLanguageSwapTest(s, ["de-DE", "fr-FR"], [
        {
            expectSynthesis: true, expectedLanguages: ["de-DE", "fr-FR"],
            transition: (r: sdk.TranslationRecognizer): void => r.removeTargetLanguage("de-DE"),
        },
        {
            expectSynthesis: true, expectedLanguages: ["fr-FR"],
        },
    ]);

    // Each synthesis-required phase must have produced both a completed
    // synthesis and non-empty audio bytes — proving the synth pipeline
    // survived the resetTurn().
    expect(result.recognizedCount[0]).toBeGreaterThan(0);
    expect(result.recognizedCount[1]).toBeGreaterThan(0);
    expect(result.synthCompleteCount[0]).toBeGreaterThan(0);
    expect(result.synthCompleteCount[1]).toBeGreaterThan(0);
    expect(result.synthFragmentCount[0]).toBeGreaterThan(0);
    expect(result.synthFragmentCount[1]).toBeGreaterThan(0);
    expect(result.synthByteCount[0]).toBeGreaterThan(0);
    expect(result.synthByteCount[1]).toBeGreaterThan(0);

    // Offsets across the entire continuous turn (including the reset boundary)
    // must remain monotonically non-decreasing.
    for (let i: number = 1; i < result.offsets.length; i++) {
        expect(result.offsets[i]).toBeGreaterThanOrEqual(result.offsets[i - 1]);
    }
}, 90000);

test("Continuous: remove primary without synthesis - recognition continues, no synth events", async (): Promise<void> => {
    // Without a configured voice, removing the primary takes the
    // updateLanguages() path (no resetTurn). Recognition must continue
    // and no synthesis events of any kind must be emitted.
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const result: PhaseResult = await runContinuousLanguageSwapTest(s, ["de-DE", "fr-FR"], [
        {
            expectSynthesis: false, expectedLanguages: ["de-DE", "fr-FR"],
            transition: (r: sdk.TranslationRecognizer): void => r.removeTargetLanguage("de-DE"),
        },
        {
            expectSynthesis: false, expectedLanguages: ["fr-FR"],
        },
    ]);

    expect(result.recognizedCount[0]).toBeGreaterThan(0);
    expect(result.recognizedCount[1]).toBeGreaterThan(0);

    const totalSynthFragments: number =
        result.synthFragmentCount.reduce((a: number, b: number): number => a + b, 0);
    const totalSynthCompletes: number =
        result.synthCompleteCount.reduce((a: number, b: number): number => a + b, 0);
    expect(totalSynthFragments).toBe(0);
    expect(totalSynthCompletes).toBe(0);
}, 90000);

test("Continuous: remove non-primary with synthesis - primary synthesis uninterrupted", async (): Promise<void> => {
    // Removing a non-primary language must NOT trigger resetTurn even with
    // synthesis configured. The primary's synth events should keep flowing
    // through the mutation without disruption.
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);
    s.voiceName = "de-DE-KatjaNeural";

    const result: PhaseResult = await runContinuousLanguageSwapTest(s, ["de-DE", "fr-FR"], [
        {
            expectSynthesis: true, expectedLanguages: ["de-DE", "fr-FR"],
            transition: (r: sdk.TranslationRecognizer): void => r.removeTargetLanguage("fr-FR"),
        },
        {
            expectSynthesis: true, expectedLanguages: ["de-DE"],
        },
    ]);

    expect(result.recognizedCount[0]).toBeGreaterThan(0);
    expect(result.recognizedCount[1]).toBeGreaterThan(0);
    expect(result.synthCompleteCount[0]).toBeGreaterThan(0);
    expect(result.synthCompleteCount[1]).toBeGreaterThan(0);
    expect(result.synthByteCount[0]).toBeGreaterThan(0);
    expect(result.synthByteCount[1]).toBeGreaterThan(0);
}, 90000);

test("Continuous: add language mid-turn with synthesis - synthesis continues", async (): Promise<void> => {
    // addTargetLanguage always takes the updateLanguages() path. Synth must
    // continue uninterrupted, and subsequent phrases must include the new
    // target language.
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);
    s.voiceName = "de-DE-KatjaNeural";

    const result: PhaseResult = await runContinuousLanguageSwapTest(s, ["de-DE"], [
        {
            expectSynthesis: true, expectedLanguages: ["de-DE"],
            transition: (r: sdk.TranslationRecognizer): void => r.addTargetLanguage("fr-FR"),
        },
        {
            expectSynthesis: true, expectedLanguages: ["de-DE", "fr-FR"],
        },
    ]);

    expect(result.recognizedCount[0]).toBeGreaterThan(0);
    expect(result.recognizedCount[1]).toBeGreaterThan(0);
    expect(result.synthCompleteCount[0]).toBeGreaterThan(0);
    expect(result.synthCompleteCount[1]).toBeGreaterThan(0);
    expect(result.synthByteCount[0]).toBeGreaterThan(0);
    expect(result.synthByteCount[1]).toBeGreaterThan(0);
}, 90000);

test("Continuous: full lifecycle add then remove primary then re-add - synthesis in every phase", async (): Promise<void> => {
    // Stresses every mutation path inside a single continuous turn: a
    // non-primary add, a primary remove (resetTurn path), and a primary
    // re-add. Synthesis events MUST be observed for every phase — that is
    // the regression the original tests were added to catch.
    const s: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    objsToClose.push(s);
    s.voiceName = "de-DE-KatjaNeural";

    const result: PhaseResult = await runContinuousLanguageSwapTest(s, ["de-DE"], [
        {
            expectSynthesis: true, expectedLanguages: ["de-DE"],
            transition: (r: sdk.TranslationRecognizer): void => r.addTargetLanguage("fr-FR"),
        },
        {
            expectSynthesis: true, expectedLanguages: ["de-DE", "fr-FR"],
            transition: (r: sdk.TranslationRecognizer): void => r.removeTargetLanguage("de-DE"),
        },
        {
            expectSynthesis: true, expectedLanguages: ["fr-FR"],
            transition: (r: sdk.TranslationRecognizer): void => r.addTargetLanguage("de-DE"),
        },
        {
            expectSynthesis: true, expectedLanguages: ["fr-FR", "de-DE"],
        },
    ]);

    for (let i: number = 0; i < 4; i++) {
        expect(result.recognizedCount[i]).toBeGreaterThan(0);
        expect(result.synthCompleteCount[i]).toBeGreaterThan(0);
        expect(result.synthFragmentCount[i]).toBeGreaterThan(0);
        expect(result.synthByteCount[i]).toBeGreaterThan(0);
    }
}, 150000);
