// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { beforeAll, beforeEach, afterEach, describe, expect, jest, test } from "@jest/globals";
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
    s.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "999999");
    s.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "9999999");

    return s;
};

test("SwapTranslationLanguages", async (): Promise<void> => {
    const testDone: Deferred<void> = new Deferred<void>();

    const config: sdk.SpeechTranslationConfig = BuildSpeechConfig();
    config.addTargetLanguage("de");
    config.voiceName = "personal-voice";
    config.setProxy("localhost", 8888);

    const targetLanguages: string[] = ["fr", "en", "es"];
    let currentTargetLanguageNum: number = 0;
    let currentTargetLanguage: string = "de";
    let synthesisCount: number = 0;
    let fragmentCount: number = 0;

    const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.InputDir + "aboutSpeechSdk.wav");
    const recognizer: sdk.TranslationRecognizer = sdk.TranslationRecognizer.FromConfig(config, sdk.AutoDetectSourceLanguageConfig.fromOpenRange(), audioConfig);
    objsToClose.push(recognizer);

    let changeLanguage: boolean = true;

    recognizer.recognizing = (s: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        // eslint-disable-next-line no-console
        console.info("Recognizing: FragmentCount: " + (fragmentCount++).toString() + " ChangeLanguage: " + changeLanguage.toString() + " Text: " + e.result.text);
        if (changeLanguage) {
            changeLanguage = false;
            const newLanguage: string = targetLanguages[currentTargetLanguageNum++ % targetLanguages.length];

            // eslint-disable-next-line no-console
            console.info("Changing target language from: " + currentTargetLanguage + " to: " + newLanguage);

            //recognizer.addTargetLanguage(newLanguage);
            //recognizer.removeTargetLanguage(currentTargetLanguage);
            currentTargetLanguage = newLanguage;
        }
    };

    recognizer.sessionStopped = (s: sdk.Recognizer, e: sdk.SessionEventArgs): void => {
        // eslint-disable-next-line no-console
        console.info("Session stopped event. Stopping recognition.");

        testDone.resolve();
    };

    recognizer.recognized = (s: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionEventArgs): void => {
        // eslint-disable-next-line no-console
        console.info("Recognized: " + e.result.text);
        changeLanguage = true;
    };

    recognizer.synthesizing = (s: sdk.TranslationRecognizer, e: sdk.TranslationSynthesisEventArgs): void => {
        // eslint-disable-next-line no-console
        console.info("Synthesizing: " + sdk.ResultReason[e.result.reason] + " Count: " + (synthesisCount++).toString());
    };

    recognizer.canceled = (s: sdk.TranslationRecognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            testDone.reject("Recognition failed: " + e.errorDetails);
        }
    };

    const started: Deferred<void> = new Deferred<void>();
    recognizer.startContinuousRecognitionAsync(started.resolve, started.reject);
    await started.promise;

    return testDone.promise;
}, 60000);
