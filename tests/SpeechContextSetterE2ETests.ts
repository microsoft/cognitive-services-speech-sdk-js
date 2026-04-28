// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * End-to-end wire-inspection tests for the speech.context setter methods.
 *
 * PURPOSE:
 *   These tests verify that when you set SDK properties on a SpeechConfig,
 *   the corresponding fields actually appear in the speech.context JSON message
 *   sent over the WebSocket to the Speech service.
 *
 * HOW THEY WORK:
 *   1. Create a SpeechConfig and set specific properties (e.g., language, timeout)
 *   2. Create a SpeechRecognizer with a known WAV audio file
 *   3. Intercept the "speech.context" message that the SDK sends over the wire
 *   4. Parse the JSON and verify it contains the expected fields
 *
 * WHAT YOU NEED:
 *   - A valid Speech service subscription key and region configured in test settings
 *   - The test audio files in tests/input/audio/
 *
 * INPUT → OUTPUT SUMMARY:
 *   ┌──────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
 *   │  SDK Property (INPUT)                        │  speech.context JSON field (OUTPUT)                         │
 *   ├──────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
 *   │  speechRecognitionLanguage = "en-US"         │  phraseDetection.language = "en-US"                        │
 *   │  InitialSilenceTimeoutMs = "5000"            │  phraseDetection.initialSilenceTimeout = 5000              │
 *   │  EndSilenceTimeoutMs = "2000"                │  phraseDetection.trailingSilenceTimeout = 2000             │
 *   │  ProfanityOption = "Raw"                     │  phraseDetection.enrichment.profanity = "Raw"              │
 *   │  PostProcessingOption = "someValue"          │  phraseDetection.enrichment.interactive                    │
 *   │                                              │    .postprocessingoption = "someValue"                     │
 *   │  PostProcessingOption = "truetext"           │  phraseDetection.enrichment.interactive                    │
 *   │                                              │    .punctuationMode = "Implicit"                           │
 *   │                                              │    .disfluencyMode = "Removed"                             │
 *   │                                              │    (postprocessingoption must NOT be set)                  │
 *   │  StablePartialResultThreshold = "3"          │  phraseOutput.interimResults.stableThreshold = 3           │
 *   └──────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
 */

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import { Events } from "../src/common/Exports";
import { Settings } from "./Settings";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helper: check that subscription credentials are configured
// ---------------------------------------------------------------------------

function requireCredentials(): void {
    if (!Settings.SpeechSubscriptionKey
        || Settings.SpeechSubscriptionKey === "<<YOUR_SUBSCRIPTION_KEY>>"
        || !Settings.SpeechRegion
        || Settings.SpeechRegion === "<<YOUR_REGION>>") {
        throw new Error(
            "Speech subscription key and region must be configured to run E2E tests. " +
            "See tests/CONFIGURATION.md for setup instructions."
        );
    }
}

// ---------------------------------------------------------------------------
// Helper: build a SpeechConfig (subscription-based)
// ---------------------------------------------------------------------------

function buildSpeechConfig(): sdk.SpeechConfig {
    requireCredentials();
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
}

// ---------------------------------------------------------------------------
// Helper: build a recognizer from a WAV file
// ---------------------------------------------------------------------------

