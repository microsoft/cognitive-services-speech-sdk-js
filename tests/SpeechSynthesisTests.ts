// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/* eslint-disable no-console */
import * as fs from "fs";
import bent, { BentResponse } from "bent";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import { HeaderNames } from "../src/common.speech/HeaderNames";
import { QueryParameterNames } from "../src/common.speech/QueryParameterNames";
import {
    ConnectionStartEvent,
    Events,
    InvalidOperationError,
    PlatformEvent
} from "../src/common/Exports";
import { Settings } from "./Settings";
import {
    closeAsyncObjects,
    WaitForCondition
} from "./Utilities";
import { SpeechConfigConnectionFactory } from "./SpeechConfigConnectionFactories";
import { SpeechConnectionType } from "./SpeechConnectionTypes";
import { SpeechServiceType } from "./SpeechServiceTypes";
import { SrvRecord } from "dns";


let objsToClose: any[];

beforeAll(() => {
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

const BuildSpeechConfig: (connectionType?: SpeechConnectionType) => Promise<sdk.SpeechConfig> = async (connectionType?: SpeechConnectionType): Promise<sdk.SpeechConfig> => {

    if (undefined === connectionType) {
        connectionType = SpeechConnectionType.Subscription;
    }

    const s: sdk.SpeechConfig = await SpeechConfigConnectionFactory.getSpeechSynthesisConfig(connectionType);
    expect(s).not.toBeUndefined();

    console.info("SpeechConfig created " + SpeechConnectionType[connectionType]);

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    return s;
};

const CheckSynthesisResult: (result: sdk.SpeechSynthesisResult, reason: sdk.ResultReason) =>
    void = (result: sdk.SpeechSynthesisResult, reason: sdk.ResultReason): void => {
        expect(result).not.toBeUndefined();
        expect(sdk.ResultReason[result.reason]).toEqual(sdk.ResultReason[reason]);
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

const ReadPullAudioOutputStream: (stream: sdk.PullAudioOutputStream, length?: number, done?: jest.DoneCallback) => void =
    (stream: sdk.PullAudioOutputStream, length?: number, done?: jest.DoneCallback): void => {
        const audioBuffer = new ArrayBuffer(1024);
        stream.read(audioBuffer).then((bytesRead: number): void => {
            if (bytesRead > 0) {
                ReadPullAudioOutputStream(stream, length === undefined ? undefined : length - bytesRead, done);
            } else {
                if (length !== undefined) {
                    try {
                        expect(length).toEqual(0);
                    } catch (e) {
                        done(e);
                    }
                }
                if (!!done) {
                    done();
                }
            }
        }, done.fail);
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

test("testGetVoicesAsyncAuthError", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetVoicesAsyncAuthError");
    const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription("foo", Settings.SpeechRegion);

    const r: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
    objsToClose.push(r);
    expect(r).not.toBeUndefined();

    const voicesResult: sdk.SynthesisVoicesResult = await r.getVoicesAsync();
    expect(voicesResult).not.toBeUndefined();
    expect(voicesResult.resultId).not.toBeUndefined();
    expect(voicesResult.reason).toEqual(sdk.ResultReason.Canceled);
    expect(voicesResult.errorDetails).not.toBeUndefined();
    expect(voicesResult.errorDetails.endsWith("401: Unauthorized"));
});

test("testGetVoicesAsyncDefault", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetVoicesAsyncDefault");
    const speechConfig: sdk.SpeechConfig = await BuildSpeechConfig();

    const r: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
    objsToClose.push(r);
    expect(r).not.toBeUndefined();

    const voicesResult: sdk.SynthesisVoicesResult = await r.getVoicesAsync();
    expect(voicesResult).not.toBeUndefined();
    expect(voicesResult.resultId).not.toBeUndefined();
    expect(voicesResult.voices.length).toBeGreaterThan(0);
    expect(voicesResult.reason).toEqual(sdk.ResultReason.VoicesListRetrieved);

    for (const voice of voicesResult.voices) {
        expect(voice.name).not.toBeUndefined();
        expect(voice.locale).not.toBeUndefined();
        expect(voice.shortName).not.toBeUndefined();
        expect(voice.displayName).not.toBeUndefined();
        expect(voice.localName).not.toBeUndefined();
        expect(voice.gender).not.toEqual(sdk.SynthesisVoiceGender.Unknown);
        expect(voice.voiceType).not.toEqual(sdk.SynthesisVoiceType.Unknown);
    }
});

test("testGetVoicesAsyncAuthWithToken", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetVoicesAsyncAuthWithToken");

    const url = `https://${Settings.SpeechRegion}.api.cognitive.microsoft.com/`;
    const path = "sts/v1.0/issueToken";
    const headers = {
        "Content-Type": "application/json",
        [HeaderNames.AuthKey]: Settings.SpeechSubscriptionKey,
    };

    let authToken: string;
    const sendRequest = bent(url, "POST", "string", headers, 200);
    sendRequest(path)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
        .then((resp: BentResponse): void => {
            authToken = resp as unknown as string;
        }).catch((error): void => done(error));

    WaitForCondition((): boolean => !!authToken, (): void => {
        const config: sdk.SpeechConfig = sdk.SpeechConfig.fromAuthorizationToken(authToken, Settings.SpeechRegion);
        objsToClose.push(config);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(config, null);
        expect(s).not.toBeUndefined();

        objsToClose.push(s);

        s.getVoicesAsync().then((voicesResult: sdk.SynthesisVoicesResult): void => {
            expect(voicesResult).not.toBeUndefined();
            expect(voicesResult.resultId).not.toBeUndefined();
            expect(voicesResult.voices.length).toBeGreaterThan(0);
            expect(voicesResult.reason).toEqual(sdk.ResultReason.VoicesListRetrieved);
            done();
        }).catch((error: any): void => {
            done(error);
            console.log(error as string);
        });
    });
}, 15000);

test("testGetVoicesAsyncUS", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: testGetVoicesAsyncUS");
    const speechConfig: sdk.SpeechConfig = await BuildSpeechConfig();

    const r: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
    objsToClose.push(r);
    expect(r).not.toBeUndefined();
    const locale = "en-US";

    const voicesResult: sdk.SynthesisVoicesResult = await r.getVoicesAsync(locale);
    expect(voicesResult).not.toBeUndefined();
    expect(voicesResult.resultId).not.toBeUndefined();
    expect(voicesResult.voices.length).toBeGreaterThan(0);
    expect(voicesResult.reason).toEqual(sdk.ResultReason.VoicesListRetrieved);
    expect(voicesResult.voices.filter((item: any): boolean => item.locale !== locale).length).toEqual(0);
    const ava: sdk.VoiceInfo = voicesResult.voices.find((item: sdk.VoiceInfo): boolean => item.shortName === "en-US-AvaNeural");
    expect(ava).not.toBeUndefined();
    expect(ava.voiceTag.TailoredScenarios).not.toBeUndefined();
    expect(ava.voiceTag.TailoredScenarios[0]).toEqual("Chat");
    expect(ava.gender).toEqual(sdk.SynthesisVoiceGender.Female);
    expect(ava.voiceType).toEqual(sdk.SynthesisVoiceType.OnlineNeural);
});

