// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

//
// Test Settings
//
// Mandatory settings that do not have default values in Settings.ts. You must define them
// before running the test (see README.md).
//   Settings.BotSecret
//   Settings.SpeechSubscriptionKey
//   Settings.SpeechRegion
//   Settings.BotSubscription
//   Settings.BotRegion
//
// Mandatory settings that have defaults in Settings.ts. You do not need to define them.
//   Settings.WaveFile
//   Settings.WaveFileLanguage
//   Settings.InputDir
//
// Optional settings for this test. They do not have default values.
//   Settings.proxyServer
//   Settings.proxyPort
//

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener,
} from "../src/common.browser/Exports";
import { AgentConfig } from "../src/common.speech/Exports";
import { HeaderNames } from "../src/common.speech/HeaderNames";
import { QueryParameterNames } from "../src/common.speech/QueryParameterNames";
import {
    ConnectionStartEvent,
    Events,
    EventType,
    IDetachable,
    PlatformEvent,
    SendingAgentContextMessageEvent,
} from "../src/common/Exports";
import { OutputFormat, PropertyId, PullAudioOutputStream, ResultReason } from "../src/sdk/Exports";
import { Settings } from "./Settings";
import {
    closeAsyncObjects,
    WaitForCondition
} from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";


type Callback = (result?: any) => void;
// eslint-disable-next-line no-console
const consoleInfo = console.info;
const simpleMessageObj = { speak: "This is speech", text: "This is text", type: "message" };

// eslint-disable-next-line no-console
console.info = (...args: any[]): void => {

    const formatConsoleDate = (): string => {
        const date = new Date();
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();

        return "[" +
            ((hour < 10) ? "0" + hour.toString() : hour).toString() +
            ":" +
            ((minutes < 10) ? "0" + minutes.toString() : minutes).toString() +
            ":" +
            ((seconds < 10) ? "0" + seconds.toString() : seconds).toString() +
            "." +
            ("00" + milliseconds.toString()).slice(-3) +
            "] ";
    };
    const timestamp = formatConsoleDate(); //  `[${new Date().toTimeString()}]`;
    consoleInfo.apply(this, [timestamp, args]);
};

let objsToClose: any[];

beforeAll((): void => {
    // Override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
});

beforeEach((): void => {
    objsToClose = [];
    // eslint-disable-next-line no-console
    console.info("------------------Starting test case: " + expect.getState().currentTestName + "-------------------------");
});

jest.retryTimes(Settings.RetryCount);

afterEach(async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    await closeAsyncObjects(objsToClose);
});

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function BuildCommandsServiceConfig(): sdk.DialogServiceConfig {
    const config: sdk.CustomCommandsConfig = sdk.CustomCommandsConfig.fromSubscription(Settings.BotSecret, Settings.SpeechSubscriptionKey, Settings.SpeechRegion);

    if (undefined !== Settings.proxyServer) {
        config.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    config.setProperty(PropertyId.Conversation_ApplicationId, Settings.BotSecret);

    expect(config).not.toBeUndefined();
    return config;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function BuildBotFrameworkConfig(): sdk.BotFrameworkConfig {
    const config: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion);

    if (undefined !== Settings.proxyServer) {
        config.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(config).not.toBeUndefined();
    return config;
}

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function BuildConnectorFromWaveFile(dialogServiceConfig?: sdk.DialogServiceConfig, audioFileName?: string): sdk.DialogServiceConnector {
    let connectorConfig: sdk.DialogServiceConfig = dialogServiceConfig;
    if (connectorConfig === undefined) {
        connectorConfig = BuildBotFrameworkConfig();

        // Since we're not going to return it, mark it for closure.
        objsToClose.push(connectorConfig);
    }

    const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(audioFileName === undefined ? Settings.WaveFile : audioFileName);

    const language: string = Settings.WaveFileLanguage;
    if (connectorConfig.speechRecognitionLanguage === undefined) {
        connectorConfig.speechRecognitionLanguage = language;
    }

    const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(connectorConfig, audioConfig);
    expect(connector).not.toBeUndefined();

    return connector;
}

const PostDoneTest = (done: jest.DoneCallback, ms: number): any => setTimeout((): void => {
        done();
    }, ms);

const PostFailTest = (done: jest.DoneCallback, ms: number, error?: string): any => setTimeout((): void => {
        done(error);
    }, ms);


const sleep = (milliseconds: number): Promise<any> => new Promise((resolve: Callback): NodeJS.Timeout => setTimeout(resolve, milliseconds));

// DialogServiceConfig tests: begin
test("Create BotFrameworkConfig from subscription, null params", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create BotFrameworkConfig from subscription, null params");
    expect((): sdk.BotFrameworkConfig => sdk.BotFrameworkConfig.fromSubscription(null, null)).toThrowError();
});

test("Create BotFrameworkConfig from subscription, null Region", (): void => {
    expect((): sdk.BotFrameworkConfig => sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, null)).toThrowError();
});

