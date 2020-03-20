// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { Events, EventType } from "../src/common/Exports";
import { Settings } from "./Settings";
import WaitForCondition from "./Utilities";

let objsToClose: any[];

beforeAll(() => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
    jest.setTimeout(600000);
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
    // tslint:disable-next-line:no-console
    console.info("Start Time: " + new Date(Date.now()).toLocaleString());
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

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {

    let s: sdk.SpeechConfig;
    if (undefined === Settings.SpeechEndpoint) {
        s = sdk.SpeechConfig.fromSubscription(Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    } else {
        s = sdk.SpeechConfig.fromEndpoint(new URL(Settings.SpeechEndpoint), Settings.SpeechSubscriptionKey);
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

const CheckSynthesisResult: (result: sdk.SpeechSynthesisResult, reason: sdk.ResultReason) =>
    void = (result: sdk.SpeechSynthesisResult,  reason: sdk.ResultReason): void => {
    expect(result).not.toBeUndefined();
    expect(result.reason).toEqual(reason);
    switch (reason) {
        case sdk.ResultReason.SynthesizingAudio:
        case sdk.ResultReason.SynthesizingAudioCompleted:
            expect(result.audioData).not.toBeUndefined();
            expect(result.audioData.byteLength).toBeGreaterThan(0);
            break;
        case sdk.ResultReason.SynthesizingAudioStarted:
            expect(result.audioData).toBeUndefined();
            break;
    }
};

test("testSpeechSynthesizer1", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testSpeechSynthesizer1");
    const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();

    const config: sdk.AudioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

    const r: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.SpeechSynthesizer);
});

test("testSetAndGetParameters", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testSetAndGetParameters");
    const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
    speechConfig.speechSynthesisLanguage = "zh-CN";
    speechConfig.speechSynthesisVoiceName = "zh-CN-HuihuiRUS";
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
    expect(speechConfig.speechSynthesisOutputFormat).toEqual(sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3);
    const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
    objsToClose.push(s);

    expect(s.properties).not.toBeUndefined();

    expect(s.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_SynthLanguage)).toEqual("zh-CN");
    expect(s.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_SynthVoice)).toEqual("zh-CN-HuihuiRUS");
    expect(s.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_SynthOutputFormat))
        .toEqual(sdk.SpeechSynthesisOutputFormat[sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3]);
});

describe.each([true])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("testSpeechSynthesizerEvent1", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerEvent1");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        let audioLength: number = 0;
        let startEventCount: number = 0;
        let synthesisingEventCount: number = 0;
        let completeEventCount: number = 0;

        s.synthesisStarted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            // tslint:disable-next-line:no-console
            console.info("Synthesis started.");
            CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioStarted);
            startEventCount += 1;
        };

        s.synthesizing = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            // tslint:disable-next-line:no-console
            console.info("Audio received with length of " + e.result.audioData.byteLength);
            audioLength += e.result.audioData.byteLength - 44;
            CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudio);
            synthesisingEventCount += 1;
        };

        s.synthesisCompleted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            // tslint:disable-next-line:no-console
            console.info("Audio received with length of " + e.result.audioData.byteLength);
            CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioCompleted);
            expect(e.result.audioData.byteLength - 44).toEqual(audioLength);
            completeEventCount += 1;
        };

        s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
            expect(e).not.toBeUndefined();
        };

        s.speakTextAsync("hello world.", undefined, (e: string): void => {
            done.fail(e);
        });

        WaitForCondition( (): boolean => {
            return completeEventCount !== 0;
        }, (): void => {
            expect(startEventCount).toEqual(1);
            expect(synthesisingEventCount).toBeGreaterThan(0);
            done();
        });
    });

    test("testSpeechSynthesizerSpeakTwice", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerSpeakTwice");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 1");
        }, (e: string): void => {
            done.fail(e);
        });

        s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 2");
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizerToFile", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerToFile");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();

        const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromAudioFileOutput("test.wav");
        expect(audioConfig).not.toBeUndefined();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        expect(s).not.toBeUndefined();

        let audioLength: number = 0;

        s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 1");
            audioLength += result.audioData.byteLength;
        }, (e: string): void => {
            done.fail(e);
        });

        s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 2");
            audioLength += result.audioData.byteLength;
            s.close();
            const fileLength = fs.statSync("test.wav").size;
            expect(fileLength).toEqual(audioLength - 44);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizerWordBoundary", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerWordBoundary");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

        expect(s).not.toBeUndefined();

        let wordBoundaryCount: number = 0;

        s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
            expect(e).not.toBeUndefined();
            expect(e.audioOffset).not.toBeUndefined();
            expect(e.text).not.toBeUndefined();
            expect(e.textOffset).not.toBeUndefined();
            expect(e.wordLength).not.toBeUndefined();
            wordBoundaryCount += 1;
        };

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            expect(wordBoundaryCount).toBeGreaterThan(0);
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });
});