Settings.testIfDOMCondition("testSpeechSynthesizer1", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: testSpeechSynthesizer1");
    const speechConfig: sdk.SpeechConfig = await BuildSpeechConfig();

    const config: sdk.AudioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();

    const r: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, config);
    objsToClose.push(r);

    expect(r).not.toBeUndefined();

    expect(r instanceof sdk.SpeechSynthesizer);
});

test("testSetAndGetParameters", async (): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info("Name: testSetAndGetParameters");
    const speechConfig: sdk.SpeechConfig = await BuildSpeechConfig();
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

describe("Service based tests", (): void => {

    describe.each([
        SpeechConnectionType.Subscription,
        SpeechConnectionType.CloudFromEndpointWithKeyAuth,
        SpeechConnectionType.CloudFromEndpointWithCogSvcsTokenAuth,
        // SpeechConnectionType.CloudFromEndpointWithEntraIdTokenAuth,
        SpeechConnectionType.LegacyCogSvcsTokenAuth,
        SpeechConnectionType.LegacyEntraIdTokenAuth,
        SpeechConnectionType.CloudFromHost,
        SpeechConnectionType.ContainerFromHost,
        // SpeechConnectionType.ContainerFromEndpoint,
        SpeechConnectionType.PrivateLinkWithKeyAuth,
        // SpeechConnectionType.PrivateLinkWithEntraIdTokenAuth,
        SpeechConnectionType.LegacyPrivateLinkWithKeyAuth,
        SpeechConnectionType.LegacyPrivateLinkWithEntraIdTokenAuth
    ])("Speech Synthesis Connection Tests", (connectionType: SpeechConnectionType): void => {

        const runTest: jest.It = SpeechConfigConnectionFactory.runConnectionTest(connectionType);

        runTest("Speech Synthesizer Events " + SpeechConnectionType[connectionType], (done: jest.DoneCallback): void => {
            // eslint-disable-next-line no-console
            console.info("Name: Speech Synthesizer Events " + SpeechConnectionType[connectionType]);
            BuildSpeechConfig(connectionType).then((speechConfig: sdk.SpeechConfig): void => {
                objsToClose.push(speechConfig);
                speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

                const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
                objsToClose.push(s);

                expect(s).not.toBeUndefined();

                let audioLength: number = 0;
                let startEventCount: number = 0;
                let synthesizingEventCount: number = 0;
                let completeEventCount: number = 0;

                s.synthesisStarted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                    // eslint-disable-next-line no-console
                    console.info("Synthesis started.");
                    try {
                        CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioStarted);
                    } catch (e) {
                        done(e);
                    }
                    startEventCount += 1;
                };

                s.synthesizing = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                    // eslint-disable-next-line no-console
                    console.info("Audio received with length of " + e.result.audioData.byteLength.toString());
                    audioLength += e.result.audioData.byteLength - 44;
                    try {
                        CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudio);
                    } catch (e) {
                        done(e);
                    }
                    synthesizingEventCount += 1;
                };

                s.synthesisCompleted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                    // eslint-disable-next-line no-console
                    console.info("Audio received with length of " + e.result.audioData.byteLength.toString());
                    try {
                        CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioCompleted);
                        expect(e.result.audioData.byteLength - 44).toEqual(audioLength);
                    } catch (e) {
                        done(e);
                    }
                    completeEventCount += 1;
                };

                s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
                    try {
                        expect(e).not.toBeUndefined();
                    } catch (e) {
                        done(e);
                    }
                };

                s.speakTextAsync("hello world.", undefined, (e: string): void => {
                    done(e);
                });

                WaitForCondition((): boolean => completeEventCount !== 0, (): void => {
                    expect(startEventCount).toEqual(1);
                    expect(synthesizingEventCount).toBeGreaterThan(0);
                    done();
                });
            }).catch((error: string): void => {
                done(error);
            });
        }, 15000);

        runTest("Speech Synthesizer Speak Twice " + SpeechConnectionType[connectionType], (done: jest.DoneCallback): void => {
            // eslint-disable-next-line no-console
            console.info("Name: Speech Synthesizer Speak Twice " + SpeechConnectionType[connectionType]);
            BuildSpeechConfig(connectionType).then((speechConfig: sdk.SpeechConfig): void => {
                objsToClose.push(speechConfig);
                speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

                const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
                objsToClose.push(s);

                expect(s).not.toBeUndefined();

                s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
                    // eslint-disable-next-line no-console
                    console.info("speaking finished, turn 1");
                    CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                    // To seconds
                    expect(result.audioDuration / 1000 / 1000 / 10).toBeCloseTo(result.audioData.byteLength / 32000, 2);
                }, (e: string): void => {
                    done(e);
                });

                s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
                    // eslint-disable-next-line no-console
                    console.info("speaking finished, turn 2");
                    CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                    expect(result.audioDuration / 1000 / 1000 / 10).toBeCloseTo(result.audioData.byteLength / 32000, 2);
                    done();
                }, (e: string): void => {
                    done(e);
                });
            }).catch((error: string): void => {
                done(error);
            });
        });
    });

    test("testSpeechSynthesizerEvent1", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerEvent1");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
            objsToClose.push(s);

            expect(s).not.toBeUndefined();

            let audioLength: number = 0;
            let startEventCount: number = 0;
            let synthesizingEventCount: number = 0;
            let completeEventCount: number = 0;

            s.synthesisStarted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                // eslint-disable-next-line no-console
                console.info("Synthesis started.");
                try {
                    CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioStarted);
                } catch (e) {
                    done(e);
                }
                startEventCount += 1;
            };

            s.synthesizing = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                // eslint-disable-next-line no-console
                console.info("Audio received with length of " + e.result.audioData.byteLength.toString());
                audioLength += e.result.audioData.byteLength - 44;
                try {
                    CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudio);
                } catch (e) {
                    done(e);
                }
                synthesizingEventCount += 1;
            };

            s.synthesisCompleted = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                // eslint-disable-next-line no-console
                console.info("Audio received with length of " + e.result.audioData.byteLength.toString());
                try {
                    CheckSynthesisResult(e.result, sdk.ResultReason.SynthesizingAudioCompleted);
                    expect(e.result.audioData.byteLength - 44).toEqual(audioLength);
                } catch (e) {
                    done(e);
                }
                completeEventCount += 1;
            };

            s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
                try {
                    expect(e).not.toBeUndefined();
                } catch (e) {
                    done(e);
                }
            };

            s.speakTextAsync("hello world.", undefined, (e: string): void => {
                done(e);
            });

            WaitForCondition((): boolean => completeEventCount !== 0, (): void => {
                expect(startEventCount).toEqual(1);
                expect(synthesizingEventCount).toBeGreaterThan(0);
                done();
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerSpeakTwice", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerSpeakTwice");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
            objsToClose.push(s);

            expect(s).not.toBeUndefined();

            s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished, turn 1");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                // To seconds
                expect(result.audioDuration / 1000 / 1000 / 10).toBeCloseTo(result.audioData.byteLength / 32000, 2);
            }, (e: string): void => {
                done(e);
            });

            s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished, turn 2");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                expect(result.audioDuration / 1000 / 1000 / 10).toBeCloseTo(result.audioData.byteLength / 32000, 2);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerToFile", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerToFile");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

            const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromAudioFileOutput("test.wav");
            expect(audioConfig).not.toBeUndefined();

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

            expect(s).not.toBeUndefined();

            let audioLength: number = 0;

            s.speakTextAsync("hello world 1.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished, turn 1");
                audioLength += result.audioData.byteLength;
            }, (e: string): void => {
                done(e);
            });

            s.speakTextAsync("hello world 2.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished, turn 2");
                audioLength += result.audioData.byteLength;
                s.close();
                // wait 2 seconds before checking file size, as the async file writing might not be finished right now.
                setTimeout(() => {
                    const fileLength = fs.statSync("test.wav").size;
                    expect(fileLength).toEqual(audioLength - 44);
                    done();
                }, 2000);
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizer: synthesis to file in turn.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer synthesis to file in turn.");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
            objsToClose.push(speechConfig);

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            expect(s).not.toBeUndefined();
            objsToClose.push(s);

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                // wait 2 seconds before checking file size, as the async file writing might not be finished right now.
                setTimeout((): void => {
                    const fileLength = fs.statSync("test1.mp3").size;
                    expect(fileLength).toEqual(result.audioData.byteLength);
                    done();
                }, 2000);
            }, (e: string): void => {
                done(e);
            }, "test1.mp3");
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerWordBoundary", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerWordBoundary");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
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
                    done(e);
                }
                wordBoundaryCount += 1;
            };

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                expect(wordBoundaryCount).toBeGreaterThan(0);
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerWordBoundaryMathXml", (done: jest.DoneCallback): void => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerWordBoundaryMathXml");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            objsToClose.push(s);

            expect(s).not.toBeUndefined();

            let wordBoundaryCount: number = 0;
            const expectedSsmlOffsets: number[] = [206, 211, 214, 217, 225, 227];
            const expectedBoundary: sdk.SpeechSynthesisBoundaryType[] =
                [sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Punctuation,
                sdk.SpeechSynthesisBoundaryType.Word];

            s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
                try {
                    expect(e).not.toBeUndefined();
                    expect(e.audioOffset).not.toBeUndefined();
                    expect(e.text).not.toBeUndefined();
                    expect(e.textOffset).not.toBeUndefined();
                    expect(e.wordLength).not.toBeUndefined();
                    expect(e.textOffset).toEqual(expectedSsmlOffsets[wordBoundaryCount]);
                    expect(e.boundaryType).toEqual(expectedBoundary[wordBoundaryCount]);
                } catch (e) {
                    done(e);
                }
                wordBoundaryCount += 1;
            };

            const ssml: string =
                `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xmlns:emo='http://www.w3.org/2009/10/emotionml' xml:lang='en-US'>
<voice name='en-US-JennyNeural'>This is an equation: <math xmlns="http://www.w3.org/1998/Math/MathML"><msqrt><mn>2</mn></msqrt></math></voice></speak>`;

            s.speakSsmlAsync(ssml, (result: sdk.SpeechSynthesisResult): void => {
                expect(wordBoundaryCount).toBeGreaterThan(0);
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test.skip("testSpeechSynthesizerSentenceBoundary", (done: jest.DoneCallback): void => {
        // tslint:disable-next-line:no-console
        console.info("Name: testSpeechSynthesizerWordBoundaryMathXml");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            speechConfig.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            objsToClose.push(s);

            expect(s).not.toBeUndefined();

            let wordBoundaryCount: number = 0;
            const expectedSsmlOffsets: number[] = [206, 212, 216, 206, 257, 261, 268, 257, 310, 314, 320, 310, 359, 365, 372, 359, 412, 418, 425, 412, 467, 473, 477, 467];
            const expectedBoundary: sdk.SpeechSynthesisBoundaryType[] =
                [sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Word,
                sdk.SpeechSynthesisBoundaryType.Punctuation,
                sdk.SpeechSynthesisBoundaryType.Word];

            s.wordBoundary = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisWordBoundaryEventArgs): void => {
                try {
                    expect(e).not.toBeUndefined();
                    expect(e.audioOffset).not.toBeUndefined();
                    expect(e.text).not.toBeUndefined();
                    expect(e.textOffset).not.toBeUndefined();
                    expect(e.wordLength).not.toBeUndefined();
                    expect(e.textOffset).toEqual(expectedSsmlOffsets[wordBoundaryCount]);
                    // expect(e.boundaryType).toEqual(expectedBoundary[wordBoundaryCount]);
                } catch (e) {
                    done(e);
                }
                wordBoundaryCount += 1;
            };

            const ssml: string =
                `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts' xmlns:emo='http://www.w3.org/2009/10/emotionml' xml:lang='en-US'>
<voice name='de-DE-ConradNeural'>Hallo Welt.</voice><voice name='da-DK-JeppeNeural'>Hei maailma.</voice>
<voice name='nb-NO-IselinNeural'>Hei Verden.</voice><voice name='lt-LT-OnaNeural'>Labas pasauli.</voice>
<voice name='ar-QA-MoazNeural'>مرحبا بالعالم.</voice><voice name='de-DE-ConradNeural'>Hallo Welt.</voice></speak>`;

            s.speakSsmlAsync(ssml.split("\n").join(""), (result: sdk.SpeechSynthesisResult): void => {
                try {
                    expect(wordBoundaryCount).toBeGreaterThan(0);
                    CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                    done();
                } catch (e) {
                    done(e);
                }
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerBookmark", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerBookmark");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            objsToClose.push(s);

            expect(s).not.toBeUndefined();

            let bookmarkCount: number = 0;

            s.bookmarkReached = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisBookmarkEventArgs): void => {
                try {
                    expect(e).not.toBeUndefined();
                    expect(e.audioOffset).not.toBeUndefined();
                    if (bookmarkCount === 0) {
                        expect(e.text).toEqual("bookmark");
                    }
                } catch (e) {
                    done(e);
                }
                bookmarkCount += 1;
            };

            const ssml: string =
                `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
 <voice name='en-US-GuyNeural'><bookmark mark='bookmark'/> one. <bookmark mark='书签'/> two. three. four.</voice></speak>`;
            s.speakSsmlAsync(ssml, (result: sdk.SpeechSynthesisResult): void => {
                expect(bookmarkCount).toEqual(2);
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerViseme", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerViseme");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            objsToClose.push(s);

            expect(s).not.toBeUndefined();

            let visemeCount: number = 0;

            s.visemeReceived = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisVisemeEventArgs): void => {
                try {
                    expect(e).not.toBeUndefined();
                    expect(e.audioOffset).not.toBeUndefined();
                    expect(e.visemeId).not.toBeUndefined();
                    expect(e.animation).not.toBeUndefined();
                } catch (e) {
                    done(e);
                }
                visemeCount += 1;
            };

            const ssml: string =
                `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
<voice name='en-US-JennyNeural'><mstts:viseme type='svg'/>I want to avoid monotony.</voice></speak>`;
            s.speakSsmlAsync(ssml, (result: sdk.SpeechSynthesisResult): void => {
                expect(visemeCount).toBeGreaterThan(0);
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizer: synthesis with SSML.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer synthesis with SSML.");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            speechConfig.speechSynthesisVoiceName = "en-US-AvaNeural";

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, null);
            expect(s).not.toBeUndefined();
            objsToClose.push(s);

            let r: sdk.SpeechSynthesisResult;
            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking text finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                r = result;
            }, (e: string): void => {
                done(e);
            });

            const ssml: string =
                `<speak version='1.0' xml:lang='en-US' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='http://www.w3.org/2001/mstts'>
<voice name='Microsoft Server Speech Text to Speech Voice (en-US, AvaNeural)'>hello world.</voice></speak>`;
            s.speakSsmlAsync(ssml, (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking ssml finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                CheckBinaryEqual(r.audioData, result.audioData);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    Settings.testIfDOMCondition("testSpeechSynthesizer: synthesis with invalid key.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
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
                const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(e.result);
                expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.ConnectionFailure);
                expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
                expect(cancellationDetail.errorDetails).toEqual(e.result.errorDetails);
            } catch (err) {
                done(err);
            }
        };

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            CheckSynthesisResult(result, sdk.ResultReason.Canceled);
            const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
            expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.ConnectionFailure);
            expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
            expect(cancellationDetail.errorDetails).toEqual(result.errorDetails);
            done();
        }, (e: string): void => {
            done(e);
        });
    });

    test("testSpeechSynthesizer: synthesis with invalid voice name.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer synthesis with invalid voice name.");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
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
                    done(e);
                }
            };

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                CheckSynthesisResult(result, sdk.ResultReason.Canceled);
                expect(result.errorDetails).toContain("voice");
                const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.BadRequestParameters);
                expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
                expect(cancellationDetail.errorDetails).toEqual(result.errorDetails);
            }, (e: string): void => {
                done(e);
            });

            s.speakTextAsync("today is a nice day.", (result: sdk.SpeechSynthesisResult): void => {
                CheckSynthesisResult(result, sdk.ResultReason.Canceled);
                expect(result.errorDetails).toContain("voice");
                const cancellationDetail: sdk.CancellationDetails = sdk.CancellationDetails.fromResult(result);
                expect(cancellationDetail.ErrorCode).toEqual(sdk.CancellationErrorCode.BadRequestParameters);
                expect(cancellationDetail.reason).toEqual(sdk.CancellationReason.Error);
                expect(cancellationDetail.errorDetails).toEqual(result.errorDetails);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizer: synthesis to pull audio output stream.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer synthesis to pull audio output stream.");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);

            const stream = sdk.AudioOutputStream.createPullStream();
            const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamOutput(stream);
            expect(audioConfig).not.toBeUndefined();

            setTimeout(() => {
                ReadPullAudioOutputStream(stream, undefined, done);
            }, 0);

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
            expect(s).not.toBeUndefined();

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking text finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                s.close();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizer: synthesis to pull audio output stream 2.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer synthesis to pull audio output stream 2.");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm;

            const stream = sdk.AudioOutputStream.createPullStream();
            const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamOutput(stream);
            expect(audioConfig).not.toBeUndefined();

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
            expect(s).not.toBeUndefined();

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking text finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                s.close();
                ReadPullAudioOutputStream(stream, result.audioData.byteLength - 44, done);
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    Settings.testIfDOMCondition("testSpeechSynthesizer: synthesis to push audio output stream.", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer synthesis to push audio output stream.");
        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);

            const stream = new PushAudioOutputStreamTestCallback();
            const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamOutput(stream);
            expect(audioConfig).not.toBeUndefined();

            const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
            expect(s).not.toBeUndefined();

            s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking text finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                s.close();
                expect(stream.length).toEqual(result.audioData.byteLength);
                expect(stream.isClosed).toEqual(true);
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizer: authentication with authorization token", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizer authentication with authorization token");

        const url = `https://${Settings.SpeechRegion}.api.cognitive.microsoft.com/`;
        const path = "sts/v1.0/issueToken";
        const headers = {
            "Content-Type": "application/json",
            [HeaderNames.AuthKey]: Settings.SpeechSubscriptionKey,
        };

        const sendRequest = bent(url, "POST", headers, 200);
        let authToken: string;
        sendRequest(path)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
            .then((resp: BentResponse): void => {
                resp.text().then((token: string): void => {
                    authToken = token;
                }).catch((error: any): void => {
                    done.fail(error as string);
                });
            }).catch((error: any): void => {
                done.fail(error as string);
            });

        WaitForCondition((): boolean => !!authToken, (): void => {
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
                // eslint-disable-next-line no-console
                console.info("speaking text finished.");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                done();
            }, (e: string): void => {
                done(e);
            });
        });
    });

    test("test Speech Synthesizer: Language Auto Detection", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: test Speech Synthesizer, Language Auto Detection");

        BuildSpeechConfig().then((speechConfig: sdk.SpeechConfig): void => {
            objsToClose.push(speechConfig);
            const autoDetectSourceLanguageConfig: sdk.AutoDetectSourceLanguageConfig = sdk.AutoDetectSourceLanguageConfig.fromOpenRange();
            objsToClose.push(autoDetectSourceLanguageConfig);

            const s: sdk.SpeechSynthesizer = sdk.SpeechSynthesizer.FromConfig(speechConfig, autoDetectSourceLanguageConfig, null);
            objsToClose.push(s);
            expect(s).not.toBeUndefined();

            const con: sdk.Connection = sdk.Connection.fromSynthesizer(s);

            con.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
                if (args.message.path === "synthesis.context" && args.message.isTextMessage) {
                    try {
                        expect(args.message.TextMessage).toContain("\"autoDetection\":true");
                    } catch (error) {
                        done(error);
                    }
                }
            };

            s.SynthesisCanceled = (o: sdk.SpeechSynthesizer, e: sdk.SpeechSynthesisEventArgs): void => {
                done();
            };

            // we will get very short audio as the en-US voices are not mix-lingual.
            s.speakTextAsync("你好世界。", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished, turn 1");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                expect(result.audioData.byteLength).toBeGreaterThan(64 << 7); // longer than 1s
            }, (e: string): void => {
                done(e);
            });

            s.speakTextAsync("今天天气很好。", (result: sdk.SpeechSynthesisResult): void => {
                // eslint-disable-next-line no-console
                console.info("speaking finished, turn 2");
                CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
                expect(result.audioData.byteLength).toBeGreaterThan(64 << 7); // longer than 1s
                done();
            }, (e: string): void => {
                done(e);
            });
        }).catch((error: string): void => {
            done(error);
        });
    });

    test("testSpeechSynthesizerUsingCustomVoice", (done: jest.DoneCallback): void => {
        // eslint-disable-next-line no-console
        console.info("Name: testSpeechSynthesizerUsingCustomVoice");

        let uri: string;
        Events.instance.attachListener({
            onEvent: (event: PlatformEvent): void => {
                if (event instanceof ConnectionStartEvent) {
                    const connectionEvent: ConnectionStartEvent = event;
                    uri = connectionEvent.uri;
                }
            },
        });

        const speechConfig: sdk.SpeechConfig = sdk.SpeechConfig.fromSubscription(Settings.CustomVoiceSubscriptionKey, Settings.CustomVoiceRegion);
        expect(speechConfig).not.toBeUndefined();
        speechConfig.endpointId = Settings.CustomVoiceEndpointId;
        speechConfig.speechSynthesisVoiceName = Settings.CustomVoiceVoiceName;
        objsToClose.push(speechConfig);

        const s: sdk.SpeechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, undefined);
        objsToClose.push(s);

        expect(s).not.toBeUndefined();

        s.speakTextAsync("hello world.", (result: sdk.SpeechSynthesisResult): void => {
            CheckSynthesisResult(result, sdk.ResultReason.SynthesizingAudioCompleted);
            expect(uri).not.toBeUndefined();
            expect(uri.search(QueryParameterNames.CustomVoiceDeploymentId + "=" + Settings.CustomVoiceEndpointId)).not.toEqual(-1);
            done();
        }, (e: string): void => {
            done(e);
        });
    });

    // WebRTC PeerConnection is not implemented in jest, which is only available in browser.
    test.skip("testAvatarSynthesizerDemo", async (): Promise<void> => {
        const speechConfig: sdk.SpeechConfig = await BuildSpeechConfig();
        const videoFormat: sdk.AvatarVideoFormat = new sdk.AvatarVideoFormat(
            /* codec */ "h264",
            /* bitrate */ 2000000,
            /* width */ 1920,
            /* height */ 1080);
        const avatarConfig: sdk.AvatarConfig = new sdk.AvatarConfig(
            /* character */ "lisa", /* style */ "casual-sitting", videoFormat);
        const avatarSynthesizer: sdk.AvatarSynthesizer = new sdk.AvatarSynthesizer(speechConfig, avatarConfig);
        avatarSynthesizer.avatarEventReceived = (o: sdk.AvatarSynthesizer, e: sdk.AvatarEventArgs): void => {
            // eslint-disable-next-line no-console
            console.info("Avatar event received " + e.type);
        };

        const iceServer: RTCIceServer = {
            credential: "<your webrtc connection ICE credential>",
            urls: ["<your webrtc connection ICE server list>"],
            username: "<your webrtc connection ICE username>"
        };

        let peerConnection: RTCPeerConnection;
        try {
            peerConnection = new RTCPeerConnection(
                { iceServers: [iceServer] },
            );
        } catch (error) {
            throw new Error("Failed to create RTCPeerConnection, error: " + error.toString());
        }

        const webrtcConnectionResult: sdk.SynthesisResult = await avatarSynthesizer.startAvatarAsync(peerConnection);
        expect(webrtcConnectionResult.reason).toEqual(sdk.ResultReason.SynthesizingAudioStarted);

        // start speaking, the audio will be streamed to the WebRTC connection
        await avatarSynthesizer.speakSsmlAsync("<ssml>");

        // wait a while and stop speaking, the avatar will stop speaking switch to idle state.
        await avatarSynthesizer.stopSpeakingAsync();

        // stop the avatar synthesizer and close the WebRTC connection.
        await avatarSynthesizer.stopAvatarAsync();
    });
});