test("Create BotFrameworkConfig from subscription, null subscription", (): void => {
    expect((): sdk.BotFrameworkConfig => sdk.BotFrameworkConfig.fromSubscription(null, Settings.BotRegion)).toThrowError();
});

test("Create BotFrameworkConfig, null optional botId", (): void => {
    const connectorConfig: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion, "");
    expect(connectorConfig).not.toBeUndefined();
});

test("Create DialogServiceConnector, BotFrameworkConfig.fromSubscription", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Create DialogServiceConnector, BotFrameworkConfig.fromSubscription");

    const connectorConfig: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion);
    expect(connectorConfig).not.toBeUndefined();

    const audioConfig: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(Settings.WaveFile);

    const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(connectorConfig, audioConfig);
    objsToClose.push(connector);

    expect(connector).not.toBeUndefined();
    expect(connector instanceof sdk.DialogServiceConnector);
});

test("Output format, default", (): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Output format, default");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    expect(dialogConfig.outputFormat === sdk.OutputFormat.Simple);
});

test("Create BotFrameworkConfig, invalid optional botId", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Create BotFrameworkConfig, invalid optional botId");

    const botConfig: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromSubscription(Settings.BotSubscription, Settings.BotRegion, "potato");
    objsToClose.push(botConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(botConfig);

    // the service should return an error if an invalid botId was specified, even though the subscription is valid
    connector.listenOnceAsync(
        (successResult: sdk.SpeechRecognitionResult): void => {
            if (successResult.reason !== sdk.ResultReason.Canceled) {
                done(`listenOnceAsync shouldn't have reason '${successResult.reason}' with this config`);
            } else {
                expect(successResult.errorDetails).toContain("1006");
            }
        },
        async (failureDetails: string) => {
            expect(failureDetails).toContain("1006");
            // Known issue: reconnection attempts continue upon failure; we'll wait a short
            // period of time here to avoid logger pollution.
            await new Promise((resolve: any) => setTimeout(resolve, 1000));
            done();
        });
}, 15000);

test("Connect / Disconnect", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Connect / Disconnect");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(dialogConfig);
    objsToClose.push(connector);

    let connected: boolean = false;
    let disconnected: boolean = false;
    const connection: sdk.Connection = sdk.Connection.fromRecognizer(connector);

    expect(connector).not.toBeUndefined();

    connector.canceled = (sender: sdk.DialogServiceConnector, args: sdk.SpeechRecognitionCanceledEventArgs): void => {
        // eslint-disable-next-line no-console
        console.info("Error code: %d, error details: %s, error reason: %d", args.errorCode, args.errorDetails, args.reason);
    };

    connection.connected = (args: sdk.ConnectionEventArgs): void => {
        connected = true;
    };

    connection.disconnected = (args: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    connection.openConnection(undefined, (error: string): void => {
        done(error);
    });

    WaitForCondition((): boolean => connected, (): void => {
        connection.closeConnection((): void => {
            if (!!disconnected) {
                done();
            } else {
                done("Did not disconnect before returning");
            }
        });
    });
});

