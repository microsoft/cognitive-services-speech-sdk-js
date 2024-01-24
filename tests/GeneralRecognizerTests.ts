// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { Settings } from "./Settings";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


let bufferSize: number;
beforeEach(() => {
    // eslint-disable-next-line no-console
    console.info("-------------------Starting test case: " + expect.getState().currentTestName + "---------------");
    // Override inputs, if necessary
    Settings.LoadSettings();
});

jest.retryTimes(Settings.RetryCount);

test("testRecognizer1", () => {
    const s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r = new sdk.IntentRecognizer(s, config);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("testRecognizer2", () => {
    const s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r = new sdk.SpeechRecognizer(s, config);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});

test("testRecognizer3", () => {
    const s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const r = new sdk.SpeakerRecognizer(s, config);
    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.SpeakerRecognizer);

    r.close();
    s.close();
});
/*
// TODO does not work with microphone
test.skip("testRecognizer3", () => {
    const s = sdk.SpeechFactory.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(s).not.toBeUndefined();

    let targets: List<string> = new List<string>();
    targets.Add("en-US");

    const r = s.createTranslationRecognizer("en-US", targets.ToArray());
    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.Recognizer);

    r.close();
    s.close();
});
*/
