// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener
} from "../src/common.browser/Exports";
import {
    ConnectionErrorEvent,
    Events,
    IDetachable,
    PlatformEvent
} from "../src/common/Exports";
import { SpeechContext } from "../src/common.speech/ServiceMessages/SpeechContext";
import {
    Settings
} from "./Settings";
import { closeAsyncObjects, RepeatingPullStream, WaitForCondition } from "./Utilities";
import {
    WaveFileAudioInput
} from "./WaveFileAudioInputStream";


let objsToClose: any[];

beforeAll((): void => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(sdk.LogLevel.Debug));
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

export const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const config: sdk.AudioConfig = WaveFileAudioInput.getAudioConfigFromFile(fileName === undefined ? Settings.WaveFile : fileName);

    const language: string = Settings.WaveFileLanguage;
    if (s.speechRecognitionLanguage === undefined) {
        s.speechRecognitionLanguage = language;
    }

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    expect(r).not.toBeUndefined();

    return r;
};

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

test("Connect / Disconnect", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Connect / Disconnect");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
    objsToClose.push(r);

    let connected: boolean = false;
    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (args: sdk.ConnectionEventArgs): void => {
        connected = true;
    };

    connection.disconnected = (args: sdk.ConnectionEventArgs): void => {
        done();
    };

    connection.openConnection();

    WaitForCondition((): boolean => connected, (): void => {
        connection.closeConnection();
    });
});

test("Disconnect during reco cancels.", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Disconnect during reco cancels.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: sdk.PullAudioInputStream = pullStreamSource.PullStream;

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
            expect(e.errorDetails).toContain("Disconnect");
            done();
        } catch (error) {
            done(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => recoCount === 1, (): void => {
        connection.closeConnection();
    });

}, 10000);

test("Open during reco has no effect.", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Open during reco has no effect.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: sdk.PullAudioInputStream = pullStreamSource.PullStream;

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let connectionCount: number = 0;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (e: sdk.ConnectionEventArgs): void => {
        connectionCount++;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toEqual("What's the weather like?");
            expect(connectionCount).toEqual(1);
            recoCount++;
        } catch (error) {
            done(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            done();
        } catch (error) {
            done(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => recoCount === 1, (): void => {
        connection.openConnection();
        pullStreamSource.StartRepeat();
    });

    WaitForCondition((): boolean => recoCount === 2, (): void => {
        p.close();
    });

}, 10000);

test("Connecting before reco works for cont", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Connecting before reco works for cont");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: sdk.PullAudioInputStream = pullStreamSource.PullStream;

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let connected: number = 0;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.connected = (e: sdk.ConnectionEventArgs): void => {
        connected++;
    };

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            if (0 === recoCount) {
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(res.text).toEqual("What's the weather like?");
            } else {
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.NoMatch]);
            }
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    connection.openConnection();

    WaitForCondition((): boolean => connected === 1, (): void => {
        r.startContinuousRecognitionAsync(
            undefined,
            (error: string): void => {
                done(error);
            });
    });

    WaitForCondition((): boolean => recoCount === 1, (): void => {
        r.stopContinuousRecognitionAsync((): void => {
            try {
                expect(connected).toEqual(1);
                done();
            } catch (error) {
                done(error);
            }
        });
    });

}, 10000);

test.skip("Switch RecoModes during a connection (cont->single)", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Switch RecoModes during a connection (cont->single)");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: sdk.PullAudioInputStream = pullStreamSource.PullStream;

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            if (0 === recoCount) {
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(res.text).toEqual("What's the weather like?");
            } else {
                expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.NoMatch]);
            }
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => recoCount === 1, (): void => {
        r.stopContinuousRecognitionAsync((): void => {

            pullStreamSource.StartRepeat();

            r.recognizeOnceAsync(
                undefined,
                (error: string): void => {
                    done(error);
                });
        });
    });

    WaitForCondition((): boolean => recoCount === 2, (): void => {
        done();
    });
}, 20000);