test("GetDetailedOutputFormat", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: GetDetailedOutputFormat");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    dialogConfig.outputFormat = OutputFormat.Detailed;
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    objsToClose.push(connector);

    let recoCounter: number = 0;
    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result).not.toBeUndefined();

        const resultProps = result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
        (expect(resultProps).toContain("NBest"));
        recoCounter++;
    },
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => (recoCounter === 1), done);
});

test("ListenOnceAsync", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: ListenOnceAsync");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    objsToClose.push(connector);

    let sessionId: string;
    let hypoCounter: number = 0;
    let recoCounter: number = 0;
    let turnStatusCounter: number = 0;

    connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    connector.recognizing = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
        hypoCounter++;
    };

    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
        } catch (error) {
            done(error);
        }
    };

    connector.recognized = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
        recoCounter++;
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connector.turnStatusReceived = (sender: sdk.DialogServiceConnector, e: sdk.TurnStatusReceivedEventArgs): void => {
        turnStatusCounter++;
        try {
            expect(e.statusCode === 200);
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result).not.toBeUndefined();
        expect(result.errorDetails).toBeUndefined();
        expect(result.text).not.toBeUndefined();
        // expect(hypoCounter).toBeGreaterThanOrEqual(1);
        expect(recoCounter).toEqual(1);
        recoCounter++;
    },
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => (recoCounter === 2), done);
    WaitForCondition((): boolean => (turnStatusCounter === 1), done);
});

Settings.testIfDOMCondition("ListenOnceAsync with audio response", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: ListenOnceAsync with audio response");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

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
    //             done(error);
    //         }
    //         telemetryEvents++;
    //     }
    // };

    const audioBuffer = new ArrayBuffer(320);
    const audioReadLoop = (audioStream: PullAudioOutputStream, done: jest.DoneCallback): void => {
        audioStream.read(audioBuffer).then((bytesRead: number): void => {
            try {
                if (bytesRead === 0) {
                    PostDoneTest(done, 2000);
                }

            } catch (error) {
                done(error as string);
            }

            if (bytesRead > 0) {
                audioReadLoop(audioStream, done);
            }
        }, (error: string): void => {
            done(error);
        });
    };

    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
            if (e.activity.type === "message") {
                if (e.activity.speak && (e.activity.speak !== "")) {
                    expect(e.audioStream).not.toBeNull();
                    audioReadLoop(e.audioStream, done);
                }
            }
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            // done(e.errorDetails);
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result).not.toBeUndefined();
        expect(result.errorDetails).toBeUndefined();
        expect(result.text).not.toBeUndefined();
    },
        (error: string): void => {
            done(error);
        });
}, 15000);

Settings.testIfDOMCondition("Successive ListenOnceAsync with audio response", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Successive ListenOnceAsync with audio response");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

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
    const audioReadLoop = (audioStream: PullAudioOutputStream, done: jest.DoneCallback): void => {
        audioStream.read(audioBuffer).then((bytesRead: number): void => {
            try {
                if (bytesRead === 0) {
                    PostDoneTest(done, 2000);
                }
            } catch (error) {
                done(error);
            }

            if (bytesRead > 0) {
                audioReadLoop(audioStream, done);
            }
        }, (error: string): void => {
            done(error);
        });
    };

    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
            if (e.activity.type === "message") {
                if (e.activity.speak && (e.activity.speak !== "")) {
                    expect(e.audioStream).not.toBeNull();
                    audioReadLoop(e.audioStream, done);
                }
            }
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            // done(e.errorDetails);
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result).not.toBeUndefined();
        expect(result.errorDetails).toBeUndefined();
        expect(result.text).not.toBeUndefined();
        firstReco = true;
    },
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => firstReco, (): void => {
        connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
            expect(result).not.toBeUndefined();
            expect(result.errorDetails).toBeUndefined();
            expect(result.text).not.toBeUndefined();
        },
            (error: string): void => {
                done(error);
            });
    });
}, 15000);

