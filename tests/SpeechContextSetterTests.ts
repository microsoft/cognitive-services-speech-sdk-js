// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Unit tests for the 6 speech.context setter methods added to ServiceRecognizerBase:
 *   setLanguageJson, setInitialSilenceTimeoutJson, setEndSilenceTimeoutJson,
 *   setProfanityOptionJson, setPostProcessingOptionJson, setStableIntermediateThresholdJson
 *
 * Strategy: We bypass the ServiceRecognizerBase constructor (which requires many complex deps)
 * by using Object.create() and manually wiring only the fields the setters depend on:
 *   - privSpeechContext  (SpeechContext)
 *   - privRecognizerConfig (RecognizerConfig — specifically .parameters and .autoDetectSourceLanguages)
 *   - recognitionMode (via privRecognizerConfig.recognitionMode)
 *
 * We mock modules that trigger circular dependency chains (AudioConfig → common.browser → sdk)
 * so that importing ServiceRecognizerBase doesn't break the test suite.
 */

// Break the barrel-export circular dependency chains before any imports
// The chain is: sdk/Exports → AudioInputStream → common.speech/Exports → Transcription/Exports
//             → ConversationTranslatorRecognizer → SessionEventArgs (not yet resolved)
jest.mock("../src/sdk/Audio/AudioConfig", () => ({}));
jest.mock("../src/sdk/Audio/AudioInputStream", () => ({}));
jest.mock("../src/sdk/Audio/AudioOutputStream", () => ({}));
jest.mock("../src/common.browser/Exports", () => ({}));
jest.mock("../src/common.speech/Transcription/Exports", () => ({}));

import { PropertyCollection } from "../src/sdk/PropertyCollection";
import { PropertyId } from "../src/sdk/PropertyId";
import { DynamicGrammarBuilder } from "../src/common.speech/DynamicGrammarBuilder";
import { SpeechContext } from "../src/common.speech/SpeechContext";
import { RecognizerConfig } from "../src/common.speech/RecognizerConfig";
import { Context, SpeechServiceConfig } from "../src/common.speech/SpeechServiceConfig";
import { RecognitionMode } from "../src/common.speech/ServiceMessages/PhraseDetection/PhraseDetectionContext";
import { ProfanityHandlingMode } from "../src/common.speech/ServiceMessages/PhraseDetection/Enrichment";
import { InteractivePunctuationMode } from "../src/common.speech/ServiceMessages/PhraseDetection/InteractiveEnrichmentOptions";
import { ConversationPunctuationMode } from "../src/common.speech/ServiceMessages/PhraseDetection/ConversationEnrichmentOptions";
import { DictationPunctuationMode } from "../src/common.speech/ServiceMessages/PhraseDetection/DictationEnrichmentOptions";
import { DisfluencyMode } from "../src/common.speech/ServiceMessages/PhraseDetection/DisfluencyMode";
import { ServiceRecognizerBase } from "../src/common.speech/ServiceRecognizerBase";
import { SpeechContext as SpeechServiceContext } from "../src/common.speech/ServiceMessages/SpeechContext";
import { Settings } from "./Settings";

beforeAll((): void => {
    Settings.LoadSettings();
});