function buildRecognizerFromWaveFile(speechConfig: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer {
    const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(
        fileName === undefined ? Settings.WaveFile : fileName
    );
    if (speechConfig.speechRecognitionLanguage === undefined) {
        speechConfig.speechRecognitionLanguage = Settings.WaveFileLanguage;
    }
    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    expect(r).not.toBeUndefined();
    return r;
}

// ---------------------------------------------------------------------------
// Helper: capture the speech.context JSON from the wire
//
// Returns a Promise that resolves with the parsed speech.context object.
// The recognizer runs recognizeOnceAsync and we intercept the message.
// ---------------------------------------------------------------------------

interface SpeechContextJson {
    phraseDetection?: {
        language?: string;
        initialSilenceTimeout?: number;
        trailingSilenceTimeout?: number;
        enrichment?: {
            profanity?: string;
            interactive?: Record<string, unknown>;
            conversation?: Record<string, unknown>;
            dictation?: Record<string, unknown>;
        };
        [key: string]: unknown;
    };
    phraseOutput?: {
        interimResults?: {
            stableThreshold?: number;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

function captureSpeechContext(recognizer: sdk.SpeechRecognizer): Promise<SpeechContextJson> {
    return new Promise<SpeechContextJson>((resolve, reject) => {
        const con: sdk.Connection = sdk.Connection.fromRecognizer(recognizer);
        let captured = false;

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (!captured && args.message.path === "speech.context" && args.message.isTextMessage) {
                captured = true;
                try {
                    const ctx = JSON.parse(args.message.TextMessage) as SpeechContextJson;
                    resolve(ctx);
                } catch (error) {
                    reject(error);
                }
            }
        };

        recognizer.canceled = (_: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            if (!captured) {
                // If canceled before we got speech.context, still let it try
                // But if it's an error, report it
                if (e.reason === sdk.CancellationReason.Error) {
                    reject(new Error("Recognition canceled with error: " + e.errorDetails));
                }
            }
        };

        recognizer.recognizeOnceAsync(
            (_result: sdk.SpeechRecognitionResult): void => {
                // Recognition complete — if we haven't captured speech.context by now, fail
                if (!captured) {
                    reject(new Error("Recognition completed but speech.context message was never intercepted"));
                }
            },
            (error: string): void => {
                reject(new Error("recognizeOnceAsync error: " + error));
            }
        );
    });
}

// ===================================================================
//  TEST: Language appears in speech.context
// ===================================================================
//
//  INPUT:  speechRecognitionLanguage = "en-US"
//  OUTPUT: speech.context JSON → phraseDetection.language === "en-US"
//

describe("speech.context wire inspection", () => {

    test("Language property appears as phraseDetection.language in speech.context", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "en-US";

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: phraseDetection.language is "en-US"
        expect(ctx.phraseDetection).toBeDefined();
        expect(ctx.phraseDetection.language).toEqual("en-US");
    }, 15000);

    // ===================================================================
    //  TEST: InitialSilenceTimeout appears in speech.context
    // ===================================================================
    //
    //  INPUT:  SpeechServiceConnection_InitialSilenceTimeoutMs = "5000"
    //  OUTPUT: speech.context JSON → phraseDetection.initialSilenceTimeout === 5000 (number)
    //

    test("InitialSilenceTimeoutMs property appears as phraseDetection.initialSilenceTimeout", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: initialSilenceTimeout is the number 5000 (not the string "5000")
        expect(ctx.phraseDetection).toBeDefined();
        expect(ctx.phraseDetection.initialSilenceTimeout).toEqual(5000);
        expect(typeof ctx.phraseDetection.initialSilenceTimeout).toEqual("number");
    }, 15000);

    // ===================================================================
    //  TEST: EndSilenceTimeout appears in speech.context
    // ===================================================================
    //
    //  INPUT:  SpeechServiceConnection_EndSilenceTimeoutMs = "2000"
    //  OUTPUT: speech.context JSON → phraseDetection.trailingSilenceTimeout === 2000 (number)
    //

    test("EndSilenceTimeoutMs property appears as phraseDetection.trailingSilenceTimeout", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "2000");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: trailingSilenceTimeout is the number 2000
        expect(ctx.phraseDetection).toBeDefined();
        expect(ctx.phraseDetection.trailingSilenceTimeout).toEqual(2000);
        expect(typeof ctx.phraseDetection.trailingSilenceTimeout).toEqual("number");
    }, 15000);

    // ===================================================================
    //  TEST: ProfanityOption appears in speech.context
    // ===================================================================
    //
    //  INPUT:  SpeechServiceResponse_ProfanityOption = "Raw"
    //  OUTPUT: speech.context JSON → phraseDetection.enrichment.profanity === "Raw"
    //

    test("ProfanityOption property appears as phraseDetection.enrichment.profanity", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_ProfanityOption, "Raw");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: profanity is "Raw"
        expect(ctx.phraseDetection).toBeDefined();
        expect(ctx.phraseDetection.enrichment).toBeDefined();
        expect(ctx.phraseDetection.enrichment.profanity).toEqual("Raw");
    }, 15000);

    // ===================================================================
    //  TEST: PostProcessingOption (non-truetext) appears in speech.context
    // ===================================================================
    //
    //  INPUT:  SpeechServiceResponse_PostProcessingOption = "myCustomOption"
    //  OUTPUT: speech.context JSON → phraseDetection.enrichment.interactive
    //            .postprocessingoption === "myCustomOption"
    //

    test("PostProcessingOption (non-truetext) appears as enrichment.interactive.postprocessingoption", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "myCustomOption");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: postprocessingoption is set on the interactive enrichment
        expect(ctx.phraseDetection).toBeDefined();
        expect(ctx.phraseDetection.enrichment).toBeDefined();
        expect(ctx.phraseDetection.enrichment.interactive).toBeDefined();
        expect(ctx.phraseDetection.enrichment.interactive.postprocessingoption).toEqual("myCustomOption");
    }, 15000);

    // ===================================================================
    //  TEST: PostProcessingOption "truetext" expands to specific fields
    // ===================================================================
    //
    //  INPUT:  SpeechServiceResponse_PostProcessingOption = "truetext"
    //  OUTPUT: speech.context JSON → phraseDetection.enrichment.interactive contains:
    //            .punctuationMode = "Implicit"
    //            .disfluencyMode = "Removed"
    //            .intermediatePunctuationMode = "Implicit"
    //            .intermediatedisfluencymode = "Removed"
    //          AND postprocessingoption must NOT be set (client-side expansion)
    //

    test("PostProcessingOption 'truetext' expands to punctuationMode/disfluencyMode (NOT postprocessingoption)", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "truetext");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: truetext is expanded into specific fields
        const interactive = ctx.phraseDetection?.enrichment?.interactive;
        expect(interactive).toBeDefined();
        expect(interactive.punctuationMode).toEqual("Implicit");
        expect(interactive.disfluencyMode).toEqual("Removed");
        expect(interactive.intermediatePunctuationMode).toEqual("Implicit");
        expect(interactive.intermediatedisfluencymode).toEqual("Removed");

        // VERIFY: postprocessingoption must NOT be set (truetext is expanded client-side)
        expect(interactive.postprocessingoption).toBeUndefined();
    }, 15000);

    // ===================================================================
    //  TEST: StablePartialResultThreshold appears in speech.context
    // ===================================================================
    //
    //  INPUT:  SpeechServiceResponse_StablePartialResultThreshold = "3"
    //  OUTPUT: speech.context JSON → phraseOutput.interimResults.stableThreshold === 3 (number)
    //

    test("StablePartialResultThreshold property appears as phraseOutput.interimResults.stableThreshold", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "3");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: stableThreshold is the number 3 (not the string "3")
        expect(ctx.phraseOutput).toBeDefined();
        expect(ctx.phraseOutput.interimResults).toBeDefined();
        expect(ctx.phraseOutput.interimResults.stableThreshold).toEqual(3);
        expect(typeof ctx.phraseOutput.interimResults.stableThreshold).toEqual("number");
    }, 15000);

    // ===================================================================
    //  TEST: All 6 properties compose in a single speech.context message
    // ===================================================================
    //
    //  INPUT:  Set all 6 properties at once:
    //            language = "en-US"
    //            initialSilenceTimeout = "8000"
    //            endSilenceTimeout = "3000"
    //            profanity = "Masked"
    //            postProcessingOption = "truetext"
    //            stableThreshold = "5"
    //
    //  OUTPUT: All fields appear in ONE speech.context JSON without
    //          overwriting each other (deep-merge correctness)
    //

    test("All 6 properties compose correctly in a single speech.context message", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        s.speechRecognitionLanguage = "en-US";
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "8000");
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "3000");
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_ProfanityOption, "Masked");
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "truetext");
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_StablePartialResultThreshold, "5");

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: phraseDetection fields
        expect(ctx.phraseDetection.language).toEqual("en-US");
        expect(ctx.phraseDetection.initialSilenceTimeout).toEqual(8000);
        expect(ctx.phraseDetection.trailingSilenceTimeout).toEqual(3000);

        // VERIFY: profanity
        expect(ctx.phraseDetection.enrichment.profanity).toEqual("Masked");

        // VERIFY: truetext expansion
        expect(ctx.phraseDetection.enrichment.interactive.punctuationMode).toEqual("Implicit");
        expect(ctx.phraseDetection.enrichment.interactive.disfluencyMode).toEqual("Removed");

        // VERIFY: phraseOutput
        expect(ctx.phraseOutput.interimResults.stableThreshold).toEqual(5);
    }, 20000);

    // ===================================================================
    //  TEST: Properties NOT set → fields NOT present in speech.context
    // ===================================================================
    //
    //  INPUT:  No extra properties set (only default language from test setup)
    //  OUTPUT: speech.context JSON should NOT contain:
    //            - phraseDetection.initialSilenceTimeout
    //            - phraseDetection.trailingSilenceTimeout
    //            - phraseDetection.enrichment.profanity
    //            - phraseOutput.interimResults.stableThreshold
    //

    test("When no extra properties are set, optional fields are absent from speech.context", async () => {
        const s = buildSpeechConfig();
        objsToClose.push(s);
        // Only set language (which BuildRecognizerFromWaveFile does by default)

        const r = buildRecognizerFromWaveFile(s);
        objsToClose.push(r);

        const ctx = await captureSpeechContext(r);

        // VERIFY: optional fields are not present
        expect(ctx.phraseDetection?.initialSilenceTimeout).toBeUndefined();
        expect(ctx.phraseDetection?.trailingSilenceTimeout).toBeUndefined();
        expect(ctx.phraseDetection?.enrichment?.profanity).toBeUndefined();
        // stableThreshold should not be set either
        if (ctx.phraseOutput?.interimResults) {
            expect(ctx.phraseOutput.interimResults.stableThreshold).toBeUndefined();
        }
    }, 15000);
});