test("Successive ListenOnceAsync calls", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Successive ListenOnceAsync calls");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

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

    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result).not.toBeUndefined();
        expect(result.errorDetails).toBeUndefined();
        expect(result.text).not.toBeUndefined();
        firstReco = true;
    },
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => firstReco, (): void => {
        connector.listenOnceAsync((result2: sdk.SpeechRecognitionResult): void => {
            try {
                const recoResult: sdk.SpeechRecognitionResult = result2;
                expect(recoResult).not.toBeUndefined();
                expect(connected).toEqual(1);
                done();
            } catch (error) {
                done(error);
            }
        },
            (error: string): void => {
                done(error);
            });
    });
}, 15000);

test("ListenOnceAsync with silence returned", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: ListenOnceAsync with silence returned");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig, Settings.InputDir + "initialSilence5s.wav");
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

    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result.reason).not.toBeUndefined();
        expect(result.errorDetails).toBeUndefined();
        firstReco = true;
    },
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => firstReco, (): void => {
        connector.listenOnceAsync((result2: sdk.SpeechRecognitionResult): void => {
            try {
                expect(connected).toEqual(1);
                done();
            } catch (error) {
                done(error);
            }
        },
            (error: string): void => {
                done(error);
            });
    });
}, 15000);

test("Send/Receive messages", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Send/Receive messages");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    objsToClose.push(connector);

    let sessionId: string;

    connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    let activityCount: number = 0;
    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
            activityCount++;
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    const message: string = JSON.stringify(simpleMessageObj);
    connector.sendActivityAsync(message);

    WaitForCondition((): boolean => (activityCount >= 1), done);
});

test("Send multiple messages", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Send multiple messages");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    objsToClose.push(connector);

    let sessionId: string;

    connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    let activityCount: number = 0;
    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
            activityCount++;
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    for (let j = 0; j < 5; j++) {
        const numberedMessage: any = { speak: "This is speech", text: `"Message ${j}`, type: "message" };
        const message: string = JSON.stringify(numberedMessage);
        connector.sendActivityAsync(message);
        sleep(100).catch();
    }

    // TODO improve, needs a more accurate verification
    WaitForCondition((): boolean => (activityCount >= 4), done);
});

test("Send/Receive messages during ListenOnce", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Send/Receive messages during ListenOnce");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    objsToClose.push(connector);

    let sessionId: string;
    let recoDone: boolean = false;

    connector.sessionStarted = (s: sdk.DialogServiceConnector, e: sdk.SessionEventArgs): void => {
        sessionId = e.sessionId;
    };

    let activityCount: number = 0;
    connector.activityReceived = (sender: sdk.DialogServiceConnector, e: sdk.ActivityReceivedEventArgs): void => {
        try {
            expect(e.activity).not.toBeNull();
            activityCount++;
        } catch (error) {
            done(error);
        }
    };

    connector.speechStartDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        try {
            const message: string = JSON.stringify(simpleMessageObj);
            connector.sendActivityAsync(message);
        } catch (error) {
            done(error);
        }
    };

    connector.canceled = (sender: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connector.speechEndDetected = (sender: sdk.DialogServiceConnector, e: sdk.RecognitionEventArgs): void => {
        expect(e.sessionId).toEqual(sessionId);
    };

    connector.listenOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        expect(result).not.toBeUndefined();
        expect(result.errorDetails).toBeUndefined();
        expect(result.text).not.toBeUndefined();
        recoDone = true;
    },
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => (activityCount > 1 && recoDone), done);
});

test("SendActivity fails with invalid JSON object", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: SendActivity fails with invalid JSON object");

    const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
    objsToClose.push(dialogConfig);

    const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
    objsToClose.push(connector);

    const malformedJSON: string = "{speak: \"This is speech\", \"text\" : \"This is JSON is malformed\", \"type\": \"message\" };";
    connector.sendActivityAsync(malformedJSON, (): void => {
        done("Should have failed");
    }, (error: string): void => {
        expect(error).toContain("Unexpected token");
        done();
    });
});

