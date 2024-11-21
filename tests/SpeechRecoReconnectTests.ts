// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import { SimpleSpeechPhrase } from "../src/common.speech/Exports";
import { Events } from "../src/common/Exports";

import { Settings } from "./Settings";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

import { WaitForCondition } from "./Utilities";


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

afterEach((): void => {
    // eslint-disable-next-line no-console
    console.info("End Time: " + new Date(Date.now()).toLocaleString());
    objsToClose.forEach((value: { close: () => any }): void => {
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
        s.setProperty(sdk.PropertyId.SpeechServiceConnection_Region, Settings.SpeechRegion);
    }

    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    expect(s).not.toBeUndefined();
    return s;
};

jest.retryTimes(Settings.RetryCount);

// Tests client reconnect after speech timeouts.
test("Reconnect After timeout", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Reconnect After timeout");

    // Pump valid speech and then silence until at least one speech end cycle hits.
    const fileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.WaveFile);

    const alternatePhraseFileBuffer: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.LuisWaveFile);

    const s: sdk.SpeechConfig = BuildSpeechConfig();
    objsToClose.push(s);
    s.setServiceProperty("maxConnectionDurationSecs", "30", sdk.ServicePropertyChannel.UriQueryParameter);

    let pumpSilence: boolean = false;
    let sendAlternateFile: boolean = false;

    let bytesSent: number = 0;
    const maxRecognitions: number = 500;

    // Pump the audio from the wave file specified with 1 second silence between iterations indefinitely.
    const p = sdk.AudioInputStream.createPullStream(
        {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            close: (): void => { },
            read: (buffer: ArrayBuffer): number => {
                if (pumpSilence) {
                    bytesSent += buffer.byteLength;
                    if (bytesSent >= 16000) {
                        bytesSent = 0;
                        pumpSilence = false;
                    }
                    return buffer.byteLength;
                } else {
                    // Alternate between the two files with different phrases in them.
                    const sendBuffer: ArrayBuffer = sendAlternateFile ? alternatePhraseFileBuffer : fileBuffer;

                    const copyArray: Uint8Array = new Uint8Array(buffer);
                    const start: number = bytesSent;
                    const end: number = buffer.byteLength > (sendBuffer.byteLength - bytesSent) ? (sendBuffer.byteLength) : (bytesSent + buffer.byteLength);
                    copyArray.set(new Uint8Array(sendBuffer.slice(start, end)));
                    const readyToSend: number = (end - start);
                    bytesSent += readyToSend;

                    if (readyToSend < buffer.byteLength) {
                        bytesSent = 0;
                        pumpSilence = true;
                        sendAlternateFile = !sendAlternateFile;
                    }
                    return readyToSend;
                }
            },
        });

    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(p);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    let lastOffset: number = 0;
    let recogCount: number = 0;
    let alternatePhrase: boolean = false;
    let connections: number = 0;
    let disconnects: number = 0;
    let postDisconnectReco: boolean = false;
    let cancelled: boolean = false;

    const tenMinutesHns: number = 10 * 60 * 1000 * 10000;

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    r.recognizing = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            // Log the offset
            expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizingSpeech]);
            expect(e.offset).toBeGreaterThanOrEqual(lastOffset);

            let simpleResult: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult), 0);
            expect(simpleResult.Offset).toBeGreaterThanOrEqual(lastOffset);

            simpleResult = SimpleSpeechPhrase.fromJSON(e.result.json, 0);
            expect(simpleResult.Offset).toBeGreaterThanOrEqual(lastOffset);
        } catch (error) {
            done(error as string);
        }
    };

    r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        try {
            // If the target number of loops has been seen already, don't check as the audio being sent could have been clipped randomly during a phrase,
            // and failing because of that isn't warranted.
            if (recogCount <= maxRecognitions && !postDisconnectReco) {

                expect(sdk.ResultReason[e.result.reason]).toEqual(sdk.ResultReason[sdk.ResultReason.RecognizedSpeech]);
                expect(e.offset).toBeGreaterThanOrEqual(lastOffset);

                let simpleResult: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult), 0);
                expect(simpleResult.Offset).toBeGreaterThanOrEqual(lastOffset);

                simpleResult = SimpleSpeechPhrase.fromJSON(e.result.json, 0);
                expect(simpleResult.Offset).toBeGreaterThanOrEqual(lastOffset);

                lastOffset = e.offset;

                // If there is silence exactly at the moment of disconnect, an extra speech.phrase with text ="" is returned just before the
                // connection is disconnected.
                const modTen: number = e.result.offset % tenMinutesHns;

                // If withing 100ms of an even 10 min, ignore text issues. The Speech Service is forcedly ending turns at 10 minute intervals.
                if ("" !== e.result.text || modTen < 100 * 10000 || modTen > (tenMinutesHns - (100 * 10000))) {
                    if (alternatePhrase) {
                        expect(e.result.text).toEqual(Settings.LuisWavFileText);
                    } else {
                        expect(e.result.text).toEqual(Settings.WaveFileText);
                    }

                    alternatePhrase = !alternatePhrase;
                }

                if (disconnects > 0) {
                    postDisconnectReco = true;
                }

                if (recogCount++ >= maxRecognitions) {
                    p.close();
                }
            }
        } catch (error) {
            done(error as string);
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        try {
            expect(e.errorDetails).toBeUndefined();
            expect(sdk.CancellationReason[e.reason]).toEqual(sdk.CancellationReason[sdk.CancellationReason.EndOfStream]);
            cancelled = true;
        } catch (error) {
            done(error as string);
        }
    };

    connection.disconnected = (): void => {
        disconnects++;
    };

    connection.connected = (): void => {
        connections++;
    };

    r.startContinuousRecognitionAsync((): void => {
        WaitForCondition((): boolean => (!!postDisconnectReco || !!cancelled), (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                try {
                    expect(connections).toEqual(2);
                    expect(disconnects).toEqual(1);
                    done();
                } catch (error) {
                    done(error as string);
                }
            }, (error: string): void => {
                done(error);
            });
        });
    },
        (err: string): void => {
            done(err);
        });
}, 1000 * 60 * 2);