test.skip("Switch RecoModes during a connection (single->cont)", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Switch RecoModes during a connection (single->cont)");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const pullStreamSource: RepeatingPullStream = new RepeatingPullStream(Settings.WaveFile);
    const p: sdk.PullAudioInputStream = pullStreamSource.PullStream;

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    let disconnected: boolean = false;
    let recoCount: number = 0;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.disconnected = (e: sdk.ConnectionEventArgs): void => {
        disconnected = true;
    };

    r.recognized = (r: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            const res: sdk.SpeechRecognitionResult = e.result;
            expect(res).not.toBeUndefined();
            expect(sdk.ResultReason[res.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
            expect(res.text).toContain("the weather like?");
            expect(disconnected).toEqual(false);
            recoCount++;
        } catch (error) {
            done(error);
        }
    };

    r.recognizeOnceAsync(
        undefined,
        (error: string): void => {
            done(error);
        });

    WaitForCondition((): boolean => recoCount === 1, (): void => {

        pullStreamSource.StartRepeat();

        r.startContinuousRecognitionAsync(
            undefined,
            (error: string): void => {
                done(error);
            });
    });

    WaitForCondition((): boolean => recoCount === 2, (): void => {
        pullStreamSource.StartRepeat();
    });

    WaitForCondition((): boolean => recoCount === 3, (): void => {
        done();
    });
}, 20000);

test("testAudioMessagesSent", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: testAudioMessagesSent");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.outputFormat = sdk.OutputFormat.Detailed;

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    expect(r.outputFormat === sdk.OutputFormat.Detailed);

    const sourceAudio: ArrayBuffer = fs.readFileSync(Settings.WaveFile);

    const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

    let wavFragmentCount: number = 0;

    const wavFragments: { [id: number]: ArrayBuffer; } = {};

    con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
        if (args.message.path === "audio" && args.message.isBinaryMessage && args.message.binaryMessage !== null) {
            wavFragments[wavFragmentCount++] = args.message.binaryMessage;
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        try {
            expect(result).not.toBeUndefined();
            expect(result.text).toEqual(Settings.WaveFileText);
            expect(result.properties).not.toBeUndefined();
            expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();

            // Validate the entire wave file was sent.
            let byteCount: number = 0;

            for (let i: number = 0; i < wavFragmentCount; i++) {
                byteCount += wavFragments[i].byteLength;
            }

            const sentAudio: Uint8Array = new Uint8Array(byteCount);

            byteCount = 0;
            for (let i: number = 0; i < wavFragmentCount; i++) {
                sentAudio.set(new Uint8Array(wavFragments[i]), byteCount);
                byteCount += wavFragments[i].byteLength;
            }

            const sourceArray: Uint8Array = new Uint8Array(sourceAudio);
            expect(sourceArray.length).toEqual(sentAudio.length);

            // Skip the wave header.
            for (let i: number = 44; i < sourceArray.length; i++) {
                expect(sourceArray[i]).toEqual(sentAudio[i]);
            }

            done();
        } catch (error) {
            done(error);
        }
    }, (error: string): void => {
        done(error);
    });
}, 10000);

test("testModifySpeechContext", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: testModifySpeechContext");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    s.outputFormat = sdk.OutputFormat.Detailed;

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile(s);
    objsToClose.push(r);

    const con: sdk.Connection = sdk.Connection.fromRecognizer(r);
    con.setMessageProperty("speech.context", "RandomName", "RandomValue");

    con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
        if (args.message.path === "speech.context" && args.message.isTextMessage) {
            const message: SpeechContext = JSON.parse(args.message.TextMessage) as SpeechContext;
            try {
                expect(message["RandomName"]).toEqual("RandomValue");
                expect(args.message.TextMessage).toContain("Some phrase"); // make sure it's not overwritten...
                done();
            } catch (error) {
                done(error);
            }
        }
    };

    const pg = sdk.PhraseListGrammar.fromRecognizer(r);
    pg.addPhrase("Some phrase");

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done(error);
        }
    };

    r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult): void => {
        try {
            expect(result).not.toBeUndefined();
            expect(result.text).toEqual(Settings.WaveFileText);
            expect(result.properties).not.toBeUndefined();
            expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
        } catch (error) {
            done(error);
        }
    }, (error: string): void => {
        done(error);
    });
}, 10000);

test("testModifySynthesisContext", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: testModifySynthesisContext");

    const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(speechConfig);

    const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
    objsToClose.push(s);

    expect(s).not.toBeUndefined();

    const con: sdk.Connection = sdk.Connection.fromSynthesizer(s);
    con.setMessageProperty("synthesis.context", "RandomName", "RandomValue");

    let doneCount: number = 0;

    con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
        if (args.message.path === "synthesis.context" && args.message.isTextMessage) {
            const message: SpeechContext = JSON.parse(args.message.TextMessage) as SpeechContext;
            try {
                expect(message.RandomName).toEqual("RandomValue");
                expect(args.message.TextMessage).toContain("wordBoundaryEnabled"); // make sure it's not overwritten...
                doneCount++;
            } catch (error) {
                done(error);
            }
        }
    };

    s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
        try {
            expect(result).not.toBeUndefined();
            expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.SynthesizingAudioCompleted]);
            expect(result.audioData).not.toBeUndefined();
            expect(result.audioData.byteLength).toBeGreaterThan(0);
            doneCount++;
        } catch (error) {
            done(error);
        }
    }, (e: string): void => {
        done(e);
    });

    WaitForCondition((): boolean => doneCount === 2, done);

}, 10000);