describe("Agent config message tests", (): void => {
    let eventListener: IDetachable;
    let observedAgentConfig: AgentConfig;

    beforeEach((): void => {
        eventListener = Events.instance.attachListener({
            onEvent: (event: PlatformEvent): void => {
                if (event instanceof SendingAgentContextMessageEvent) {
                    const agentContextEvent = event;
                    observedAgentConfig = agentContextEvent.agentConfig;
                }
            },
        });
    });

    afterEach(async (): Promise<void> => {
        await eventListener.detach();
        observedAgentConfig = undefined;
    });

    test("Agent connection id can be set", (done: jest.DoneCallback): void => {
        const testConnectionId: string = "thisIsTheTestConnectionId";
        const dialogConfig: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        dialogConfig.setProperty(sdk.PropertyId.Conversation_Agent_Connection_Id, testConnectionId);
        objsToClose.push(dialogConfig);
        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(dialogConfig);
        objsToClose.push(connector);

        connector.listenOnceAsync(
            (): void => {
                try {
                    expect(observedAgentConfig).not.toBeUndefined();
                    expect(observedAgentConfig.get().botInfo.connectionId).toEqual(testConnectionId);
                    done();
                } catch (error) {
                    done(error);
                }
            },
            (failureMessage: string): void => {
                done(`ListenOnceAsync unexpectedly failed: ${failureMessage}`);
            });
    });
});