// eslint-disable-next-line no-console
beforeEach((): void => console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------"));

// ---------------------------------------------------------------------------
// Test harness: create a "bare" ServiceRecognizerBase that only has the fields
// the setters touch, without invoking the real constructor.
// ---------------------------------------------------------------------------

interface TestableRecognizer {
    privSpeechContext: SpeechContext;
    privRecognizerConfig: RecognizerConfig;
    setLanguageJson(): void;
    setInitialSilenceTimeoutJson(): void;
    setEndSilenceTimeoutJson(): void;
    setProfanityOptionJson(): void;
    setPostProcessingOptionJson(): void;
    setStableIntermediateThresholdJson(): void;
    recognitionMode: RecognitionMode;
}

function createTestRecognizer(mode: RecognitionMode = RecognitionMode.Interactive): TestableRecognizer {
    const params = new PropertyCollection();
    const config = new RecognizerConfig(
        new SpeechServiceConfig(new Context(null)),
        params,
    );
    config.recognitionMode = mode;

    const dgBuilder = new DynamicGrammarBuilder();
    const speechContext = new SpeechContext(dgBuilder);

    // Build a bare instance from the prototype — avoids complex constructor deps
    const instance = Object.create(ServiceRecognizerBase.prototype) as TestableRecognizer;
    instance.privSpeechContext = speechContext;
    instance.privRecognizerConfig = config;

    return instance;
}

function getContext(rec: TestableRecognizer): SpeechServiceContext {
    return rec.privSpeechContext.getContext();
}

// ===================================================================
// setLanguageJson
// ===================================================================

describe("setLanguageJson", () => {
    test("sets phraseDetection.language when property is present", () => {
        const rec = createTestRecognizer();
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");

        rec.setLanguageJson();

        const ctx = getContext(rec);
        expect(ctx.phraseDetection).toBeDefined();
        expect(ctx.phraseDetection.language).toEqual("en-US");
    });

    test("clears phraseDetection.language when property is absent", () => {
        const rec = createTestRecognizer();
        // Pre-seed a language to verify it gets removed
        getContext(rec).phraseDetection = { language: "de-DE" };

        rec.setLanguageJson();

        expect(getContext(rec).phraseDetection.language).toBeUndefined();
    });

    test("clears language when autoDetectSourceLanguages is configured", () => {
        const rec = createTestRecognizer();
        // Set both language AND auto-detect — auto-detect should win
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, "en-US,fr-FR");

        rec.setLanguageJson();

        expect(getContext(rec).phraseDetection).toBeDefined();
        expect(getContext(rec).phraseDetection.language).toBeUndefined();
    });

    test("does not overwrite sibling phraseDetection fields", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = { mode: RecognitionMode.Interactive, initialSilenceTimeout: 5000 };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "ja-JP");

        rec.setLanguageJson();

        const pd = getContext(rec).phraseDetection;
        expect(pd.language).toEqual("ja-JP");
        expect(pd.mode).toEqual(RecognitionMode.Interactive);
        expect(pd.initialSilenceTimeout).toEqual(5000);
    });
});

// ===================================================================
// setInitialSilenceTimeoutJson
// ===================================================================

describe("setInitialSilenceTimeoutJson", () => {
    test("sets phraseDetection.initialSilenceTimeout as integer", () => {
        const rec = createTestRecognizer();
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");

        rec.setInitialSilenceTimeoutJson();

        expect(getContext(rec).phraseDetection.initialSilenceTimeout).toEqual(5000);
        // Verify it's a number, not a string
        expect(typeof getContext(rec).phraseDetection.initialSilenceTimeout).toEqual("number");
    });

    test("clears initialSilenceTimeout when property is absent", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = { initialSilenceTimeout: 3000 };

        rec.setInitialSilenceTimeoutJson();

        expect(getContext(rec).phraseDetection.initialSilenceTimeout).toBeUndefined();
    });

    test("does not overwrite sibling phraseDetection fields", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = { language: "en-US", trailingSilenceTimeout: 2000 };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "10000");

        rec.setInitialSilenceTimeoutJson();

        const pd = getContext(rec).phraseDetection;
        expect(pd.initialSilenceTimeout).toEqual(10000);
        expect(pd.language).toEqual("en-US");
        expect(pd.trailingSilenceTimeout).toEqual(2000);
    });
});

// ===================================================================
// setEndSilenceTimeoutJson
// ===================================================================

