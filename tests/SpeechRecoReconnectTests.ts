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

// Builds a config that targets the reliable-reconnect / multichannel protocol using the
// endpoint from the shared test Settings, with multichannel processing enabled.
const BuildReliableReconnectConfig: () => sdk.SpeechConfig = (): sdk.SpeechConfig => {
    const endpoint: URL = new URL(Settings.SpeechEndpoint);

    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(endpoint, Settings.SpeechSubscriptionKey);
    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }

    // Opt in to multi-channel processing, which implicitly enables the reliable reconnect
    // protocol.
    s.setProperty(sdk.PropertyId.Speech_EnableMultiChannelProcessing, "true");

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

// The multichannel reliable-reconnect tests require the connection-test environment (the
// multichannel-capable endpoint), so they run in the RunConnectionTests CI job. Jest routes
// them there because this describe block's name contains "Connection Tests".
describe("Reliable Reconnect Connection Tests", (): void => {

// Recognize a genuine multichannel WAV with the reliable-reconnect protocol enabled and
// verify the service emits the X-Continuation-Token / X-Continuation-Audio-Streams-1-Offset
// headers. Uses SpeechRecognizer (not ConversationTranscriber) because multichannel is
// channel-based separation and the service rejects it alongside the speaker diarization that
// ConversationTranscriber enables.
test("Reliable reconnect - multichannel audio receives continuation token", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Reliable reconnect - multichannel audio receives continuation token");

    const s: sdk.SpeechConfig = BuildReliableReconnectConfig();
    objsToClose.push(s);
    // Request that the service drop the websocket after ~15s so a reconnect happens mid-stream,
    // exercising the reliable-reconnect resume path. The service does not honor an exact 15s
    // boundary, so the actual drop lands somewhat later - the test keys off the reconnect event
    // itself, not a wall-clock time. Recognition must continue seamlessly after the reconnect.
    s.setServiceProperty("maxConnectionDurationSecs", "15", sdk.ServicePropertyChannel.UriQueryParameter);

    // Genuine multichannel (2-channel) audio - this is what activates the
    // continuation contract server-side. The 2-channel PCM is looped forever so the turn stays
    // active past the forced drop, guaranteeing a mid-turn reconnect with recognition results
    // on BOTH sides of it (the test stops the turn itself once that is observed).
    const pcm: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.MultiChannelWaveFile);
    let readOffset: number = 0;
    const pullStream: sdk.PullAudioInputStream = sdk.AudioInputStream.createPullStream(
        {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            close: (): void => { },
            read: (buffer: ArrayBuffer): number => {
                const target: Uint8Array = new Uint8Array(buffer);
                const source: Uint8Array = new Uint8Array(pcm);
                let written: number = 0;
                while (written < target.length) {
                    if (readOffset >= source.length) {
                        readOffset = 0;
                    }
                    const chunk: number = Math.min(target.length - written, source.length - readOffset);
                    target.set(source.subarray(readOffset, readOffset + chunk), written);
                    written += chunk;
                    readOffset += chunk;
                }
                return target.length;
            },
        },
        sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 2));
    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(pullStream);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    let audioStreamsMarkerSent: boolean = false;
    let streamIdHeaderOnAudio: boolean = false;
    let serviceReturnedContinuationToken: boolean = false;
    let serviceReturnedOffsetHeader: boolean = false;
    let serviceReturnedServiceTag: boolean = false;
    let lastServiceToken: string = "";
    let lastServiceTag: string = "";
    // Per-channel results the service returns ("Channel":0 / "Channel":1). Both channels of
    // the multichannel audio must be seen for the test to pass.
    const channelsSeen: Set<number> = new Set<number>();
    let disconnects: number = 0;
    let connections: number = 0;
    // Final recognition results split by the forced mid-stream drop: everything the service
    // returns BEFORE the reconnect vs everything it returns AFTER it. Both buckets must contain
    // the expected text to prove recognition resumed across the reconnect.
    const resultsBeforeReconnect: string[] = [];
    const resultsAfterReconnect: string[] = [];

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
        const message: sdk.ConnectionMessage = args.message;
        if (message.path === "speech.context" && message.isTextMessage) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context: any = JSON.parse(message.TextMessage);
            if (!!context.audio && !!context.audio.streams) {
                audioStreamsMarkerSent = true;
            }
        } else if (message.path === "audio" && message.isBinaryMessage) {
            if (message.properties.getProperty("X-StreamId", "") === "1") {
                streamIdHeaderOnAudio = true;
            }
        }
    };

    connection.messageReceived = (args: sdk.ConnectionMessageEventArgs): void => {
        // NOTE: WebsocketMessageFormatter.parseHeaders() lowercases every header name, and
        // PropertyCollection.getProperty() is case-sensitive, so the service's mixed-case
        // "X-Continuation-Token" is stored as the lowercase key. Look up both spellings.
        const token: string = args.message.properties.getProperty("X-Continuation-Token", "")
            || args.message.properties.getProperty("x-continuation-token", "");
        if (token !== "") {
            serviceReturnedContinuationToken = true;
            lastServiceToken = token;
        }
        const offset: string = args.message.properties.getProperty("X-Continuation-Audio-Streams-1-Offset", "")
            || args.message.properties.getProperty("x-continuation-audio-streams-1-offset", "");
        if (offset !== "") {
            serviceReturnedOffsetHeader = true;
        }
        // The serviceTag is NOT a header - the service carries it in the turn.start body at
        // $.context.serviceTag. Parse it out so we can assert the service issued one.
        if (args.message.path === "turn.start" && args.message.isTextMessage) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const turnStart: any = JSON.parse(args.message.TextMessage);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const tag: string = (turnStart && turnStart.context && turnStart.context.serviceTag)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    ? String(turnStart.context.serviceTag) : "";
                if (tag !== "") {
                    serviceReturnedServiceTag = true;
                    lastServiceTag = tag;
                }
            } catch { /* ignore non-JSON turn.start */ }
        }
    };

    connection.disconnected = (): void => {
        disconnects++;
    };

    connection.connected = (): void => {
        connections++;
    };

    r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        // Bucket the final text by whether the drop/reconnect has happened yet.
        if (e.result.text) {
            const bucket: string[] = disconnects > 0 ? resultsAfterReconnect : resultsBeforeReconnect;
            bucket.push(e.result.text);
        }
        // Record which channel this result came from so we can assert both channels of the
        // multichannel audio produced output.
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const phrase: any = JSON.parse(e.result.json);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (phrase && typeof phrase.Channel === "number") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                channelsSeen.add(phrase.Channel as number);
            }
        } catch { /* ignore non-JSON results */ }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        // With a looped stream the turn never ends naturally; only a real service error should
        // cancel it, which is a test failure.
        if (e.reason === sdk.CancellationReason.Error) {
            done(e.errorDetails);
        }
    };

    r.startContinuousRecognitionAsync((): void => {
        // Stop once we have results on BOTH sides of the forced reconnect.
        WaitForCondition((): boolean =>
            (resultsBeforeReconnect.length > 0 && disconnects > 0 && resultsAfterReconnect.length > 0),
        (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                try {
                    expect(audioStreamsMarkerSent).toEqual(true);
                    expect(streamIdHeaderOnAudio).toEqual(true);

                    // A reconnect must have happened.
                    expect(disconnects).toBeGreaterThanOrEqual(1);
                    expect(connections).toBeGreaterThanOrEqual(2);

                    // Recognition results - with the expected text - must exist both BEFORE the
                    // drop and AFTER the reconnect, proving recognition resumed seamlessly.
                    expect(resultsBeforeReconnect.length).toBeGreaterThan(0);
                    expect(resultsAfterReconnect.length).toBeGreaterThan(0);

                    // The actual recognized TEXT must be correct on both sides of the reconnect:
                    // channel 1's "What's the weather like?" is recognized early (before the drop),
                    // and channel 0's long Batman passage finalizes after the reconnect.
                    expect(resultsBeforeReconnect.some((t: string): boolean =>
                        t.includes("What's the weather like"))).toEqual(true);
                    expect(resultsAfterReconnect.some((t: string): boolean =>
                        t.includes("Batman"))).toEqual(true);

                    // All continuation info must have been received from the service: the
                    // X-Continuation-Token header, the per-stream
                    // X-Continuation-Audio-Streams-1-Offset header, and the serviceTag
                    // (turn.start body $.context.serviceTag).
                    expect(serviceReturnedContinuationToken).toEqual(true);
                    expect(serviceReturnedOffsetHeader).toEqual(true);
                    expect(serviceReturnedServiceTag).toEqual(true);
                    expect(lastServiceToken).not.toEqual("");
                    expect(lastServiceTag).not.toEqual("");

                    // Both channels of the multichannel audio must have produced results.
                    expect(channelsSeen.has(0)).toEqual(true);
                    expect(channelsSeen.has(1)).toEqual(true);

                    // Prove the SDK ingested the continuation info through its PRODUCTION
                    // path (ReconnectContinuationState.updateFromHeaders), not just the
                    // diagnostic Connection listener above. The recognizer's internal
                    // ServiceRecognizerBase is exposed via Recognizer.internalData.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const continuationState: any = (r.internalData as any).privContinuationState;
                    expect(continuationState).not.toBeUndefined();
                    // The last token captured by production code must match what the
                    // service emitted on the wire.
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    expect(continuationState.privToken).toEqual(lastServiceToken);
                    // The per-stream resume offset for stream "1" must also have been
                    // captured (the X-Continuation-Audio-Streams-1-Offset header).
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const streamOffset: number = continuationState.privStreamOffset as number;
                    expect(streamOffset).not.toBeUndefined();
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

// Verifies the two behaviors that align this SDK's audio plane on a reliable
// reconnect:
//   1. Offset rebasing - the per-stream offset header is turn-relative, so on the reconnected
//      turn (which begins at a non-zero session offset) the continuation offset the SDK echoes
//      back in speech.context must be the SESSION-ABSOLUTE value, not a small turn-relative
//      reset. We prove this on the wire by capturing every speech.context SENT and asserting the
//      continuation offset resent after the reconnect is strictly positive and never regresses
//      below what was already sent before the drop, and that it matches the value production code
//      (ReconnectContinuationState.streamOffset) resolved.
//   2. Replay-buffer trim - the buffer is shrunk forward to the service-acknowledged offset
//      (the replay buffer is trimmed to the acknowledged offset). After 15s+ of acknowledged audio the
//      replay node's buffer start offset must have advanced well past zero; if the trim were not
//      wired the buffer would still begin at offset 0.
test("Reliable reconnect - resends rebased absolute continuation offset and trims replay buffer", (done: jest.DoneCallback): void => {
    // eslint-disable-next-line no-console
    console.info("Name: Reliable reconnect - resends rebased absolute continuation offset and trims replay buffer");

    const s: sdk.SpeechConfig = BuildReliableReconnectConfig();
    objsToClose.push(s);
    // Force a mid-stream drop so the reconnect's speech.context resends the continuation block.
    s.setServiceProperty("maxConnectionDurationSecs", "15", sdk.ServicePropertyChannel.UriQueryParameter);

    // Looped 2-channel audio keeps the turn alive past the forced drop (same source as the test
    // above), guaranteeing recognition - and continuation resends - on both sides of the reconnect.
    const pcm: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(Settings.MultiChannelWaveFile);
    let readOffset: number = 0;
    const pullStream: sdk.PullAudioInputStream = sdk.AudioInputStream.createPullStream(
        {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            close: (): void => { },
            read: (buffer: ArrayBuffer): number => {
                const target: Uint8Array = new Uint8Array(buffer);
                const source: Uint8Array = new Uint8Array(pcm);
                let written: number = 0;
                while (written < target.length) {
                    if (readOffset >= source.length) {
                        readOffset = 0;
                    }
                    const chunk: number = Math.min(target.length - written, source.length - readOffset);
                    target.set(source.subarray(readOffset, readOffset + chunk), written);
                    written += chunk;
                    readOffset += chunk;
                }
                return target.length;
            },
        },
        sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 2));
    const config: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(pullStream);

    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, config);
    objsToClose.push(r);

    let disconnects: number = 0;
    let connections: number = 0;
    // Every continuation offset the SDK PUT ON THE WIRE in a speech.context, in send order,
    // tagged with whether the forced reconnect had already happened when it was sent.
    const continuationOffsetsSent: Array<{ afterReconnect: boolean; offset: number | undefined }> = [];
    const resultsBeforeReconnect: string[] = [];
    const resultsAfterReconnect: string[] = [];
    // Every recognized result's absolute span (offset + duration, in 100ns ticks), in arrival
    // order, tagged with its channel and whether the forced reconnect had already happened.
    // Used to prove the recognized timeline stays ordered and non-overlapping across the
    // reconnect - the recognition-level reflection of "no audio recognized twice or skipped".
    // NOTE: this is the multi-channel scenario, so EACH channel carries its own independent
    // offset timeline; contiguity is only meaningful per channel, not globally.
    const recognizedSpans: Array<{ afterReconnect: boolean; channel: number; offset: number; duration: number }> = [];

    const connection: sdk.Connection = sdk.Connection.fromRecognizer(r);

    connection.messageSent = (args: sdk.ConnectionMessageEventArgs): void => {
        const message: sdk.ConnectionMessage = args.message;
        if (message.path === "speech.context" && message.isTextMessage) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const context: any = JSON.parse(message.TextMessage);
            let offset: number | undefined;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const stream: any = context && context.continuation && context.continuation.audio
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                && context.continuation.audio.streams && context.continuation.audio.streams["1"];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (stream && typeof stream.offset === "number") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                offset = stream.offset as number;
            }
            continuationOffsetsSent.push({ afterReconnect: disconnects > 0, offset });
        }
    };

    connection.disconnected = (): void => {
        disconnects++;
    };

    connection.connected = (): void => {
        connections++;
    };

    r.recognized = (o: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        if (e.result.text) {
            (disconnects > 0 ? resultsAfterReconnect : resultsBeforeReconnect).push(e.result.text);
            // The channel lives only in the raw service JSON; default to 0 if absent.
            let channel: number = 0;
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resultJson: any = JSON.parse(
                    e.result.properties.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult, "{}"));
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (typeof resultJson.Channel === "number") {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    channel = resultJson.Channel as number;
                }
            } catch {
                // Leave channel at 0 if the JSON is missing or unparseable.
            }
            recognizedSpans.push({
                afterReconnect: disconnects > 0,
                channel,
                offset: e.result.offset,
                duration: e.result.duration,
            });
        }
    };

    r.canceled = (o: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => {
        if (e.reason === sdk.CancellationReason.Error) {
            done(e.errorDetails);
        }
    };

    r.startContinuousRecognitionAsync((): void => {
        // Stop once recognition has resumed after the forced reconnect.
        WaitForCondition((): boolean =>
            (resultsBeforeReconnect.length > 0 && disconnects > 0 && resultsAfterReconnect.length > 0),
        (): void => {
            r.stopContinuousRecognitionAsync((): void => {
                try {
                    // A reconnect must have happened.
                    expect(disconnects).toBeGreaterThanOrEqual(1);
                    expect(connections).toBeGreaterThanOrEqual(2);

                    // The speech.context resent AFTER the reconnect must carry the continuation
                    // block with a resume offset.
                    const afterOffsets: number[] = continuationOffsetsSent
                        .filter((c: { afterReconnect: boolean; offset: number | undefined }): boolean =>
                            c.afterReconnect && c.offset !== undefined)
                        .map((c: { afterReconnect: boolean; offset: number | undefined }): number => c.offset as number);
                    expect(afterOffsets.length).toBeGreaterThan(0);

                    // The resent offset is SESSION-ABSOLUTE (rebased), not a turn-relative reset:
                    // it is strictly positive and never regresses below what was sent before the
                    // drop. A turn-relative bug would reset it toward ~0 on the new turn.
                    const beforeOffsets: number[] = continuationOffsetsSent
                        .filter((c: { afterReconnect: boolean; offset: number | undefined }): boolean =>
                            !c.afterReconnect && c.offset !== undefined)
                        .map((c: { afterReconnect: boolean; offset: number | undefined }): number => c.offset as number);
                    const beforeMax: number = beforeOffsets.length > 0 ? Math.max(...beforeOffsets) : 0;
                    const afterMax: number = Math.max(...afterOffsets);
                    expect(afterMax).toBeGreaterThan(0);
                    expect(afterMax).toBeGreaterThanOrEqual(beforeMax);

                    // The offset the SDK put on the wire matches the absolute value production code
                    // resolved (turn-relative header + currentTurnAudioOffset). streamOffset only
                    // grows, so by stop-time it is >= the last value sent.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const continuationState2: any = (r.internalData as any).privContinuationState;
                    expect(continuationState2).not.toBeUndefined();
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    expect(continuationState2.streamOffset).toBeGreaterThanOrEqual(afterMax);

                    // Replay-buffer trim: after 15s+ of acknowledged audio the replay node's buffer
                    // start offset must have advanced past zero (the replay buffer is trimmed). If the
                    // trim were not wired the buffer would still begin at offset 0.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const requestSession: any = (r.internalData as any).privRequestSession;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const audioNode: any = requestSession.privAudioNode;
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const bufferStartOffset: number = audioNode.privBufferStartOffset as number;
                    expect(bufferStartOffset).toBeGreaterThan(0);

                    // End-to-end no-overlap / no-rewind signal, checked PER CHANNEL. This is the
                    // multi-channel scenario, so each channel has its own independent offset
                    // timeline and the channels interleave; a global ordering check would be wrong.
                    // Within a single channel, because every service offset is rebased onto the same
                    // session-absolute frame, each result must start at or after the previous
                    // result on that channel ended (offset + duration). A turn-relative or
                    // un-trimmed bug would make the post-reconnect results on a channel restart near
                    // zero (a backward jump) or overlap the audio already recognized before the drop.
                    type RecognizedSpan = { afterReconnect: boolean; channel: number; offset: number; duration: number };
                    expect(recognizedSpans.length).toBeGreaterThanOrEqual(2);
                    expect(recognizedSpans.some((sp: RecognizedSpan): boolean => sp.afterReconnect)).toEqual(true);

                    const channels: number[] = Array.from(
                        new Set(recognizedSpans.map((sp: RecognizedSpan): number => sp.channel)));
                    for (const channel of channels) {
                        const channelSpans: RecognizedSpan[] = recognizedSpans.filter(
                            (sp: RecognizedSpan): boolean => sp.channel === channel);
                        for (let i: number = 1; i < channelSpans.length; i++) {
                            const prev: RecognizedSpan = channelSpans[i - 1];
                            const curr: RecognizedSpan = channelSpans[i];
                            // Ordered: never recognize earlier audio again after a later result.
                            expect(curr.offset).toBeGreaterThanOrEqual(prev.offset);
                            // Non-overlapping: the next segment starts no earlier than the previous
                            // one ended. Gaps (silence) are allowed; overlap (duplicate) is not.
                            expect(curr.offset).toBeGreaterThanOrEqual(prev.offset + prev.duration);
                        }
                    }
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
});
