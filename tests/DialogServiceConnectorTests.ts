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
import { PropertyId, PullAudioOutputStream } from "../src/sdk/Exports";
import { Settings } from "./Settings";
import WaitForCondition from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

// tslint:disable-next-line:no-console
const consoleInfo = console.info;

// tslint:disable-next-line:no-console
console.info = (...args: any[]): void => {

    const formatConsoleDate = (): string => {
        const date = new Date();
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();

        return "[" +
            ((hour < 10) ? "0" + hour : hour) +
            ":" +
            ((minutes < 10) ? "0" + minutes : minutes) +
            ":" +
            ((seconds < 10) ? "0" + seconds : seconds) +
            "." +
            ("00" + milliseconds).slice(-3) +
            "] ";
    };
    const timestamp = formatConsoleDate(); //  `[${new Date().toTimeString()}]`;
    consoleInfo.apply(this, [timestamp, args]);
};

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

function BuildCommandsServiceConfig(): sdk.DialogServiceConfig {
    const config: sdk.CustomCommandsConfig = sdk.CustomCommandsConfig.fromSubscription(Settings.BotSecret, Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    if (undefined !== Settings.proxyServer) {
        config.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    config.setProperty(PropertyId.Conversation_ApplicationId, Settings.BotSecret);

    expect(config).not.toBeUndefined();
    return config;
}

function BuildBotFrameworkConfig(): sdk.BotFrameworkConfig {
    const config: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion);

    if (undefined !== Settings.proxyServer) {
        config.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(config).not.toBeUndefined();
    return config;
}

function BuildConnectorFromWaveFile(dialogServiceConfig?: sdk.DialogServiceConfig, audioFileName?: string): sdk.DialogServiceConnector {
    let connectorConfig: sdk.DialogServiceConfig = dialogServiceConfig;
    if (connectorConfig === undefined) {
        connectorConfig = BuildBotFrameworkConfig();

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

function PostDoneTest(done: jest.DoneCallback, ms: number): any {
    return setTimeout((): void => {
        done();
    }, ms);
}

function PostFailTest(done: jest.DoneCallback, ms: number, error?: string): any {
    return setTimeout((): void => {
        done.fail(error);
    }, ms);
}

function sleep(milliseconds: number): Promise<any> {
    return new Promise((resolve: any) => setTimeout(resolve, milliseconds));
}

// DialogServiceConfig tests: begin
test("Create BotFrameworkConfig from subscription, null params", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create BotFrameworkConfig from subscription, null params");
    expect(() => sdk.BotFrameworkConfig.fromSubscription(null, null)).toThrowError();
});

test("Create BotFrameworkConfig from subscription, null Region", () => {
    expect(() => sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, null)).toThrowError();
});

test("Create BotFrameworkConfig from subscription, null subscription", () => {
    expect(() => sdk.BotFrameworkConfig.fromSubscription(null, Settings.BotRegion)).toThrowError();
});

test("Create BotFrameworkConfig, null optional botId", () => {
    const connectorConfig: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion, "");
    expect(connectorConfig).not.toBeUndefined();
});

test("Create DialogServiceConnector, BotFrameworkConfig.fromSubscription", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: Create DialogServiceConnector, BotFrameworkConfig.fromSubscription");

    const connectorConfig: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion);
    expect(connectorConfig).not.toBeUndefined();

    const file: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(file);

    const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(connectorConfig, audioConfig);
    objsToClose.push(connector);

    expect(connector).not.toBeUndefined();
    expect(connector instanceof sdk.DialogServiceConnector);
});

// test("Create DialogServiceConnector with CustomCommandsConfig", () => {
//     // tslint:disable-next-line:no-console
//     console.info("Name: Create DialogServiceConnector with CustomCommandsConfig");

//     const connectorConfig: sdk.DialogServiceConfig = sdk.DialogServiceConfig.fromBotSecret(Settings.BotSecret, Settings.BotSubscription, Settings.SpeechRegion);
//     expect(connectorConfig).not.toBeUndefined();

//     const file: File = WaveFileAudioInput.LoadFile(Settings.WaveFile);
//     const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(file);

//     const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(connectorConfig, audioConfig);
//     objsToClose.push(connector);

//     expect(connector).not.toBeUndefined();
//     expect(connector instanceof sdk.DialogServiceConnector);
// });