describe("setEndSilenceTimeoutJson", () => {
    test("sets phraseDetection.trailingSilenceTimeout as integer", () => {
        const rec = createTestRecognizer();
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "2000");

        rec.setEndSilenceTimeoutJson();

        expect(getContext(rec).phraseDetection.trailingSilenceTimeout).toEqual(2000);
        expect(typeof getContext(rec).phraseDetection.trailingSilenceTimeout).toEqual("number");
    });

    test("clears trailingSilenceTimeout when property is absent", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = { trailingSilenceTimeout: 1500 };

        rec.setEndSilenceTimeoutJson();

        expect(getContext(rec).phraseDetection.trailingSilenceTimeout).toBeUndefined();
    });

    test("does not overwrite sibling phraseDetection fields", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = { initialSilenceTimeout: 5000 };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000");

        rec.setEndSilenceTimeoutJson();

        const pd = getContext(rec).phraseDetection;
        expect(pd.trailingSilenceTimeout).toEqual(3000);
        expect(pd.initialSilenceTimeout).toEqual(5000);
    });
});

// ===================================================================
// setProfanityOptionJson
// ===================================================================

describe("setProfanityOptionJson", () => {
    test("sets phraseDetection.enrichment.profanity when property is present", () => {
        const rec = createTestRecognizer();
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_ProfanityOption, "Raw");

        rec.setProfanityOptionJson();

        const enrichment = getContext(rec).phraseDetection.enrichment;
        expect(enrichment).toBeDefined();
        expect(enrichment.profanity).toEqual("Raw");
    });

    test("clears profanity when property is absent", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = { enrichment: { profanity: ProfanityHandlingMode.Masked } };

        rec.setProfanityOptionJson();

        expect(getContext(rec).phraseDetection.enrichment.profanity).toBeUndefined();
    });

    test("does not overwrite sibling enrichment fields", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseDetection = {
            enrichment: {
                interactive: { postprocessingoption: "someOption" }
            }
        };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_ProfanityOption, "Removed");

        rec.setProfanityOptionJson();

        const enrichment = getContext(rec).phraseDetection.enrichment;
        expect(enrichment.profanity).toEqual("Removed");
        expect(enrichment.interactive.postprocessingoption).toEqual("someOption");
    });

    test("handles absent enrichment gracefully when clearing", () => {
        const rec = createTestRecognizer();
        // phraseDetection exists but enrichment does not
        getContext(rec).phraseDetection = {};

        rec.setProfanityOptionJson();

        // Should not throw; profanity just stays undefined
        expect(getContext(rec).phraseDetection.enrichment).toBeUndefined();
    });
});

// ===================================================================
// setPostProcessingOptionJson
// ===================================================================

