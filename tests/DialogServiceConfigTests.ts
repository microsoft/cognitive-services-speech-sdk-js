// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
    WebsocketMessageAdapter,
} from "../src/common.browser/Exports";
import {
    Events,
    EventType,
} from "../src/common/Exports";
import { Settings } from "./Settings";
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

test("Create DialogServiceConfig from bot secret, null params", () => {
    expect(() => sdk.DialogServiceConfig.fromBotSecret(null, null, null)).toThrowError();
});

test("Create DialogServiceConfig from bot secret, null subscription and region", () => {
    expect(() => sdk.DialogServiceConfig.fromBotSecret(Settings.BotSecret, null, null)).toThrowError();
});

test("Create DialogServiceConfig from bot secret, null botSecret", () => {
    expect(() => sdk.DialogServiceConfig.fromBotSecret(null, Settings.SpeechSubscriptionKey, null)).toThrowError();
});

test("Create DialogServiceConfig from bot secret, null Region", () => {
    expect(() => sdk.DialogServiceConfig.fromBotSecret(Settings.BotSecret, Settings.SpeechSubscriptionKey, null)).toThrowError();
});

// test("Create DialogServiceConfig from bot secret, valid params", () => {

// })
