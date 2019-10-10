// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
// import {
//     ConsoleLoggingListener,
//     WebsocketMessageAdapter,
// } from "../src/common.browser/Exports";
// import {
//     Events,
//     EventType,
// } from "../src/common/Exports";
// import { Settings } from "./Settings";
// import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

// import { PropertyId } from "../src/sdk/Exports";
// import WaitForCondition from "./Utilities";
// import { validateTelemetry } from "./TelemetryUtil";
// import { ServiceRecognizerBase } from "../src/common.speech/Exports";

let objsToClose: any[];

beforeAll(() => {
    // Override inputs, if necessary
    // Settings.LoadSettings();
    // Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
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

test("Play TTS from a file", () => {
    // tslint:disable-next-line:no-console
    console.info("Name:Play audio from a file");
    // expect(() => sdk.DialogServiceConfig.fromBotSecret(null, null, null)).toThrowError();
});

