// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import * as request from "request";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener, WebsocketMessageAdapter } from "../src/common.browser/Exports";
import { Events, EventType, InvalidOperationError } from "../src/common/Exports";
import { Settings } from "./Settings";
import WaitForCondition from "./Utilities";

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

const CheckSynthesisResult: (result: sdk.SpeechSynthesisResult, reason: sdk.ResultReason) =>
    void = (result: sdk.SpeechSynthesisResult,  reason: sdk.ResultReason): void => {
    expect(result).not.toBeUndefined();
    expect(result.reason).toEqual(reason);
    switch (reason) {
        case sdk.ResultReason.SynthesizingAudio:
        case sdk.ResultReason.SynthesizingAudioCompleted:
            expect(result.audioData).not.toBeUndefined();
            expect(result.audioData.byteLength).toBeGreaterThan(0);
            break;
        case sdk.ResultReason.SynthesizingAudioStarted:
            expect(result.audioData).toBeUndefined();
            break;
    }
};

const CheckBinaryEqual: (arr1: ArrayBuffer, arr2: ArrayBuffer) => void =
    (arr1: ArrayBuffer, arr2: ArrayBuffer): void => {
    expect(arr1).not.toBeUndefined();
    expect(arr2).not.toBeUndefined();
    expect(arr1.byteLength).toEqual(arr2.byteLength);
    const view1: Uint8Array = new Uint8Array(arr1);
    const view2: Uint8Array = new Uint8Array(arr2);
    for (let i: number = 0; i < arr1.byteLength; i++) {
        expect(view1[i]).toEqual(view2[i]);
    }
};

const ReadPullAudioOutputStream: (stream: sdk.PullAudioOutputStream, length?: number, done?: () => void, fc?: (e: string) => void) => void =
    (stream: sdk.PullAudioOutputStream, length?: number, done?: () => void, fc?: (e: string) => void): void => {
        const audioBuffer = new ArrayBuffer(1024);
        stream.read(audioBuffer).onSuccessContinueWith((bytesRead: number) => {
            if (bytesRead > 0) {
                ReadPullAudioOutputStream(stream, length === undefined ? undefined : length - bytesRead, done, fc);
            } else {
                if (length !== undefined) {
                    try {
                        expect(length).toEqual(0);
                    } catch (e) {
                        fc(e);
                    }
                }
                if (!!done) {
                    done();
                }
            }
        });
    };

class PushAudioOutputStreamTestCallback extends sdk.PushAudioOutputStreamCallback {
    public length: number;
    public isClosed: boolean = false;

    constructor() {
        super();
        this.length = 0;
    }

    public write(dataBuffer: ArrayBuffer): void {
        this.length += dataBuffer.byteLength;
    }

    public close(): void {
        if (this.isClosed) {
            throw new InvalidOperationError("PushAudioOutputStreamCallback already closed");
        }
        this.isClosed = true;
    }
}

test("testSpeechSynthesizer1", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testSpeechSynthesizer1");
    const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();

    const config: sdk.AudioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

    const r: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.SpeechSynthesizer);
});

test("testSetAndGetParameters", () => {
    // tslint:disable-next-line:no-console
    console.info("Name: testSetAndGetParameters");
    const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
    speechConfig.speechSynthesisLanguage = "zh-CN";
    speechConfig.speechSynthesisVoiceName = "zh-CN-HuihuiRUS";
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3;
    expect(speechConfig.speechSynthesisOutputFormat).toEqual(sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3);
    const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
    objsToClose.push(s);

    expect(s.properties).not.toBeUndefined();

    expect(s.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_SynthLanguage)).toEqual("zh-CN");
    expect(s.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_SynthVoice)).toEqual("zh-CN-HuihuiRUS");
    expect(s.properties.getProperty(sdk.PropertyId.SpeechServiceConnection_SynthOutputFormat))
        .toEqual(sdk.SpeechSynthesisOutputFormat[sdk.SpeechSynthesisOutputFormat.Audio16Khz128KBitRateMonoMp3]);
});

