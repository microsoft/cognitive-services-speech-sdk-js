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

import { PropertyId } from "../src/sdk/Exports";
import WaitForCondition from "./Utilities";

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

function BuildDialogServiceConfig(): sdk.DialogServiceConfig {
    const config: sdk.DialogServiceConfig = sdk.DialogServiceConfig.fromBotSecret(Settings.BotSecret, Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    if (undefined !== Settings.proxyServer) {
        config.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(config).not.toBeUndefined();
    return config;
}

function BuildConnectorFromWaveFile(dialogServiceConfig?: sdk.DialogServiceConfig, audioFileName?: string): sdk.DialogServiceConnector {
    let connectorConfig: sdk.DialogServiceConfig = dialogServiceConfig;
    if (connectorConfig === undefined) {
        connectorConfig = BuildDialogServiceConfig();

        // Since we're not going to return it, mark it for closure.
        objsToClose.push(connectorConfig);
    }

    const f: File = WaveFileAudioInput.LoadFile(audioFileName === undefined ? Settings.WaveFile : audioFileName);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

    const language: string = Settings.WaveFileLanguage;
    if (connectorConfig.speechRecognitionLanguage === undefined) {
        connectorConfig.speechRecognitionLanguage = language;
    }

    const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(connectorConfig, audioConfig);
    expect(connector).not.toBeUndefined();

    return connector;
}

// DialogServiceConfig tests: begin
test("Create DialogServiceConfig from bot secret, null params", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create DialogServiceConfig from bot secret, null params");
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

// DialogServiceConfig tests: end

test("Create DialogServiceConnector", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create DialogServiceConnector");

    const connectorConfig: sdk.DialogServiceConfig = sdk.DialogServiceConfig.fromBotSecret(Settings.BotSecret, Settings.SpeechSubscriptionKey, Settings.SpeechRegion);
    expect(connectorConfig).not.toBeUndefined();

    const file: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(file);

    const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(connectorConfig, audioConfig);
    objsToClose.push(connector);

    expect(connector).not.toBeUndefined();
    expect(connector instanceof sdk.DialogServiceConnector);
});

describe.each([true, false])("Service-based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("Connect / Disconnect", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Connect / Disconnect");

        const dialogConfig: sdk.DialogServiceConfig = BuildDialogServiceConfig();
        objsToClose.push(dialogConfig);

        const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(dialogConfig);
        objsToClose.push(connector);

        let connected: boolean = false;
        const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

        expect(connector).not.toBeUndefined();

        connector.canceled = (sender: sdk.DialogServiceConnector, args: sdk.SpeechRecognitionCanceledEventArgs) => {
            // tslint:disable-next-line:no-console
            console.info("Error code: %d, error details: %s, error reason: %d", args.errorCode, args.errorDetails, args.reason);
        };

        connection.connected = (args: sdk.ConnectionEventArgs) => {
            connected = true;
        };

        connection.disconnected = (args: sdk.ConnectionEventArgs) => {
            done();
        };

        connection.openConnection();

        WaitForCondition(() => {
            return connected;
        }, () => {
            connection.closeConnection();
        });
    });

    test("ListenOnceAsync", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: ListenOnceAsync");

        const dialogConfig: sdk.DialogServiceConfig = BuildDialogServiceConfig();
        objsToClose.push(dialogConfig);

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
            done();
        },
        (error: string) => {
            done.fail(error);
        });

    });
});
