// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

//
// Tests for PostProcessingOption speech.context enrichment.
//
// These tests intercept the speech.context message sent to the service and verify
// that the correct enrichment fields are serialized for each PostProcessingOption value.
//
// "TrueText" is expanded client-side into punctuation/disfluency fields per recognition mode.
// All other strings (e.g. "PostRefinement") are forwarded as postprocessingoption to the service.
//
// Mandatory settings (see README.md):
//   Settings.SpeechSubscriptionKey
//   Settings.SpeechRegion
//

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { SpeechContext } from "../src/common.speech/ServiceMessages/SpeechContext";
import { Events, Deferred } from "../src/common/Exports";

import { SpeechConfigConnectionFactory } from "./SpeechConfigConnectionFactories";
import { Settings } from "./Settings";
import { closeAsyncObjects } from "./Utilities";
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
    jest.setTimeout(12000);
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

const BuildSpeechConfig: () => Promise<sdk.SpeechConfig> = async (): Promise<sdk.SpeechConfig> => {
    const s: sdk.SpeechConfig = await SpeechConfigConnectionFactory.getSpeechRecognitionConfig();

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

describe.each([true, false])("Post Processing Option tests", (forceNodeWebSocket: boolean): void => {

    beforeAll((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    // Verifies that "TrueText" is expanded client-side into punctuation/disfluency fields
    // for Interactive mode (recognizeOnceAsync), and that no postprocessingoption string is sent.
    test("testTrueTextEnrichmentInteractiveMode", async (): Promise<void> => {
        const done: Deferred<void> = new Deferred<void>();

        const s: sdk.SpeechConfig = await BuildSpeechConfig();
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "TrueText");
        objsToClose.push(s);

        const a: sdk.AutoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromLanguages(["en-US", "de-DE"]);
        objsToClose.push(a);

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
        const r: sdk.SpeechRecognizer = sdk.SpeechRecognizer.FromConfig(s, a, config);
        expect(r).not.toBeUndefined();
        objsToClose.push(r);

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message: SpeechContext = JSON.parse(args.message.TextMessage) as SpeechContext;
                try {
                    expect(message.phraseDetection).not.toBeUndefined();
                    expect(message.phraseDetection.enrichment).not.toBeUndefined();
                    const interactive = message.phraseDetection.enrichment.interactive;
                    expect(interactive).not.toBeUndefined();
                    expect(interactive.punctuationMode).toEqual("Implicit");
                    expect(interactive.disfluencyMode).toEqual("Removed");
                    expect(interactive.intermediatePunctuationMode).toEqual("Implicit");
                    expect((interactive as Record<string, unknown>).intermediatedisfluencymode).toEqual("Removed");
                    expect(interactive.postprocessingoption).toBeUndefined();
                    done.resolve();
                } catch (error) {
                    done.reject(error);
                }
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.reject(error);
            }
        };

        r.recognizeOnceAsync((): void => { /* context assertion already resolved done */ },
            (error: string): void => { done.reject(error); });

        await done.promise;
    });

    // Verifies that "TrueText" is expanded client-side into dictation enrichment fields
    // when enableDictation() is set (continuous recognition uses Dictation mode).
    test("testTrueTextEnrichmentDictationMode", async (): Promise<void> => {
        const done: Deferred<void> = new Deferred<void>();

        const s: sdk.SpeechConfig = await BuildSpeechConfig();
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "TrueText");
        s.enableDictation();
        objsToClose.push(s);

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        expect(r).not.toBeUndefined();
        objsToClose.push(r);

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message: SpeechContext = JSON.parse(args.message.TextMessage) as SpeechContext;
                try {
                    expect(message.phraseDetection).not.toBeUndefined();
                    expect(message.phraseDetection.enrichment).not.toBeUndefined();
                    const dictation = message.phraseDetection.enrichment.dictation;
                    expect(dictation).not.toBeUndefined();
                    expect(dictation.punctuationMode).toEqual("Implicit");
                    expect(dictation.disfluencyMode).toEqual("Removed");
                    expect(dictation.intermediatePunctuationMode).toEqual("Implicit");
                    expect((dictation as Record<string, unknown>).intermediatedisfluencymode).toEqual("Removed");
                    expect(dictation.postprocessingoption).toBeUndefined();
                    done.resolve();
                } catch (error) {
                    done.reject(error);
                }
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.reject(error);
            }
        };

        r.startContinuousRecognitionAsync(
            (): void => { /* context assertion resolves done, stop is handled by afterEach cleanup */ },
            (error: string): void => { done.reject(error); });

        await done.promise;
    });

    // Verifies that non-TrueText values are forwarded as postprocessingoption to the service
    // without any client-side punctuation/disfluency expansion.
    test("testPostRefinementPassthroughContext", async (): Promise<void> => {
        const done: Deferred<void> = new Deferred<void>();

        const s: sdk.SpeechConfig = await BuildSpeechConfig();
        s.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "PostRefinement");
        objsToClose.push(s);

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        expect(r).not.toBeUndefined();
        objsToClose.push(r);

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message: SpeechContext = JSON.parse(args.message.TextMessage) as SpeechContext;
                try {
                    expect(message.phraseDetection).not.toBeUndefined();
                    expect(message.phraseDetection.enrichment).not.toBeUndefined();
                    const interactive = message.phraseDetection.enrichment.interactive;
                    expect(interactive).not.toBeUndefined();
                    expect(interactive.postprocessingoption).toEqual("PostRefinement");
                    expect(interactive.punctuationMode).toBeUndefined();
                    expect(interactive.disfluencyMode).toBeUndefined();
                    expect(interactive.intermediatePunctuationMode).toBeUndefined();
                    expect((interactive as Record<string, unknown>).intermediatedisfluencymode).toBeUndefined();
                    done.resolve();
                } catch (error) {
                    done.reject(error);
                }
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.reject(error);
            }
        };

        r.recognizeOnceAsync((): void => { /* context assertion already resolved done */ },
            (error: string): void => { done.reject(error); });

        await done.promise;
    });

    // Verifies that without PostProcessingOption set, no enrichment fields appear in speech.context.
    test("testNoPostProcessingOptionNoEnrichmentFields", async (): Promise<void> => {
        const done: Deferred<void> = new Deferred<void>();

        const s: sdk.SpeechConfig = await BuildSpeechConfig();
        objsToClose.push(s);

        const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);
        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
        expect(r).not.toBeUndefined();
        objsToClose.push(r);

        const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

        con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
            if (args.message.path === "speech.context" && args.message.isTextMessage) {
                const message: SpeechContext = JSON.parse(args.message.TextMessage) as SpeechContext;
                try {
                    const interactive = message.phraseDetection?.enrichment?.interactive;
                    expect(interactive?.postprocessingoption).toBeUndefined();
                    expect(interactive?.punctuationMode).toBeUndefined();
                    expect(interactive?.disfluencyMode).toBeUndefined();
                    done.resolve();
                } catch (error) {
                    done.reject(error);
                }
            }
        };

        r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.reject(error);
            }
        };

        r.recognizeOnceAsync((): void => { /* context assertion already resolved done */ },
            (error: string): void => { done.reject(error); });

        await done.promise;
    });
});