describe.each([
    /* [
      <description>,
      <method to use for creating the config>,
      <expected fragments in connection URI>,
      <unexpected fragments in connection URI>,
      ?<override region to use>,
      ?<override host to use>,
      ?<applicationId to use>,
      ?<authToken to use>,
      ?<endpoint to use>,
    ] */
    [
        "Standard BotFrameworkConfig.fromSubscription",
        sdk.BotFrameworkConfig.fromSubscription,
        ["wss://region.convai.speech", "api/v3"],
        [QueryParameterNames.BotId],
    ],
    [
        "BotFrameworkConfig.fromSubscription with region and appId",
        sdk.BotFrameworkConfig.fromSubscription,
        ["wss://differentRegion.convai.speech", "api/v3", QueryParameterNames.BotId],
        ["wss://region.convai"],
        "differentRegion",
        undefined,
        "myApplicationId",
    ],
    /*
    // TODO: debug and re-enable
    [
        "Standard BotFrameworkConfig.fromHost",
        sdk.BotFrameworkConfig.fromHost,
        ["wss://hostname/", "api/v3"],
        ["convai"],
    ],
    */
    [
        "BotFrameworkConfig.fromHost with implicit URL generation",
        sdk.BotFrameworkConfig.fromHost,
        ["wss://basename.convai.speech.azure.us/", "api/v3"],
        ["hostname"],
        undefined,
        "baseName",
        undefined,
        undefined,
    ],
    [
        "BotFrameworkConfig.fromHost with appId",
        sdk.BotFrameworkConfig.fromHost,
        ["ws://customhostname.com/", "api/v3", QueryParameterNames.BotId],
        ["convai", "wss://", "//hostName", "Authorization"],
        undefined,
        new URL("ws://customHostName.com"),
        "myApplicationId",
    ],
    [
        "Simulated BotFrameworkConfig.fromHost with appId via properties",
        "simulatedFromHostWithProperties",
        ["ws://customhostname.com/", "api/v3", QueryParameterNames.BotId],
        ["convai", "wss://", "//hostName", "Authorization"],
        undefined,
        new URL("ws://customHostName.com"),
        "myApplicationId",
    ],
    [
        "BotFrameworkConfig.fromAuthorizationToken with appId",
        sdk.BotFrameworkConfig.fromAuthorizationToken,
        ["wss://region.convai.speech", "api/v3", "Authorization", QueryParameterNames.BotId],
        [HeaderNames.AuthKey],
        undefined,
        undefined,
        "myApplicationId",
        "myAuthToken",
    ],
    [
        "BotFrameworkConfig.fromEndpoint",
        sdk.BotFrameworkConfig.fromEndpoint,
        ["ws://this.is/my/custom/endpoint", HeaderNames.AuthKey],
        ["wss", "api/v3", "convai", QueryParameterNames.BotId],
        undefined,
        undefined,
        undefined,
        undefined,
        new URL("ws://this.is/my/custom/endpoint"),
    ],
    [
        "Simulated BotFrameworkConfig.fromEndpoint with properties",
        "simulatedFromEndpointWithProperties",
        ["ws://this.is/my/custom/endpoint", "Subscription-Key"],
        ["wss", "api/v3", "convai", QueryParameterNames.BotId],
        undefined,
        undefined,
        undefined,
        undefined,
        new URL("ws://this.is/my/custom/endpoint"),
    ],
    [
        "Standard CustomCommandsConfig.fromSubscription",
        sdk.CustomCommandsConfig.fromSubscription,
        ["wss://region.convai.speech.microsoft.com/commands/api/v1", HeaderNames.CustomCommandsAppId],
        ["api/v3"],
        undefined,
        undefined,
        "myApplicationId",
    ],
])("Connection URL contents", (
    description: string,
    configCreationMethod: any,
    expectedContainedThings: string[],
    expectedNotContainedThings: string[],
    overrideRegion: string = undefined,
    overrideHost: string | URL = undefined,
    applicationId: string = undefined,
    authToken: string = undefined,
    endpoint: URL = undefined,
): void => {
    let observedUri: string;
    let eventListener: IDetachable;
    let connector: sdk.DialogServiceConnector;

    async function detachListener(): Promise<void> {
        if (eventListener) {
            await eventListener.detach();
            eventListener = undefined;
        }
    }

    beforeEach((): void => {
        eventListener = Events.instance.attachListener({
            onEvent: (event: PlatformEvent) => {
                if (event instanceof ConnectionStartEvent) {
                    const connectionEvent = event;
                    observedUri = connectionEvent.uri;
                }
            },
        });
    });

    afterEach(async (): Promise<void> => {
        await eventListener.detach();
        observedUri = undefined;
    });

    function getConfig(): sdk.DialogServiceConfig {
        let result: sdk.DialogServiceConfig;

        switch (configCreationMethod) {
            case sdk.BotFrameworkConfig.fromSubscription:
                result = configCreationMethod("testKey", overrideRegion ?? "region");
                break;
            case sdk.BotFrameworkConfig.fromHost:
                result = configCreationMethod(overrideHost ?? new URL("wss://hostName"), "testKey");
                break;
            case sdk.BotFrameworkConfig.fromAuthorizationToken:
                expect(authToken).not.toBeUndefined();
                result = configCreationMethod(authToken, overrideRegion ?? "region");
                break;
            case sdk.BotFrameworkConfig.fromEndpoint:
                expect(endpoint).not.toBeUndefined();
                result = configCreationMethod(endpoint, "testKey");
                break;
            case sdk.CustomCommandsConfig.fromSubscription:
                expect(applicationId).not.toBeUndefined();
                result = configCreationMethod(applicationId, "testKey", overrideRegion ?? "region");
                break;
            case "simulatedFromHostWithProperties":
                result = sdk.BotFrameworkConfig.fromSubscription("testKey", overrideRegion ?? "region");
                const host = overrideHost ?? "wss://my.custom.host";
                const hostPropertyValue: string = overrideHost.toString();
                result.setProperty(sdk.PropertyId.SpeechServiceConnection_Host, hostPropertyValue);
                break;
            case "simulatedFromEndpointWithProperties":
                result = sdk.BotFrameworkConfig.fromSubscription("testKey", overrideRegion ?? "region");
                result.setProperty(sdk.PropertyId.SpeechServiceConnection_Endpoint, endpoint.toString());
                break;
            default:
                result = undefined;
        }

        expect(result).not.toBeUndefined();

        if (applicationId) {
            result.setProperty(PropertyId.Conversation_ApplicationId, applicationId);
        }

        return result;
    }

    test(`Validate: ${description}`, (done: jest.DoneCallback): void => {
        try {
            const config = getConfig();
            connector = new sdk.DialogServiceConnector(config);
            expect(connector).not.toBeUndefined();

            connector.listenOnceAsync(
                (successArgs: any) => {
                    done("Success callback not expected with invalid auth details!");
                },
                async (failureArgs?: string) => {
                    expect(observedUri).not.toBeUndefined();
                    for (const expectedThing of expectedContainedThings) {
                        expect(observedUri).toEqual(expect.stringContaining(expectedThing));
                    }
                    for (const unexpectedThing of expectedNotContainedThings) {
                        expect(observedUri.toLowerCase()).not.toEqual(
                            expect.stringContaining(unexpectedThing.toLowerCase()));
                    }
                    if (applicationId) {
                        expect(observedUri).toEqual(expect.stringContaining(applicationId));
                    }
                    // Known issue: reconnection attempts continue upon failure; we'll wait a short
                    // period of time here to avoid logger pollution.
                    await new Promise((resolve: any) => setTimeout(resolve, 1000));
                    done();
                },
            );
        } catch (error) {
            done(error);
        }
    }, 30000);
});