test("Test SendMessage Basic", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Test SendMessage Basic");

    const r = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

    con.messageSent = (message: sdk.ConnectionMessageEventArgs): void => {
        if (message.message.path === "speech.testmessage") {
            try {
                expect(message.message.isTextMessage).toBeTruthy();
                expect(message.message.isBinaryMessage).toBeFalsy();
                expect(message.message.TextMessage).toEqual("{}");
                done();
            } catch (err) {
                done(err);
            }
        }
    };

    con.sendMessageAsync("speech.testmessage", "{}", undefined, done.fail);

});

test("Test SendMessage Binary", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Test SendMessage Binary");

    const r = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

    con.messageSent = (message: sdk.ConnectionMessageEventArgs): void => {
        if (message.message.path === "speech.testmessage") {
            try {
                expect(message.message.isTextMessage).toBeFalsy();
                expect(message.message.isBinaryMessage).toBeTruthy();
                done();
            } catch (err) {
                done(err);
            }
        }
    };

    con.sendMessageAsync("speech.testmessage", new ArrayBuffer(50), undefined, done.fail);
});

test("Test InjectMessage", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Test InjectMessage");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();

    const r: sdk.SpeechRecognizer = BuildRecognizerFromWaveFile();
    objsToClose.push(r);

    const con: sdk.Connection = sdk.Connection.fromRecognizer(r);

    let audioSeen: number = 0;
    let messageSeen: boolean = false;
    let turnStarted: boolean = false;

    con.messageSent = (message: sdk.ConnectionMessageEventArgs): void => {
        if (message.message.path === "speech.testmessage") {
            try {
                expect(audioSeen).toEqual(1);
                expect(message.message.isTextMessage).toBeFalsy();
                expect(message.message.isBinaryMessage).toBeTruthy();
                messageSeen = true;
            } catch (err) {
                done(err);
            }
        } else if (message.message.path === "audio") {
            try {
                expect(messageSeen || audioSeen === 0).toBeTruthy();
                audioSeen++;
            } catch (err) {
                done(err);
            }
        }
    };

    con.messageReceived = (message: sdk.ConnectionMessageEventArgs): void => {
        if (message.message.path === "turn.start") {
            turnStarted = true;
        }
    };

    r.canceled = (s: sdk.SpeechRecognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        done();
    };

    r.startContinuousRecognitionAsync((): void => {
        con.sendMessageAsync("speech.testmessage", new ArrayBuffer(50), (): void => {
            WaitForCondition((): boolean => turnStarted, (): void => {
                const data: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);
                ps.write(data);
                ps.close();
            });
        }, done.fail);
    }, done.fail);
});

describe("Connection errors are retried", (): void => {
    let errorCount: number;
    let detachObject: IDetachable;

    beforeEach((): void => {
        errorCount = 0;
        detachObject = Events.instance.attachListener({
            onEvent: (event: PlatformEvent): void => {
                if (event instanceof ConnectionErrorEvent) {
                    errorCount++;
                }
            },
        });
    });

    afterEach((): void => {
        if (undefined !== detachObject) {
            detachObject.detach().catch((error: string): void => {
                throw new Error(error);
            });
            detachObject = undefined;
        }
    });

    test("Bad Auth", (done: jest.DoneCallback): void => {
        const s: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("badKey", Settings.SpeechRegion);
        const ps: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();

        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, sdk.AudioConfig.fromStreamInput(ps));
        objsToClose.push(r);

        r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult): void => {
            try {
                expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.Canceled]);
                const canceledDetails: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(sdk.CancellationReason[canceledDetails.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
                expect(sdk.CancellationErrorCode[sdk.CancellationErrorCode.ConnectionFailure]).toEqual(sdk.CancellationErrorCode[canceledDetails.ErrorCode]);
                expect(errorCount).toEqual(5);
                done();
            } catch (e) {
                done(e);
            }
        }, (e: string): void => {
            done(e);
        });
    }, 15000);
});
