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
import { validateTelemetry } from "./TelemetryUtil";
import { ServiceRecognizerBase } from "../src/common.speech/Exports";

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

        dialogConfig.setProxy("localhost", 8888);
        dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let telemetryEvents: number = 0;
        let sessionId: string;
        let hypoCounter: number = 0;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.recognizing = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
            hypoCounter++;
        };

        // ServiceRecognizerBase.telemetryData = (json: string): void => {
        //     // Only record telemetry events from this session.
        //     if (json !== undefined &&
        //         sessionId !== undefined &&
        //         json.indexOf(sessionId) > 0) {
        //         try {
        //             expect(hypoCounter).toBeGreaterThanOrEqual(1);
        //             validateTelemetry(json, 1, hypoCounter);
        //         } catch (error) {
        //             done.fail(error);
        //         }
        //         telemetryEvents++;
        //     }
        // };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
            }
            catch (error) {
                done.fail(error);
            }
        }

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error){
                done.fail(error);
            }
        }

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        }

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

    test.skip("ListenOnceAsync with audio response", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: ListenOnceAsync with audio response");

        const dialogConfig: sdk.DialogServiceConfig = BuildDialogServiceConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig, Settings.InputDir + "weatheratthebeach.wav");
        objsToClose.push(connector);

        let sessionId: string;
        let hypoCounter: number = 0;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.recognizing = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
            hypoCounter++;
        };

        // ServiceRecognizerBase.telemetryData = (json: string): void => {
        //     // Only record telemetry events from this session.
        //     if (json !== undefined &&
        //         sessionId !== undefined &&
        //         json.indexOf(sessionId) > 0) {
        //         try {
        //             expect(hypoCounter).toBeGreaterThanOrEqual(1);
        //             validateTelemetry(json, 1, hypoCounter);
        //         } catch (error) {
        //             done.fail(error);
        //         }
        //         telemetryEvents++;
        //     }
        // };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                done();
            }
            catch (error) {
                done.fail(error);
            }
        }

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                done.fail(e.errorDetails);
            } catch (error){
                done.fail(error);
            }
        }

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        }

        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
        },
        (error: string) => {
            done.fail(error);
        });

    });

    test("Multiple ListenOnceAsync", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Multiple ListenOnceAsync");

        const dialogConfig: sdk.DialogServiceConfig = BuildDialogServiceConfig();
        objsToClose.push(dialogConfig);

        dialogConfig.setProxy("localhost", 8888);
        dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let sessionId: string;

        let firstReco: boolean = false;
        let connected: number = 0;
        let disconnected: boolean = false;

        const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

        connection.connected = (e: sdk.ConnectionEventArgs): void => {
            connected++;
        }

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
            }
            catch (error) {
                done.fail(error);
            }
        }

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error){
                done.fail(error);
            }
        }

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        }

        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
            firstReco = true;
        },
        (error: string) => {
            done.fail(error);
        });

        WaitForCondition(() => {
            return firstReco;
        }, () => {
            connector.listenOnceAsync((result2: sdk.SpeechRecognitionResult) => {
                try {
                    const recoResult: sdk.SpeechRecognitionResult = result2;
                    expect(recoResult).not.toBeUndefined();
                    expect(recoResult.text).toEqual("What's the weather like?");
                    expect(connected).toEqual(1);
                    expect(disconnected).toEqual(false);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            },
            (error: string) => {
                done.fail(error);
            });
        });
    }, 15000);

    test("Send/Receive messages", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Send/Receive messages");

        const dialogConfig: sdk.DialogServiceConfig = BuildDialogServiceConfig();
        objsToClose.push(dialogConfig);

        dialogConfig.setProxy("localhost", 8888);

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let telemetryEvents: number = 0;
        let sessionId: string;
        let hypoCounter: number = 0;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.recognizing = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
            hypoCounter++;
        };

        // ServiceRecognizerBase.telemetryData = (json: string): void => {
        //     // Only record telemetry events from this session.
        //     if (json !== undefined &&
        //         sessionId !== undefined &&
        //         json.indexOf(sessionId) > 0) {
        //         try {
        //             expect(hypoCounter).toBeGreaterThanOrEqual(1);
        //             validateTelemetry(json, 1, hypoCounter);
        //         } catch (error) {
        //             done.fail(error);
        //         }
        //         telemetryEvents++;
        //     }
        // };

        let activityCount: number = 0;
        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                activityCount++;
            }
            catch (error) {
                done.fail(error);
            }
        }

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error){
                done.fail(error);
            }
        }

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        }

        const message: any = {"speak":"say this","text":"some text","type":"message type"};
        connector.sendActivity(message);

        WaitForCondition(() => (activityCount === 1), done);
    });
});
