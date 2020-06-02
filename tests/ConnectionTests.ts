// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    ConsoleLoggingListener
} from "../src/common.browser/Exports";
import {
    Events,
    EventType
} from "../src/common/Exports";

import {
    Settings
} from "./Settings";
import WaitForCondition from "./Utilities";
import {
    WaveFileAudioInput
} from "./WaveFileAudioInputStream";

import * as fs from "fs";

let objsToClose: any[];

beforeAll(() => {
    // override inputs, if necessary
    Settings.LoadSettings();
    Events.instance.attachListener(new ConsoleLoggingListener(EventType.Debug));
});

// Test cases are run linerally, the only other mechanism to demark them in the output is to put a console line in each case and
// report the name.
beforeEach(() => {
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

export const BuildRecognizerFromWaveFile: (speechConfig?: sdk.SpeechConfig, fileName?: string) => sdk.SpeechRecognizer = (speechConfig?: sdk.SpeechConfig, fileName?: string): sdk.SpeechRecognizer => {

    let s: sdk.SpeechConfig = speechConfig;
    if (s === undefined) {
        s = BuildSpeechConfig();
        // Since we're not going to return it, mark it for closure.
        objsToClose.push(s);
    }

    const f: File = WaveFileAudioInput.LoadFile(fileName === undefined ? Settings.WaveFile : fileName);
    const config: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(f);

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
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

test("Connect / Disconnect", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Connect / Disconnect");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s);
    objsToClose.push(r);

    let connected: boolean = false;
    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

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

test("Disconnect during reco cancels.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Disconnect during reco cancels.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {

                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

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
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
        try {
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.Error]);
            expect(e.errorDetails).toContain("Disconnect");
            done();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        connection.closeConnection();
    });

}, 10000);

test("Open during reco has no effect.", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Open during reco has no effect.");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {

                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

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
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs) => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            done();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        connection.openConnection();
        sendSilence = false;
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        p.close();
    });

}, 10000);

test("Connecting before reco works for cont", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Connecting before reco works for cont");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

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
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    connection.openConnection();

    WaitForCondition(() => {
        return connected === 1;
    }, () => {
        r.startContinuousRecognitionAsync(
            undefined,
            (error: string) => {
                done.fail(error);
            });
    });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {
            try {
                expect(connected).toEqual(1);
                done();
            } catch (error) {
                done.fail(error);
            }
        });
    });

}, 10000);

test("Switch RecoModes during a connection (cont->single)", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Switch RecoModes during a connection (cont->single)");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

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
            done.fail(error);
        }
    };

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.startContinuousRecognitionAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {
        r.stopContinuousRecognitionAsync(() => {

            sendSilence = false;

            r.recognizeOnceAsync(
                undefined,
                (error: string) => {
                    done.fail(error);
                });
        });
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        done();
    });
}, 20000);

test("Switch RecoModes during a connection (single->cont)", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
    console.info("Name: Switch RecoModes during a connection (single->cont)");

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);

    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    let bytesSent: number = 0;
    let sendSilence: boolean = false;
    let p: sdk.PullAudioInputStream;

    p = sdk.AudioInputStream.createPullStream(
        {
            close: () => { return; },
            read: (buffer: ArrayBuffer): number => {
                if (!!sendSilence) {
                    return buffer.byteLength;
                }

                const copyArray: Uint8Array = new Uint8Array(buffer);
                const start: number = bytesSent;
                const end: number = buffer.byteLength > (fileBuffer.byteLength - bytesSent) ? (fileBuffer.byteLength - 1) : (bytesSent + buffer.byteLength - 1);
                copyArray.set(new Uint8Array(fileBuffer.slice(start, end)));
                bytesSent += (end - start) + 1;

                if (((end - start) + 1) < buffer.byteLength) {
                    // Start sending silence, and setup to re-transmit the file when the boolean flips next.
                    bytesSent = 0;
                    sendSilence = true;
                }

                return (end - start) + 1;
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();
    expect(r instanceof sdk.Recognizer);

    r.canceled = (r: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
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
            done.fail(error);
        }
    };

    r.recognizeOnceAsync(
        undefined,
        (error: string) => {
            done.fail(error);
        });

    WaitForCondition(() => {
        return recoCount === 1;
    }, () => {

        sendSilence = false;

        r.startContinuousRecognitionAsync(
            undefined,
            (error: string) => {
                done.fail(error);
            });
    });

    WaitForCondition(() => {
        return recoCount === 2;
    }, () => {
        sendSilence = false;
    });

    WaitForCondition(() => {
        return recoCount === 3;
    }, () => {
        done();
    });
}, 20000);

test("testAudioMessagesSent", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
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
            done.fail(error);
        }
    };

    r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
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
            done.fail(error);
        }
    }, (error: string) => {
        done.fail(error);
    });
}, 10000);

test("testModifySpeechContext", (done: jest.DoneCallback) => {
    // tslint:disable-next-line:no-console
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
            const message = JSON.parse(args.message.TextMessage);
            try {
                expect(message.RandomName).toEqual("RandomValue");
                expect(args.message.TextMessage).toContain("Some phrase"); // make sure it's not overwritten...
                done();
            } catch (error) {
                done.fail(error);
            }
        }
    };

    const pg = sdk.PhraseListGrammar.fromRecognizer(r);
    pg.addPhrase("Some phrase");

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    };

    r.recognizeOnceAsync((result: sdk.SpeechRecognitionResult) => {
        try {
            expect(result).not.toBeUndefined();
            expect(result.text).toEqual(Settings.WaveFileText);
            expect(result.properties).not.toBeUndefined();
            expect(result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)).not.toBeUndefined();
        } catch (error) {
            done.fail(error);
        }
    }, (error: string) => {
        done.fail(error);
    });
}, 10000);
