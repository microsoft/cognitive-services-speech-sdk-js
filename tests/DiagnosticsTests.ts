// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { Settings } from "./Settings";
import { closeAsyncObjects, WaitForCondition } from "./Utilities";


let objsToClose: any[];

beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
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

const BuildSpeechConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {

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
};

Settings.testIfNode("Debug Console output writes to log file", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Debug Console output writes to log file");

    sdk.Diagnostics.SetLoggingLevel(sdk.LogLevel.Debug);
    sdk.Diagnostics.SetLogOutputPath(Settings.TestLogPath);
    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
    objsToClose.push(r);

    let connected: boolean = false;
    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (): void => {
        connected = true;
    };

    connection.disconnected = (): void => {
        expect(fs.existsSync(Settings.TestLogPath)).toEqual(true);
        if (fs.existsSync(Settings.TestLogPath)) {
            const fileContents: string | Buffer = fs.readFileSync(Settings.TestLogPath);
            expect(fileContents.length).toBeGreaterThan(0);
            const firstLine = fileContents.toString().split("\n")[0];
            expect(firstLine.length).toBeGreaterThan(0);
            expect(firstLine.split(" | ")[1].endsWith("Event")).toEqual(true);
            fs.unlinkSync(Settings.TestLogPath);
        }
        done();
    };

    connection.openConnection();

    WaitForCondition((): boolean => connected, (): void => {
        connection.closeConnection();
    });
});

Settings.testIfDOMCondition("Diagnostics log file throws", (): void => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    sdk.Diagnostics.SetLoggingLevel(sdk.LogLevel.Debug);
    expect((): void => sdk.Diagnostics.SetLogOutputPath(Settings.TestLogPath)).toThrow();
});

test("Diagnostics callback works", (done: jest.DoneCallback): void => {
    sdk.Diagnostics.SetLoggingLevel(sdk.LogLevel.Debug);
    // eslint-disable-next-line no-console
    console.info("Name: callback invoked on debug output");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
    objsToClose.push(r);

    let callbackInvoked: boolean = false;
    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    const logCallback = (s: string): void => {
        void s;
        callbackInvoked = true;
    };

    sdk.Diagnostics.onLogOutput = logCallback;

    connection.openConnection();

    WaitForCondition((): boolean => callbackInvoked, (): void => {
        connection.closeConnection(() => done());
    });
});