describe("setPostProcessingOptionJson", () => {
    test("sets postprocessingoption for Interactive mode with non-truetext value", () => {
        const rec = createTestRecognizer(RecognitionMode.Interactive);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "someOption");

        rec.setPostProcessingOptionJson();

        const enrichment = getContext(rec).phraseDetection.enrichment;
        expect(enrichment.interactive).toBeDefined();
        expect(enrichment.interactive.postprocessingoption).toEqual("someOption");
    });

    test("sets postprocessingoption for Conversation mode", () => {
        const rec = createTestRecognizer(RecognitionMode.Conversation);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "custom");

        rec.setPostProcessingOptionJson();

        const enrichment = getContext(rec).phraseDetection.enrichment;
        expect(enrichment.conversation).toBeDefined();
        expect(enrichment.conversation.postprocessingoption).toEqual("custom");
    });

    test("sets postprocessingoption for Dictation mode", () => {
        const rec = createTestRecognizer(RecognitionMode.Dictation);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "dict_opt");

        rec.setPostProcessingOptionJson();

        const enrichment = getContext(rec).phraseDetection.enrichment;
        expect(enrichment.dictation).toBeDefined();
        expect(enrichment.dictation.postprocessingoption).toEqual("dict_opt");
    });

    test("expands truetext to punctuationMode and disfluencyMode for Interactive", () => {
        const rec = createTestRecognizer(RecognitionMode.Interactive);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "truetext");

        rec.setPostProcessingOptionJson();

        const interactive = getContext(rec).phraseDetection.enrichment.interactive;
        expect(interactive.punctuationMode).toEqual(InteractivePunctuationMode.Implicit);
        expect(interactive.disfluencyMode).toEqual(DisfluencyMode.Removed);
        expect(interactive.intermediatePunctuationMode).toEqual(InteractivePunctuationMode.Implicit);
        expect((interactive as Record<string, unknown>).intermediatedisfluencymode).toEqual(DisfluencyMode.Removed);
        // postprocessingoption should NOT be set for truetext (client-side expansion)
        expect(interactive.postprocessingoption).toBeUndefined();
    });

    test("expands TrueText (case-insensitive) for Conversation mode", () => {
        const rec = createTestRecognizer(RecognitionMode.Conversation);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "TrueText");

        rec.setPostProcessingOptionJson();

        const conversation = getContext(rec).phraseDetection.enrichment.conversation;
        expect(conversation.punctuationMode).toEqual(ConversationPunctuationMode.Implicit);
        expect(conversation.disfluencyMode).toEqual(DisfluencyMode.Removed);
        expect(conversation.postprocessingoption).toBeUndefined();
    });

    test("expands truetext for Dictation mode", () => {
        const rec = createTestRecognizer(RecognitionMode.Dictation);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "TRUETEXT");

        rec.setPostProcessingOptionJson();

        const dictation = getContext(rec).phraseDetection.enrichment.dictation;
        expect(dictation.punctuationMode).toEqual(DictationPunctuationMode.Implicit);
        expect(dictation.disfluencyMode).toEqual(DisfluencyMode.Removed);
        expect(dictation.postprocessingoption).toBeUndefined();
    });

    test("clears stale fields when property is absent", () => {
        const rec = createTestRecognizer(RecognitionMode.Interactive);
        // Pre-seed postprocessing fields
        getContext(rec).phraseDetection = {
            enrichment: {
                interactive: {
                    postprocessingoption: "old",
                    punctuationMode: InteractivePunctuationMode.Implicit,
                    disfluencyMode: DisfluencyMode.Removed,
                }
            }
        };

        // Now call with property absent (undefined)
        rec.setPostProcessingOptionJson();

        const interactive = getContext(rec).phraseDetection.enrichment.interactive;
        expect(interactive.postprocessingoption).toBeUndefined();
        expect(interactive.punctuationMode).toBeUndefined();
        expect(interactive.disfluencyMode).toBeUndefined();
    });

    test("clears stale truetext fields when switching to non-truetext value", () => {
        const rec = createTestRecognizer(RecognitionMode.Interactive);
        // Pre-seed truetext expansion
        getContext(rec).phraseDetection = {
            enrichment: {
                interactive: {
                    punctuationMode: InteractivePunctuationMode.Implicit,
                    disfluencyMode: DisfluencyMode.Removed,
                    intermediatePunctuationMode: InteractivePunctuationMode.Implicit,
                }
            }
        };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "newOption");

        rec.setPostProcessingOptionJson();

        const interactive = getContext(rec).phraseDetection.enrichment.interactive;
        expect(interactive.postprocessingoption).toEqual("newOption");
        // truetext expansion fields should be cleared
        expect(interactive.punctuationMode).toBeUndefined();
        expect(interactive.disfluencyMode).toBeUndefined();
        expect(interactive.intermediatePunctuationMode).toBeUndefined();
    });

    test("does not overwrite sibling enrichment fields like profanity", () => {
        const rec = createTestRecognizer(RecognitionMode.Interactive);
        getContext(rec).phraseDetection = {
            enrichment: {
                profanity: ProfanityHandlingMode.Raw
            }
        };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "opt1");

        rec.setPostProcessingOptionJson();

        const enrichment = getContext(rec).phraseDetection.enrichment;
        expect(enrichment.profanity).toEqual(ProfanityHandlingMode.Raw);
        expect(enrichment.interactive.postprocessingoption).toEqual("opt1");
    });
});

// ===================================================================
// setStableIntermediateThresholdJson
// ===================================================================