describe.each([
    [
        "simple keyword gets a result when it should",
        "contoso",
        undefined,
        true
    ],
    [
        "simple keyword gets rejected when it should",
        "banana",
        undefined,
        false
    ],
    [
        "simple keyword works with adequate duration",
        "contoso",
        "20000000",
        true
    ],
    /*
    [
        "simple keyword fails with inadequate duration",
        "contoso",
        "5000000",
        false
    ],
    */
    [
        "works with multiple keywords",
        "foobar;baz;contoso;quz",
        "123;456;20000000",
        true
    ]
])("Keyword verification", (
    description: string,
    keywords: string,
    durations: string,
    successExpected: boolean,
) => {

    test(`${description}`, (done: jest.DoneCallback): void => {
        const config: sdk.BotFrameworkConfig = BuildBotFrameworkConfig();
        config.setProperty("SPEECH-KeywordsToDetect", keywords);
        if (durations !== undefined) {
            config.setProperty("SPEECH-KeywordsToDetect-Durations", durations);
        }
        const connector: sdk.DialogServiceConnector = BuildConnectorFromWaveFile(config, Settings.InputDir + "contoso-hows-the-weather.wav");
        objsToClose.push(connector);

        let keywordResultReceived: number = 0;
        let noMatchesReceived: number = 0;
        let speechRecognizedReceived: number = 0;

        connector.recognized = (s: sdk.DialogServiceConnector, e: sdk.SpeechRecognitionEventArgs): void => {
            if (e.result.reason === ResultReason.RecognizedKeyword) {
                keywordResultReceived++;
                expect(keywords).toContain(e.result.text);
            } else if (e.result.reason === ResultReason.NoMatch) {
                noMatchesReceived++;
            } else if (e.result.reason === ResultReason.RecognizedSpeech) {
                expect(keywordResultReceived).toBe(1);
                speechRecognizedReceived++;
            }
        };

        connector.listenOnceAsync(
            (successfulResult: sdk.SpeechRecognitionResult): void => {
                expect(keywordResultReceived).toBe(successExpected ? 1 : 0);
                expect(noMatchesReceived).toBe(successExpected ? 0 : 1);
                expect(speechRecognizedReceived).toBe(successExpected ? 1 : 0);
                expect(successfulResult.reason).toBe(
                    successExpected ? ResultReason.RecognizedSpeech : ResultReason.NoMatch);
                done();
            },
            (error: string): void => {
                done(error);
            });
    }, 30000);
});