describe.each([true, false])("Service based tests", (forceNodeWebSocket: boolean) => {

    beforeAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = forceNodeWebSocket;
    });

    afterAll(() => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
    });

    test("testSpeechSynthesizerEvent1", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerEvent1");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        let audioLength: number = 0;
        let startEventCount: number = 0;
        let synthesisingEventCount: number = 0;
        let completeEventCount: number = 0;

        s.synthesisStarted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            // tslint:disable-next-line:no-console
            console.info("Synthesis started.");
            try {
                CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioStarted);
            } catch (e) {
                done.fail(e);
            }
            startEventCount += 1;
        };

        s.synthesizing = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            // tslint:disable-next-line:no-console
            console.info("Audio received with length of " + e.result.audioData.byteLength);
            audioLength += e.result.audioData.byteLength - 44;
            try {
                CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudio);
            } catch (e) {
                done.fail(e);
            }
            synthesisingEventCount += 1;
        };

        s.synthesisCompleted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            // tslint:disable-next-line:no-console
            console.info("Audio received with length of " + e.result.audioData.byteLength);
            try {
                CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioCompleted);
                expect(e.result.audioData.byteLength - 44).toEqual(audioLength);
            } catch (e) {
                done.fail(e);
            }
            completeEventCount += 1;
        };

        s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
            try {
                expect(e).not.toBeUndefined();
            } catch (e) {
                done.fail(e);
            }
        };

        s.speakTextAsync("hello world.", undefined, (e: string): void => {
            done.fail(e);
        });

        WaitForCondition( (): boolean => {
            return completeEventCount !== 0;
        }, (): void => {
            expect(startEventCount).toEqual(1);
            expect(synthesisingEventCount).toBeGreaterThan(0);
            done();
        });
    });

    test("testSpeechSynthesizerSpeakTwice", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerSpeakTwice");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 1");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
        }, (e: string): void => {
            done.fail(e);
        });

        s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 2");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizerToFile", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerToFile");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

        const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromAudioFileOutput("test.wav");
        expect(audioConfig).not.toBeUndefined();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        expect(s).not.toBeUndefined();

        let audioLength: number = 0;

        s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 1");
            audioLength += result.audioData.byteLength;
        }, (e: string): void => {
            done.fail(e);
        });

        s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished, turn 2");
            audioLength += result.audioData.byteLength;
            s.close();
            // wait 2 seconds before checking file size, as the async file writing might not be finished right now.
            setTimeout( () => {
                const fileLength = fs.statSync("test.wav").size;
                expect(fileLength).toEqual(audioLength - 44);
                done();
            }, 2000);
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis to file in turn.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis to file in turn.");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        objsToClose.push(speechConfig);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
        expect(s).not.toBeUndefined();
        objsToClose.push(s);

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking finished.");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            // wait 2 seconds before checking file size, as the async file writing might not be finished right now.
            setTimeout( () => {
                const fileLength = fs.statSync("test1.mp3").size;
                expect(fileLength).toEqual(result.audioData.byteLength);
                done();
            }, 2000);
        }, (e: string): void => {
            done.fail(e);
        }, "test1.mp3");
    });

    test("testSpeechSynthesizerWordBoundary", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerWordBoundary");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        let wordBoundaryCount: number = 0;

        s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
            try {
                expect(e).not.toBeUndefined();
                expect(e.audioOffset).not.toBeUndefined();
                expect(e.text).not.toBeUndefined();
                expect(e.textOffset).not.toBeUndefined();
                expect(e.wordLength).not.toBeUndefined();
            } catch (e) {
                done.fail(e);
            }
            wordBoundaryCount += 1;
        };

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            expect(wordBoundaryCount).toBeGreaterThan(0);
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis with SSML.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis with SSML.");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
        expect(s).not.toBeUndefined();
        objsToClose.push(s);

        let r: sdk.SpeechSynthesisResult;
        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking text finished.");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            r = result;
        }, (e: string): void => {
            done.fail(e);
        });

        const ssml: string =
            `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
<voice name='Microsoft Server Speech Text to Speech Voice (en-US, AriaRUS)'>hello world.</voice></speak>`;
        s.speakSsmlAsync(ssml, (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking ssml finished.");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            CheckBinaryEqual(r.audioData, result.audioData);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis with invalid key.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis with invalid key.");
        const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("invalidKey", Settings.SpeechRegion);
        expect(speechConfig).not.toBeUndefined();
        objsToClose.push(speechConfig);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
        expect(s).not.toBeUndefined();
        objsToClose.push(s);

        s.SynthesisCanceled = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            try {
                CheckSynthesisResult(e.result, sdk.ResultReason.Canceled);
                // only node websocket will contains the status code 401
                if (forceNodeWebSocket) {
                    expect(e.result.errorDetails).toContain("401");
                }
                const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(e.result);
                expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.ConnectionFailure);
                expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
                expect(cancellationDetail.errorDetails).toEqual(e.result.errorDetails);
            } catch (err) {
                done.fail(err);
            }
        };

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            CheckSynthesisResult(result, sdk.ResultReason.Canceled);
            // only node websocket will contains the status code 401
            if (forceNodeWebSocket) {
                expect(result.errorDetails).toContain("401");
            }
            const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
            expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.ConnectionFailure);
            expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
            expect(cancellationDetail.errorDetails).toEqual(result.errorDetails);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis with invalid voice name.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis with invalid voice name.");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);
        speechConfig.speechSynthesisVoiceName = "invalid";

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
        expect(s).not.toBeUndefined();
        objsToClose.push(s);

        s.SynthesisCanceled = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
            try {
                CheckSynthesisResult(e.result, sdk.ResultReason.Canceled);
                expect(e.result.errorDetails).toContain("voice");
                const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(e.result);
                expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.BadRequestParameters);
                expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
                expect(cancellationDetail.errorDetails).toEqual(e.result.errorDetails);
            } catch (e) {
                done.fail(e);
            }
        };

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            CheckSynthesisResult(result, sdk.ResultReason.Canceled);
            expect(result.errorDetails).toContain("voice");
            const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
            expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.BadRequestParameters);
            expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
            expect(cancellationDetail.errorDetails).toEqual(result.errorDetails);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis to pull audio output stream.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis to pull audio output stream.");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);

        const stream = sdk.AudioOutputStream.createPullStream();
        const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamOutput(stream);
        expect(audioConfig).not.toBeUndefined();

        setTimeout(() => {
            ReadPullAudioOutputStream(stream, undefined, done, done.fail);
        }, 0);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        expect(s).not.toBeUndefined();

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking text finished.");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            s.close();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis to pull audio output stream 2.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis to pull audio output stream 2.");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

        const stream = sdk.AudioOutputStream.createPullStream();
        const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamOutput(stream);
        expect(audioConfig).not.toBeUndefined();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        expect(s).not.toBeUndefined();

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking text finished.");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            s.close();
            ReadPullAudioOutputStream(stream, result.audioData.byteLength - 44, done, done.fail);
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: synthesis to push audio output stream.", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer synthesis to push audio output stream.");
        const speechConfig: sdk.SpeechConfig = BuildSpeechConfig();
        objsToClose.push(speechConfig);

        const stream = new PushAudioOutputStreamTestCallback();
        const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamOutput(stream);
        expect(audioConfig).not.toBeUndefined();

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        expect(s).not.toBeUndefined();

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            // tslint:disable-next-line:no-console
            console.info("speaking text finished.");
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            s.close();
            expect(stream.length).toEqual(result.audioData.byteLength);
            expect(stream.isClosed).toEqual(true);
            done();
        }, (e: string): void => {
            done.fail(e);
        });
    });

    test("testSpeechSynthesizer: authentication with authorization token", (done: jest.DoneCallback) => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizer authentication with authorization token");

        const req = {
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": Settings.SpeechSubscriptionKey,
            },
            url: "https://" + Settings.SpeechRegion + ".api.cognitive.microsoft.com/sts/v1.0/issueToken",
        };

        let authToken: string;

        request.post(req, (error: any, response: request.Response, body: any) => {
            authToken = body;
        });

        WaitForCondition(() => {
            return !!authToken;
        }, () => {
            const endpoint = "wss://" + Settings.SpeechRegion + ".tts.speech.microsoft.com/cognitiveservices/websocket/v1";

            // note: we use an empty subscription key so that we use the authorization token later.
            const config: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(new URL(endpoint));
            objsToClose.push(config);

            // now set the authentication token
            config.authorizationToken = authToken;

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(config, null);
            expect(s).not.toBeUndefined();

            objsToClose.push(s);

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                // tslint:disable-next-line:no-console
                console.info("speaking text finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                done();
            }, (e: string): void => {
                done.fail(e);
            });
        });
    });
});