describe("setStableIntermediateThresholdJson", () => {
    test("sets phraseOutput.interimResults.stableThreshold as integer", () => {
        const rec = createTestRecognizer();
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "3");

        rec.setStableIntermediateThresholdJson();

        const phraseOutput = getContext(rec).phraseOutput;
        expect(phraseOutput).toBeDefined();
        expect(phraseOutput.interimResults).toBeDefined();
        expect(phraseOutput.interimResults.stableThreshold).toEqual(3);
        expect(typeof phraseOutput.interimResults.stableThreshold).toEqual("number");
    });

    test("clears stableThreshold when property is absent", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseOutput = { interimResults: { stableThreshold: 5 } };

        rec.setStableIntermediateThresholdJson();

        expect(getContext(rec).phraseOutput.interimResults.stableThreshold).toBeUndefined();
    });

    test("handles absent interimResults gracefully when clearing", () => {
        const rec = createTestRecognizer();
        getContext(rec).phraseOutput = {};

        rec.setStableIntermediateThresholdJson();

        // Should not throw; phraseOutput should still be defined
        expect(getContext(rec).phraseOutput).toBeDefined();
    });

    test("deep-merges — does not replace existing phraseOutput.detailed", () => {
        const rec = createTestRecognizer();
        // Pre-seed phraseOutput with detailed options (as setLanguageIdJson might do)
        getContext(rec).phraseOutput = {
            format: "Detailed" as any,
            detailed: { options: ["WordTimings" as any] },
        };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "7");

        rec.setStableIntermediateThresholdJson();

        const phraseOutput = getContext(rec).phraseOutput;
        expect(phraseOutput.interimResults.stableThreshold).toEqual(7);
        // Existing fields preserved
        expect(phraseOutput.format).toEqual("Detailed");
        expect(phraseOutput.detailed.options).toContain("WordTimings");
    });

    test("works correctly when called after setLanguageIdJson populates phraseOutput", () => {
        const rec = createTestRecognizer();
        // Simulate what setLanguageIdJson does — creates phraseOutput with interimResults
        getContext(rec).phraseOutput = {
            interimResults: { resultType: "Auto" as any },
        };
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "4");

        rec.setStableIntermediateThresholdJson();

        const interimResults = getContext(rec).phraseOutput.interimResults;
        expect(interimResults.stableThreshold).toEqual(4);
        // resultType from setLanguageIdJson should be preserved
        expect(interimResults.resultType).toEqual("Auto");
    });
});

// ===================================================================
// Cross-setter deep-merge: multiple setters applied sequentially
// ===================================================================

describe("Deep-merge across multiple setters", () => {
    test("all setters compose without replacing each other's fields", () => {
        const rec = createTestRecognizer(RecognitionMode.Interactive);
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "fr-FR");
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "8000");
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000");
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_ProfanityOption, "Masked");
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_PostProcessingOption, "truetext");
        rec.privRecognizerConfig.parameters.setProperty(PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "5");

        // Call in the order the recognize() method calls them
        rec.setLanguageJson();
        rec.setInitialSilenceTimeoutJson();
        rec.setEndSilenceTimeoutJson();
        rec.setProfanityOptionJson();
        rec.setPostProcessingOptionJson();
        rec.setStableIntermediateThresholdJson();

        const ctx = getContext(rec);
        // phraseDetection fields
        expect(ctx.phraseDetection.language).toEqual("fr-FR");
        expect(ctx.phraseDetection.initialSilenceTimeout).toEqual(8000);
        expect(ctx.phraseDetection.trailingSilenceTimeout).toEqual(3000);
        expect(ctx.phraseDetection.enrichment.profanity).toEqual("Masked");
        // truetext expansion
        expect(ctx.phraseDetection.enrichment.interactive.punctuationMode).toEqual(InteractivePunctuationMode.Implicit);
        expect(ctx.phraseDetection.enrichment.interactive.disfluencyMode).toEqual(DisfluencyMode.Removed);
        // phraseOutput
        expect(ctx.phraseOutput.interimResults.stableThreshold).toEqual(5);
    });
});
