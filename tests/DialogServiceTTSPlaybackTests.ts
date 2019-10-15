// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
    WebsocketMessageAdapter,
} from "../src/common.browser/Exports";
import {
    Events,
    EventType,
} from "../src/common/Exports";
import { AudioStreamFormat } from "../src/sdk/Exports";
import { BaseAudioPlayer } from "../src/sdk/Audio/BaseAudioPlayer";
import { Settings } from "./Settings";
import { validateTelemetry } from "./TelemetryUtil";
import WaitForCondition from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

beforeAll(() => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linearly, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
    objsToClose = [];
    // tslint:disable-next-line:no-console
    console.info("---------------------------------------Starting test case-----------------------------------");
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

test("Play TTS from a file", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name:Play audio from a file");

    const audioFormat = AudioStreamFormat.getDefaultInputFormat();
    const audioPlayer: BaseAudioPlayer = new BaseAudioPlayer(audioFormat);

    let countData: number = 0;
    let countClose: number = 0;
    let error: number = 0;
    let lastError: string;
    fs.createReadStream(Settings.WaveFile, { highWaterMark: 4800 })
    .on("data", (buffer: Buffer) => {
        audioPlayer.playAudioSample(buffer);
        countData++;
        return;
    }).on("end", () => {
        countClose++;
        return;
    }).on("error", (err: any) => {
        lastError = err;
        error++;
        return;
    });

    WaitForCondition(() => {
        return (countClose > 0);
    }, () => {

        // tslint:disable-next-line:no-console
        console.info("countData: " + countData, " countClose: " + countClose);

        done();
        return;
    });

    // expect(() => sdk.DialogServiceConfig.fromBotSecret(null, null, null)).toThrowError();
});