describe.each([true, false])("Service-based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("Create BotFrameworkConfig, invalid optional botId", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Create BotFrameworkConfig, invalid optional botId");

        const botConfig: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion, "potato");
        objsToClose.push(botConfig);

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(botConfig);
        objsToClose.push(connector);

        // the service should return an error if an invalid botId was specified, even though the subscription is valid
        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            done.fail();
        },
            (error: string) => {
                try {
                    expect(error).toContain("1006");
                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
    });

    test("Connect / Disconnect", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Connect / Disconnect");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // For Debug
        // dialogConfig.setProxy("localhost", 8888);

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

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let sessionId: string;
        let hypoCounter: number = 0;
        let recoCounter: number = 0;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.recognizing = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
            hypoCounter++;
        };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.recognized = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs) => {
            recoCounter++;
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
            expect(hypoCounter).toBeGreaterThanOrEqual(1);
            expect(recoCounter).toEqual(1);
            done();
        },
            (error: string) => {
                done.fail(error);
            });

        WaitForCondition(() => (recoCounter === 1), done);
    });

    test("ListenOnceAsync with audio response", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: ListenOnceAsync with audio response");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig, Settings.InputDir + "weatherinthemountain.wav");
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

        const audioBuffer = new ArrayBuffer(320);
        const audioReadLoop = (audioStream: PullAudioOutputStream, done: jest.DoneCallback) => {
            audioStream.read(audioBuffer).on((bytesRead: number) => {
                try {
                    if (bytesRead === 0) {
                        PostDoneTest(done, 2000);
                    }

                } catch (error) {
                    done.fail(error);
                }

                if (bytesRead > 0) {
                    audioReadLoop(audioStream, done);
                }
                }, (error: string) => {
                    done.fail(error);
                });
        };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                if (e.activity.type === "message") {
                    if (e.activity.speak && (e.activity.speak !== "")) {
                        expect(e.audioStream).not.toBeNull();
                        audioReadLoop(e.audioStream, done);
                    }
                }
            } catch (error) {
                done.fail(error);
            }
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                // done.fail(e.errorDetails);
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
        },
            (error: string) => {
                done.fail(error);
            });
    }, 15000);

    test("Successive ListenOnceAsync with audio response", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Successive ListenOnceAsync with audio response");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig, Settings.InputDir + "weatherinthemountain.wav");
        objsToClose.push(connector);

        let sessionId: string;
        let hypoCounter: number = 0;
        let firstReco: boolean = false;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.recognizing = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
            hypoCounter++;
        };

        const audioBuffer = new ArrayBuffer(320);
        const audioReadLoop = (audioStream: PullAudioOutputStream, done: jest.DoneCallback) => {
            audioStream.read(audioBuffer).on((bytesRead: number) => {
                try {
                    if (bytesRead === 0) {
                        PostDoneTest(done, 2000);
                    }
                } catch (error) {
                    done.fail(error);
                }

                if (bytesRead > 0) {
                    audioReadLoop(audioStream, done);
                }
                }, (error: string) => {
                done.fail(error);
            });
        };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                if (e.activity.type === "message") {
                    if (e.activity.speak && (e.activity.speak !== "")) {
                        expect(e.audioStream).not.toBeNull();
                        audioReadLoop(e.audioStream, done);
                    }
                }
            } catch (error) {
                done.fail(error);
            }
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                // done.fail(e.errorDetails);
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

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
            connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
                expect(result).not.toBeUndefined();
                expect(result.errorDetails).toBeUndefined();
                expect(result.text).not.toBeUndefined();
            },
                (error: string) => {
                    done.fail(error);
                });
        });
    }, 15000);

    test("Successive ListenOnceAsync calls", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Successive ListenOnceAsync calls");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let sessionId: string;

        let firstReco: boolean = false;
        let connected: number = 0;

        const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

        connection.connected = (e: sdk.ConnectionEventArgs): void => {
            connected++;
        };

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

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
                    expect(connected).toEqual(1);
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

    // test("ListenOnce succeeds after reconnect", (done: jest.DoneCallback) => {
    //     // tslint:disable-next-line:no-console
    //     console.info("Name: ListenOnce succeeds after reconnect");

    //     const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    //     objsToClose.push(dialogConfig);

    //     // dialogConfig.setProxy("localhost", 8888);
    //     // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

    //     const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    //     objsToClose.push(connector);

    //     let sessionId: string;

    //     let firstReco: boolean = false;
    //     let connected: number = 0;

    //     const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

    //     connection.connected = (e: sdk.ConnectionEventArgs): void => {
    //         connected++;
    //     };

    //     connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
    //         sessionId = e.sessionId;
    //     };

    //     connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
    //         try {
    //             expect(e.activity).not.toBeNull();
    //         } catch (error) {
    //             done.fail(error);
    //         }
    //     };

    //     connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
    //         try {
    //             expect(e.errorDetails).toBeUndefined();
    //         } catch (error) {
    //             done.fail(error);
    //         }
    //     };

    //     connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
    //         expect(e.sessionId).toEqual(sessionId);
    //     };

    //     connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
    //         expect(result).not.toBeUndefined();
    //         expect(result.errorDetails).toBeUndefined();
    //         expect(result.text).not.toBeUndefined();
    //         firstReco = true;
    //     },
    //     (error: string) => {
    //         done.fail(error);
    //     });

    //     WaitForCondition(() => {
    //         return firstReco;
    //     }, () => {
    //         connector.listenOnceAsync((result2: sdk.SpeechRecognitionResult) => {
    //             try {
    //                 const recoResult: sdk.SpeechRecognitionResult = result2;
    //                 expect(recoResult).not.toBeUndefined();
    //                 expect(recoResult.text).toEqual("What's the weather like?");
    //                 expect(connected).toEqual(1);
    //                 done();
    //             } catch (error) {
    //                 done.fail(error);
    //             }
    //         },
    //         (error: string) => {
    //             done.fail(error);
    //         });
    //     });
    // }, 360000);

    // test("Multiple ListenOnce", (done: jest.DoneCallback) => {
    //     // tslint:disable-next-line:no-console
    //     console.info("Name: Multiple ListenOnce");
    //     const dialogConfig: sdk.DialogServiceConfig = BuildDialogServiceConfig();
    //     objsToClose.push(dialogConfig);

    //     // dialogConfig.setProxy("localhost", 8888);
    //     // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

    //     const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    //     objsToClose.push(connector);

    //     const recoAttempts: number = 5;
    //     let sessionId: string;
    //     let connected: number = 0;
    //     let recognized: number = 0;

    //     const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

    //     connection.connected = (e: sdk.ConnectionEventArgs): void => {
    //         connected++;
    //     };

    //     connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
    //         sessionId = e.sessionId;
    //     };

    //     connector.recognized = (s: sdk.DialogServiceConnector, e: SpeechRecognitionEventArgs): void => {
    //         recognized++;
    //     };

    //     connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
    //         try {
    //             expect(e.activity).not.toBeNull();
    //         } catch (error) {
    //             done.fail(error);
    //         }
    //     };

    //     connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
    //         try {
    //             expect(e.errorDetails).toBeUndefined();
    //         } catch (error) {
    //             done.fail(error);
    //         }
    //     };

    //     connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
    //         expect(e.sessionId).toEqual(sessionId);
    //     };

    //     let recoDone: boolean = true;
    //     let recoCall = 0;
    //     for (; recoCall < recoAttempts; recoCall++) {

    //         connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
    //             expect(result).not.toBeUndefined();
    //             expect(result.errorDetails).toBeUndefined();
    //             expect(result.text).not.toBeUndefined();
    //             recoDone = true;
    //         },
    //         (error: string) => {
    //             done.fail(error);
    //         });

    //         WaitForCondition(() => {
    //             return recoDone === true;
    //         }, () => { recoDone = false; });
    //     }

    //     WaitForCondition(() => (recoAttempts === recoCall), () => {
    //         expect(recoCall).toEqual(recoAttempts);
    //         expect(recognized).toEqual(recoAttempts);
    //         expect(connected).toEqual(1);
    //         done();
    //     });
    // }, 15000);

    // test("Successive ListenOnce with timeout", (done: jest.DoneCallback) => {
    //     // tslint:disable-next-line:no-console
    //     console.info("Name: Successive ListenOnce with timeout");
    //     const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    //     objsToClose.push(dialogConfig);

    //     //dialogConfig.setProxy("localhost", 8888);
    //     // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

    //     const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    //     objsToClose.push(connector);

    //     const recoAttempts: number = 5;
    //     let sessionId: string;
    //     let connected: number = 0;
    //     let recognized: number = 0;

    //     const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

    //     connection.connected = (e: sdk.ConnectionEventArgs): void => {
    //         connected++;
    //     };

    //     connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
    //         sessionId = e.sessionId;
    //     };

    //     connector.recognized = (s: sdk.DialogServiceConnector, e: SpeechRecognitionEventArgs): void => {
    //         recognized++;
    //     };

    //     connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
    //         try {
    //             expect(e.activity).not.toBeNull();
    //         } catch (error) {
    //             done.fail(error);
    //         }
    //     };

    //     connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
    //         try {
    //             expect(e.errorDetails).toBeUndefined();
    //         } catch (error) {
    //             done.fail(error);
    //         }
    //     };

    //     connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
    //         expect(e.sessionId).toEqual(sessionId);
    //     };

    //     let recoDone: boolean = false;

    //     // tslint:disable-next-line:no-console
    //     console.info("Starting first reco");

    //     connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
    //         expect(result).not.toBeUndefined();
    //         expect(result.errorDetails).toBeUndefined();
    //         expect(result.text).not.toBeUndefined();
    //         recoDone = true;

    //         // tslint:disable-next-line:no-console
    //         console.info("First reco done, received result");
    //     },
    //     (error: string) => {
    //         done.fail(error);
    //     });

    //     WaitForCondition(() => {
    //         return recoDone;
    //     }, () => {

    //         // tslint:disable-next-line:no-console
    //         console.info("Beginning 5 minute sleep to cause websocket timeout");

    //         // Wait for 5+ minutes
    //         sleep(310000).then( () => {

    //             // tslint:disable-next-line:no-console
    //             console.info("Websocket timeout complete, starting second reco");

    //             recoDone = false;
    //             connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
    //                 expect(result).not.toBeUndefined();
    //                 expect(result.errorDetails).toBeUndefined();
    //                 expect(result.text).not.toBeUndefined();
    //                 recoDone = true;

    //                 // tslint:disable-next-line:no-console
    //                 console.info("Second reco done");
    //             },
    //             (error: string) => {
    //                 done.fail(error);
    //             });

    //             WaitForCondition(() => {
    //                 return recoDone;
    //             }, () => {
    //                 done();
    //             });
    //         });
    //     });

    // }, 360000);

    test("Send/Receive messages", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Send/Receive messages");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let sessionId: string;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        let activityCount: number = 0;
        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                activityCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

        const message: any = { speak: "This is speech", text: "This is text", type: "message" };
        connector.sendActivityAsync(message);

        WaitForCondition(() => (activityCount >= 1), done);
    });

    test("Send multiple messages", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Send multiple messages");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let sessionId: string;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        let activityCount: number = 0;
        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                activityCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

        for (let j = 0; j < 5; j++) {
            const message: any = { speak: "This is speech", text: `Message ${j}`, type: "message" };
            connector.sendActivityAsync(message);
            sleep(100);
        }

        // TODO improve, needs a more accurate verification
        WaitForCondition(() => (activityCount >= 4), done);
    });

    test("Send/Receive messages during ListenOnce", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: Send/Receive messages during ListenOnce");

        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        objsToClose.push(dialogConfig);

        // dialogConfig.setProxy("localhost", 8888);
        // dialogConfig.setProperty("Conversation_Communication_Type", "AutoReply");

        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        let sessionId: string;
        let recoDone: boolean = false;

        connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
            sessionId = e.sessionId;
        };

        let activityCount: number = 0;
        connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs) => {
            try {
                expect(e.activity).not.toBeNull();
                activityCount++;
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechStartDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
            try {
                const message: any = { speak: "This is speech", text: "This is text", type: "message" };
                connector.sendActivityAsync(message);
            } catch (error) {
                done.fail(error);
            }
        };

        connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs) => {
            try {
                expect(e.errorDetails).toBeUndefined();
            } catch (error) {
                done.fail(error);
            }
        };

        connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs) => {
            expect(e.sessionId).toEqual(sessionId);
        };

        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult) => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
            recoDone = true;
        },
            (error: string) => {
                done.fail(error);
            });

        WaitForCondition(() => (activityCount > 1 && recoDone), done);
    });

    // multiple send/receive & multiple listenOnce
    // Connect after Reco call has no effect
});
