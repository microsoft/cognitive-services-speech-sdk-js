// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/* eslint-disable max-classes-per-file */

// Inline commit tests: PushAudioInputStream.commit() and RecognitionResult.commitToken.
//
// Inline commit is not yet enabled on the service by default. These tests enable it with the
// service flight flags setfeature=forcecommit and setfeature=multirecognizer, and use
// PostRefinement. The flags select the service recognition path, which affects segmentation
// and result timing. As JS service properties hold one value per name, multirecognizer is set
// in the endpoint URL.
//
// Wire-level assertions use the Connection messageSent / messageReceived events. SDK log
// assertions use the platform events the SDK emits (InlineCommit / PushAudioInputStream).

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConsoleLoggingListener } from "../src/common.browser/Exports";
import { Events, IDetachable, PlatformEvent } from "../src/common/Exports";
import { Settings } from "./Settings";
import { SpeechConfigConnectionFactory } from "./SpeechConfigConnectionFactories";
import { SpeechConnectionType } from "./SpeechConnectionTypes";
import { closeAsyncObjects, sleep } from "./Utilities";
import { WaveFileAudioInput } from "./WaveFileAudioInputStream";

let objsToClose: any[];

beforeAll((): void => {
    Settings.LoadSettings();
    // SDK logs at Warning and above by default: at Debug and Info every audio message sent is
    // logged. Set INLINE_COMMIT_TEST_LOG_LEVEL=Debug (or Info) for the full log.
    const level: string = process.env.INLINE_COMMIT_TEST_LOG_LEVEL;
    const logLevel: sdk.LogLevel = level !== undefined && level in sdk.LogLevel ? sdk.LogLevel[level as keyof typeof sdk.LogLevel] : sdk.LogLevel.Warning;
    Events.instance.attachListener(new ConsoleLoggingListener(logLevel));
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
    // eslint-disable-next-line no-console
    console.info("------------------Ending test case: " + expect.getState().currentTestName + "-------------------------");
});

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Endpoint with the multirecognizer flight flag.
const withMultirecognizer = (endpoint: string): URL => {
    const url: URL = new URL(endpoint);
    url.searchParams.append("setfeature", "multirecognizer");
    return url;
};

const kInlineCommitEndpoint = (): URL => withMultirecognizer(`wss://${Settings.SpeechRegion}.stt.speech.microsoft.com/stt/speech/universal/v2`);

const enableInlineCommit = (config: sdk.SpeechConfig, postRefinement: boolean = true): void => {
    config.setServiceProperty("setfeature", "forcecommit", sdk.ServicePropertyChannel.UriQueryParameter);
    if (postRefinement) {
        config.setProperty(sdk.PropertyId.SpeechServiceResponse_PostProcessingOption, "PostRefinement");
    }
};

// As BuildSpeechConfig in SpeechRecognizerTests.ts, with inline commit enabled unless
// inlineCommit is false.
const BuildSpeechConfig = async (inlineCommit: boolean = true): Promise<sdk.SpeechConfig> => {
    const s: sdk.SpeechConfig = inlineCommit ?
        sdk.SpeechConfig.fromEndpoint(kInlineCommitEndpoint(), Settings.SpeechSubscriptionKey) :
        await SpeechConfigConnectionFactory.getSpeechRecognitionConfig(SpeechConnectionType.Subscription);
    expect(s).not.toBeUndefined();
    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }
    if (s.speechRecognitionLanguage === undefined) {
        s.speechRecognitionLanguage = Settings.WaveFileLanguage;
    }
    if (inlineCommit) {
        enableInlineCommit(s);
    }
    objsToClose.push(s);
    return s;
};

// As BuildSpeechConfig and BuildRecognizerFromWaveFile in TranslationRecognizerTests.ts.
const kTargetLanguage: string = "de-DE";
const BuildTranslationConfig = (): sdk.SpeechTranslationConfig => {
    const s: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromEndpoint(kInlineCommitEndpoint(), Settings.SpeechSubscriptionKey);
    expect(s).not.toBeUndefined();
    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }
    s.speechRecognitionLanguage = Settings.WaveFileLanguage;
    s.addTargetLanguage(kTargetLanguage);
    enableInlineCommit(s);
    objsToClose.push(s);
    return s;
};

// As BuildReliableReconnectConfig in SpeechRecoReconnectTests.ts: multichannel processing.
// Without PostRefinement, which multichannel does not support.
const BuildMultichannelConfig = (): sdk.SpeechConfig => {
    const s: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(withMultirecognizer(Settings.SpeechEndpoint), Settings.SpeechSubscriptionKey);
    if (undefined !== Settings.proxyServer) {
        s.setProxy(Settings.proxyServer, Settings.proxyPort);
    }
    s.setProperty(sdk.PropertyId.Speech_EnableMultiChannelProcessing, "true");
    enableInlineCommit(s, false);
    objsToClose.push(s);
    return s;
};

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------

// 16 kHz 16-bit mono speech with a pause (about 9.7 seconds).
const kSpeechFile: string = Settings.InlineCommitWaveFile;
const kSpeechBytes: number = undefined; // the whole file
const kChunkSize: number = 3200; // 100 ms at 16 kHz 16-bit mono
const kDefaultCommitAtBytes: number[] = [51200, 102400, 204800];

const loadPcm = (file: string, maxBytes?: number): ArrayBuffer => {
    const pcm: ArrayBuffer = WaveFileAudioInput.LoadArrayFromFile(file);
    return maxBytes !== undefined && maxBytes < pcm.byteLength ? pcm.slice(0, maxBytes) : pcm;
};

const createPushStream = (samplesPerSec: number = 16000, channels: number = 1): sdk.PushAudioInputStream =>
    sdk.AudioInputStream.createPushStream(sdk.AudioStreamFormat.getWaveFormatPCM(samplesPerSec, 16, channels));

// ---------------------------------------------------------------------------
// Observations
// ---------------------------------------------------------------------------

interface IResultRecord {
    commitToken: number;
    reason: sdk.ResultReason;
    text: string;
    offset: number;
    duration: number;
    channel: number;
    translation?: string;
    session: number;
}

class CommitObservations {
    public session: number = 1;
    public issued: number[] = [];
    public rejectedCount: number = 0;
    public results: IResultRecord[] = [];
    public canceledErrors: string[] = [];

    public addIssued(token: number): void {
        if (token !== 0) {
            this.issued.push(token);
        } else {
            this.rejectedCount++;
        }
    }

    public get acknowledged(): { token: number; session: number }[] {
        return this.results.filter((r: IResultRecord): boolean => r.commitToken !== 0)
            .map((r: IResultRecord): { token: number; session: number } => ({ session: r.session, token: r.commitToken }));
    }

    public get recognizedText(): string[] {
        return this.results.map((r: IResultRecord): string => r.text);
    }

    public record(result: sdk.RecognitionResult, translation?: string): void {
        this.results.push({
            channel: result.channel,
            commitToken: result.commitToken,
            duration: result.duration,
            offset: result.offset,
            reason: result.reason,
            session: this.session,
            text: result.text === undefined ? "" : result.text,
            translation,
        });
        // eslint-disable-next-line no-console
        console.info(`Result: session=${this.session} commitToken=${result.commitToken} reason=${sdk.ResultReason[result.reason]} channel=${result.channel} offset=${result.offset} duration=${result.duration} text="${result.text}" json=${result.json}`);
    }

    public onCanceled(reason: sdk.CancellationReason, errorDetails: string): void {
        // eslint-disable-next-line no-console
        console.info(`Canceled: reason=${sdk.CancellationReason[reason]} details=${errorDetails}`);
        if (reason === sdk.CancellationReason.Error) {
            this.canceledErrors.push(errorDetails);
        }
    }
}

// Signals session stop; re-armed per session.
class SessionStopSignal {
    private privResolve: () => void;
    private privPromise: Promise<void>;

    public constructor() {
        this.arm();
    }

    public arm(): void {
        this.privPromise = new Promise<void>((resolve: () => void): void => {
            this.privResolve = resolve;
        });
    }

    public signal(): void {
        this.privResolve();
    }

    public wait(timeoutMs: number): Promise<void> {
        return withTimeout(this.privPromise, timeoutMs, "session stopped");
    }
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, what: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    const timeout: Promise<T> = new Promise<T>((_: (value: T) => void, reject: (reason: Error) => void): void => {
        timer = setTimeout((): void => reject(new Error(`Timeout waiting for ${what}`)), timeoutMs);
    });
    return Promise.race([promise, timeout]).finally((): void => clearTimeout(timer));
};

const connectSpeechObservers = (r: sdk.SpeechRecognizer, obs: CommitObservations, stop: SessionStopSignal): void => {
    r.recognized = (_: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => obs.record(e.result);
    r.canceled = (_: sdk.Recognizer, e: sdk.SpeechRecognitionCanceledEventArgs): void => obs.onCanceled(e.reason, e.errorDetails);
    r.sessionStopped = (): void => stop.signal();
};

const connectTranslationObservers = (r: sdk.TranslationRecognizer, obs: CommitObservations, stop: SessionStopSignal): void => {
    r.recognized = (_: sdk.Recognizer, e: sdk.TranslationRecognitionEventArgs): void =>
        obs.record(e.result, e.result.translations !== undefined ? e.result.translations.get(kTargetLanguage, "") : "");
    r.canceled = (_: sdk.Recognizer, e: sdk.TranslationRecognitionCanceledEventArgs): void => obs.onCanceled(e.reason, e.errorDetails);
    r.sessionStopped = (): void => stop.signal();
};

// ---------------------------------------------------------------------------
// Wire capture
// ---------------------------------------------------------------------------

interface IWireRecord {
    sent: boolean;
    path: string;
    size: number;
    isWaveHeader: boolean;
    commitToken?: number;
    channelIndex?: string;
}

class WireLog {
    public records: IWireRecord[] = [];
    public connectedCount: number = 0;
    public disconnectedCount: number = 0;

    public constructor(recognizer: sdk.Recognizer) {
        const connection: sdk.Connection = sdk.Connection.fromRecognizer(recognizer);
        objsToClose.push(connection);
        connection.messageSent = (args: sdk.ConnectionMessageEventArgs): void => this.add(true, args.message);
        connection.messageReceived = (args: sdk.ConnectionMessageEventArgs): void => this.add(false, args.message);
        connection.connected = (): void => {
            this.connectedCount++;
        };
        connection.disconnected = (): void => {
            this.disconnectedCount++;
        };
    }

    public indicesOfSend(path: string): number[] {
        const result: number[] = [];
        this.records.forEach((r: IWireRecord, i: number): void => {
            if (r.sent && r.path === path) {
                result.push(i);
            }
        });
        return result;
    }

    public countSends(path: string): number {
        return this.indicesOfSend(path).length;
    }

    // Outbound audio messages carrying audio data: not the wave header that opens a turn,
    // and not the empty end-of-audio message.
    public indicesOfAudioDataFrames(): number[] {
        const result: number[] = [];
        this.records.forEach((r: IWireRecord, i: number): void => {
            if (r.sent && r.path === "audio" && r.size > 0 && !r.isWaveHeader) {
                result.push(i);
            }
        });
        return result;
    }

    public countReceived(path: string): number {
        return this.records.filter((r: IWireRecord): boolean => !r.sent && r.path === path).length;
    }

    public sentCommitTokens(): number[] {
        return this.records.filter((r: IWireRecord): boolean => r.sent && r.path === "audio.commit")
            .map((r: IWireRecord): number => r.commitToken);
    }

    private add(sent: boolean, message: sdk.ConnectionMessage): void {
        const path: string = message.path === undefined ? "" : message.path.toLowerCase();
        let size: number = 0;
        let isWaveHeader: boolean = false;
        if (message.isBinaryMessage && !!message.binaryMessage) {
            size = message.binaryMessage.byteLength;
            if (size >= 4) {
                const magic: Uint8Array = new Uint8Array(message.binaryMessage, 0, 4);
                isWaveHeader = String.fromCharCode(magic[0], magic[1], magic[2], magic[3]) === "RIFF";
            }
        }
        const record: IWireRecord = { isWaveHeader, path, sent, size };
        if (path === "audio.commit") {
            record.commitToken = parseInt(message.properties.getProperty("X-Client-Commit-Token", "0"), 10);
            record.channelIndex = message.properties.getProperty("X-Client-Commit-Channel-Index", undefined);
        }
        this.records.push(record);
    }
}

// Captures SDK log events whose names contain any of the given substrings.
class SdkLog {
    public lines: string[] = [];
    private privDetachable: IDetachable;

    public constructor(filters: string[]) {
        this.privDetachable = Events.instance.attachListener({
            onEvent: (e: PlatformEvent): void => {
                if (filters.some((f: string): boolean => e.name.indexOf(f) >= 0)) {
                    this.lines.push(e.name);
                }
            },
        });
        objsToClose.push(this);
    }

    public count(filter: string): number {
        return this.lines.filter((l: string): boolean => l.indexOf(filter) >= 0).length;
    }

    public async close(): Promise<void> {
        if (this.privDetachable !== undefined) {
            await this.privDetachable.detach();
            this.privDetachable = undefined;
        }
    }
}

const kLogDroppedAtEndOfAudio: string = "end of audio was signalled before it was delivered";
const kLogDiscardedObsolete: string = "audio past it was already acknowledged";
const kLogDiscardedAtCap: string = "unacknowledged commits at cap";

// ---------------------------------------------------------------------------
// Recognizer control
// ---------------------------------------------------------------------------

interface IContinuousRecognizer {
    startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
    stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
}

const startContinuous = (r: IContinuousRecognizer): Promise<void> =>
    new Promise<void>((resolve: () => void, reject: (e: string) => void): void => r.startContinuousRecognitionAsync(resolve, reject));

const stopContinuous = (r: IContinuousRecognizer): Promise<void> =>
    new Promise<void>((resolve: () => void, reject: (e: string) => void): void => r.stopContinuousRecognitionAsync(resolve, reject));

// ---------------------------------------------------------------------------
// Audio writer
// ---------------------------------------------------------------------------

interface IWriterOptions {
    commitAtBytes?: number[];
    pacingMs?: number;
    chunkSize?: number;
    onFirstWrite?: () => void;
}

// Writes PCM into a push stream, committing at the requested cumulative byte offsets.
const writeWithCommits = async (stream: sdk.PushAudioInputStream, pcm: ArrayBuffer, options: IWriterOptions, obs: CommitObservations): Promise<number> => {
    const commitAtBytes: number[] = options.commitAtBytes === undefined ? [] : options.commitAtBytes;
    const chunkSize: number = options.chunkSize === undefined ? kChunkSize : options.chunkSize;
    let written: number = 0;
    let nextCommit: number = 0;

    while (written < pcm.byteLength) {
        const end: number = Math.min(written + chunkSize, pcm.byteLength);
        stream.write(pcm.slice(written, end));
        written = end;

        if (options.onFirstWrite !== undefined) {
            options.onFirstWrite();
            options.onFirstWrite = undefined;
        }

        while (nextCommit < commitAtBytes.length && written >= commitAtBytes[nextCommit]) {
            obs.addIssued(stream.commit());
            nextCommit++;
        }

        if (options.pacingMs !== undefined && options.pacingMs > 0) {
            await sleep(options.pacingMs);
        }
    }
    return written;
};

// Waits until a result acknowledging the token has been received. Use before stopping
// recognition when the acknowledgment is asserted: stopping discards unacknowledged commits,
// so a fixed delay would make the outcome depend on service latency.
const waitForAcknowledgment = async (obs: CommitObservations, token: number, timeoutMs: number = 20000): Promise<void> => {
    const deadline: number = Date.now() + timeoutMs;
    while (!obs.results.some((x: IResultRecord): boolean => x.commitToken === token)) {
        if (Date.now() > deadline) {
            throw new Error(`Timeout waiting for acknowledgment of commit token ${token}`);
        }
        await sleep(50);
    }
};

const countNonEmpty = (texts: string[]): number => texts.filter((t: string): boolean => !!t && t.length > 0).length;

const expectStrictlyIncreasing = (values: number[]): void => {
    for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
};

const framesBefore = (wire: WireLog, index: number): number =>
    wire.indicesOfAudioDataFrames().filter((i: number): boolean => i < index).length;

// Common setup for a SpeechRecognizer on a 16 kHz mono push stream.
const setupSpeechRecognizer = async (inlineCommit: boolean = true, config?: sdk.SpeechConfig):
    Promise<{ r: sdk.SpeechRecognizer; stream: sdk.PushAudioInputStream; obs: CommitObservations; stop: SessionStopSignal; wire: WireLog }> => {
    const s: sdk.SpeechConfig = config !== undefined ? config : await BuildSpeechConfig(inlineCommit);
    const stream: sdk.PushAudioInputStream = createPushStream();
    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, sdk.AudioConfig.fromStreamInput(stream));
    objsToClose.push(r);
    const obs: CommitObservations = new CommitObservations();
    const stop: SessionStopSignal = new SessionStopSignal();
    connectSpeechObservers(r, obs, stop);
    const wire: WireLog = new WireLog(r);
    return { obs, r, stop, stream, wire };
};

// ===========================================================================
// [SpeechRecognizer] A single commit is acknowledged, and follows its audio on the wire.
// ===========================================================================
test("InlineCommit: Single commit is acknowledged", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();

    await startContinuous(r);
    await writeWithCommits(stream, loadPcm(kSpeechFile, kSpeechBytes), { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(1);
    expect(obs.issued[0]).toBeGreaterThanOrEqual(1);

    // Exactly one audio.commit, preceded by exactly the audio it was anchored to.
    const commitSends: number[] = wire.indicesOfSend("audio.commit");
    expect(commitSends.length).toEqual(1);
    expect(framesBefore(wire, commitSends[0])).toEqual(kDefaultCommitAtBytes[0] / kChunkSize);

    const acknowledged = obs.acknowledged;
    expect(acknowledged.length).toEqual(1);
    expect(acknowledged[0].token).toEqual(obs.issued[0]);

    // The commit falls inside speech, so results carry content.
    expect(obs.recognizedText.filter((t: string): boolean => t.length === 0).length).toEqual(0);
    expect(obs.results.filter((x: IResultRecord): boolean => x.reason === sdk.ResultReason.NoMatch).length).toEqual(0);

    // A turn ending mid-stream would mean an early end-of-audio signal.
    expect(wire.countReceived("turn.end")).toEqual(1);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] Multiple commits are each acknowledged, in order.
// ===========================================================================
test("InlineCommit: Multiple commits are each acknowledged", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();

    await startContinuous(r);
    await writeWithCommits(stream, loadPcm(kSpeechFile, kSpeechBytes), { commitAtBytes: kDefaultCommitAtBytes, pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(kDefaultCommitAtBytes.length);
    expectStrictlyIncreasing(obs.issued);

    const commitSends: number[] = wire.indicesOfSend("audio.commit");
    expect(commitSends.length).toEqual(obs.issued.length);
    commitSends.forEach((index: number, i: number): void => {
        expect(framesBefore(wire, index)).toEqual(kDefaultCommitAtBytes[i] / kChunkSize);
    });

    const acknowledged = obs.acknowledged;
    expect(acknowledged.map((a: { token: number }): number => a.token)).toEqual(obs.issued);
    expect(wire.countReceived("turn.end")).toEqual(1);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] Commit before any audio is written: sent once the turn exists, and
// acknowledged with an empty result as the first result of the session.
// ===========================================================================
test("InlineCommit: Commit before any audio is written", async (): Promise<void> => {
    const { r, stream, obs, stop } = await setupSpeechRecognizer();

    await startContinuous(r);
    obs.addIssued(stream.commit());
    await writeWithCommits(stream, loadPcm(kSpeechFile, kSpeechBytes), { commitAtBytes: [102400], pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(2);
    expect(obs.issued[1]).toBeGreaterThan(obs.issued[0]);
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toEqual(obs.issued);

    const first: IResultRecord = obs.results[0];
    expect(first.commitToken).toEqual(obs.issued[0]);
    expect(first.reason).toEqual(sdk.ResultReason.NoMatch);
    expect(first.text).toEqual("");
    expect(first.offset).toEqual(0);
    expect(first.duration).toEqual(0);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] Commits made before recognition starts are delivered once it runs.
// ===========================================================================
test("InlineCommit: Commits before the first session", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    // Write audio and commit twice with nothing running, spaced past the rate limit.
    let written: number = 0;
    for (let nextCommit = 0; nextCommit < 2;) {
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        if (written >= kDefaultCommitAtBytes[nextCommit]) {
            obs.addIssued(stream.commit());
            nextCommit++;
            await sleep(150);
        }
    }
    expect(obs.issued.length).toEqual(2);
    expect(obs.issued[1]).toBeGreaterThan(obs.issued[0]);
    expect(wire.countSends("audio.commit")).toEqual(0);

    await startContinuous(r);
    await writeWithCommits(stream, pcm.slice(written), { pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(2);
    expect(wire.countSends("audio.commit")).toEqual(2);
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toEqual(obs.issued);
    expect(countNonEmpty(obs.recognizedText)).toBeGreaterThanOrEqual(2);
    expect(wire.countReceived("turn.end")).toEqual(1);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] A commit with no audio left in processing is acknowledged with NoMatch
// and zero duration.
// ===========================================================================
test("InlineCommit: Commit with no audio in processing", async (): Promise<void> => {
    const { r, stream, obs, stop } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    await startContinuous(r);


    // Write up to the first commit, wait until the service has acknowledged it, then commit
    // again with nothing written in between, so the second commit covers no audio.
    let written: number = 0;
    while (written < kDefaultCommitAtBytes[0]) {
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        await sleep(100);
    }
    obs.addIssued(stream.commit());
    await Promise.all([waitForAcknowledgment(obs, obs.issued[0]), sleep(150)]); // 150 ms: past the rate limit
    obs.addIssued(stream.commit());

    await writeWithCommits(stream, pcm.slice(written), { pacingMs: 100 }, obs);
    stream.close();

    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(2);

    const secondAck: IResultRecord = obs.results.find((x: IResultRecord): boolean => x.commitToken === obs.issued[1]);
    expect(secondAck).not.toBeUndefined();
    expect(secondAck.reason).toEqual(sdk.ResultReason.NoMatch);
    expect(secondAck.text).toEqual("");
    expect(secondAck.duration).toEqual(0);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] A commit made while recognition is stopped is sent once recognition
// restarts on the same recognizer and push stream, and acknowledged.
//
// Zero-length write is not an end-of-audio signal in the JS SDK, so the first session ends by
// stopping recognition, and the stream stays open.
// ===========================================================================
test("InlineCommit: Commit between active recognition sessions", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    // First session.
    await startContinuous(r);
    await writeWithCommits(stream, pcm, { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);
    await waitForAcknowledgment(obs, obs.issued[0]);
    await stopContinuous(r);
    const sendsAfterFirstSession: number = wire.countSends("audio.commit");

    // Commit while stopped: accepted, nothing sent yet.
    const stoppedToken: number = stream.commit();
    obs.addIssued(stoppedToken);
    expect(stoppedToken).toBeGreaterThanOrEqual(1);
    await sleep(500);
    expect(wire.countSends("audio.commit")).toEqual(sendsAfterFirstSession);

    // Second session.
    obs.session = 2;
    stop.arm();
    await startContinuous(r);
    await writeWithCommits(stream, pcm, { pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(wire.countSends("audio.commit")).toBeGreaterThan(sendsAfterFirstSession);
    expect(wire.sentCommitTokens()).toContain(stoppedToken);
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toContain(stoppedToken);
}, 120000);

// ===========================================================================
// [SpeechRecognizer] Audio and commits written while recognition is stopped are sent in the
// order written, without loss, when recognition restarts. Also with the restart before the
// writes, when the next recognition is already waiting for data.
//
// JS specific: covers the read that was waiting when recognition stopped, which used to take
// the first data written afterwards.
// ===========================================================================
test("InlineCommit: Audio and commits written while stopped keep their order", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);
    const kPartial: number = 1000;

    // Data frames sent since a position in the wire log, as sizes, with "C<token>" for commits.
    const sentSince = (from: number): string[] => wire.records.slice(from)
        .filter((x: IWireRecord): boolean => x.sent && ((x.path === "audio" && x.size > 0 && !x.isWaveHeader) || x.path === "audio.commit"))
        .map((x: IWireRecord): string => x.path === "audio.commit" ? `C${x.commitToken}` : `${x.size}`);

    const waitForSends = async (from: number, count: number): Promise<void> => {
        for (let i = 0; i < 400 && sentSince(from).length < count; i++) {
            await sleep(50);
        }
    };

    // Session 1, ending with the send loop waiting for data.
    await startContinuous(r);
    let written: number = await writeWithCommits(stream, pcm.slice(0, 64000), { pacingMs: 100 }, obs);
    await waitForSends(0, written / kChunkSize);
    expect(sentSince(0).length).toEqual(written / kChunkSize);
    await stopContinuous(r);

    // Case 1: written while stopped: two full chunks, a partial chunk, a commit, a chunk.
    stream.write(pcm.slice(written, written + 2 * kChunkSize));
    written += 2 * kChunkSize;
    stream.write(pcm.slice(written, written + kPartial));
    written += kPartial;
    const token1: number = stream.commit();
    obs.addIssued(token1);
    stream.write(pcm.slice(written, written + kChunkSize));
    written += kChunkSize;

    obs.session = 2;
    stop.arm();
    const session2From: number = wire.records.length;
    await startContinuous(r);
    await waitForSends(session2From, 5);
    expect(sentSince(session2From)).toEqual([`${kChunkSize}`, `${kChunkSize}`, `${kPartial}`, `C${token1}`, `${kChunkSize}`]);
    await waitForAcknowledgment(obs, token1);
    await stopContinuous(r);

    // Case 2: restart first, then write a partial chunk, a commit, a chunk.
    obs.session = 3;
    stop.arm();
    const session3From: number = wire.records.length;
    await startContinuous(r);
    await sleep(500);
    stream.write(pcm.slice(written, written + kPartial));
    written += kPartial;
    await sleep(150); // past the commit rate limit
    const token2: number = stream.commit();
    obs.addIssued(token2);
    stream.write(pcm.slice(written, written + kChunkSize));
    written += kChunkSize;
    await waitForSends(session3From, 3);
    expect(sentSince(session3From)).toEqual([`${kPartial}`, `C${token2}`, `${kChunkSize}`]);

    // The rest of the audio, then end of audio.
    const restFrom: number = wire.records.length;
    const rest: ArrayBuffer = pcm.slice(written);
    await writeWithCommits(stream, rest, { pacingMs: 50 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(token1).toBeGreaterThanOrEqual(1);
    expect(token2).toEqual(token1 + 1);

    // No audio lost: everything written after the restart was sent.
    const restBytes: number = sentSince(restFrom).filter((x: string): boolean => !x.startsWith("C"))
        .reduce((sum: number, x: string): number => sum + parseInt(x, 10), 0);
    expect(restBytes).toEqual(rest.byteLength);

    const acked: number[] = obs.acknowledged.map((a: { token: number }): number => a.token);
    expect(acked).toContain(token1);
    expect(acked).toContain(token2);
}, 150000);

// ===========================================================================
// [SpeechRecognizer] Commits do not leak across recognition sessions.
//
// The end-of-audio signal is close(), after which the stream cannot be reused, so an
// undelivered commit cannot reach a later session that way. The leak that remains possible
// is via the session state: a commit sent in one session but not yet acknowledged must not
// be re-sent, nor acknowledged, in the next session on the same recognizer and stream. A
// commit not yet read when recognition stopped is delivered in the next session (see the
// case above), which is not a leak.
// ===========================================================================
test("InlineCommit: Commits do not leak across recognition sessions", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    // First session: commit inside the audio, and again immediately before stopping.
    await startContinuous(r);
    await writeWithCommits(stream, pcm, { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);
    // The first session's speech is asserted below; its result is the acknowledgment.
    await waitForAcknowledgment(obs, obs.issued[0]);
    obs.addIssued(stream.commit());
    await stopContinuous(r);
    const tokensBeforeRestart: number[] = [...obs.issued];
    const sentInFirstSession: number[] = wire.sentCommitTokens();

    // Second session, same recognizer and stream.
    obs.session = 2;
    stop.arm();
    await startContinuous(r);
    await writeWithCommits(stream, pcm, { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toBeGreaterThanOrEqual(2);
    expectStrictlyIncreasing(obs.issued);
    expect(obs.issued.length).toBeGreaterThan(tokensBeforeRestart.length);

    // No token is sent twice: pending commits of the first session are not re-sent.
    const sent: number[] = wire.sentCommitTokens();
    expect(new Set(sent).size).toEqual(sent.length);

    // No commit sent in the first session is acknowledged in the second.
    for (const ack of obs.acknowledged) {
        if (ack.session === 2) {
            expect(sentInFirstSession).not.toContain(ack.token);
        }
        expect(obs.issued).toContain(ack.token);
    }

    // Both sessions produce speech, and a commit of the second session is acknowledged.
    expect(obs.results.filter((x: IResultRecord): boolean => x.session === 1 && x.text.length > 0).length).toBeGreaterThanOrEqual(1);
    expect(obs.results.filter((x: IResultRecord): boolean => x.session === 2 && x.text.length > 0).length).toBeGreaterThanOrEqual(1);
    const secondSessionToken: number = obs.issued[obs.issued.length - 1];
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toContain(secondSessionToken);
}, 120000);

// ===========================================================================
// [SpeechRecognizer] Commit, then wait for the acknowledgment before writing more.
// ===========================================================================
test("InlineCommit: Commit and wait for acknowledgment before further audio", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile);

    let awaitedToken: number = 0;
    let ackArrived: () => void;
    r.recognized = (_: sdk.Recognizer, e: sdk.SpeechRecognitionEventArgs): void => {
        obs.record(e.result);
        if (awaitedToken !== 0 && e.result.commitToken === awaitedToken && ackArrived !== undefined) {
            ackArrived();
        }
    };

    await startContinuous(r);

    let written: number = 0;
    for (let round = 0; round < 2; round++) {
        for (let i = 0; i < 12; i++) {
            stream.write(pcm.slice(written, written + kChunkSize));
            written += kChunkSize;
            await sleep(100);
        }

        const ack: Promise<void> = new Promise<void>((resolve: () => void): void => {
            ackArrived = resolve;
        });
        const token: number = stream.commit();
        expect(token).toBeGreaterThanOrEqual(1);
        obs.addIssued(token);
        awaitedToken = token;
        const framesAtCommit: number = wire.indicesOfAudioDataFrames().length;

        // Nothing is written while waiting; the commit must not wait for more audio.
        await withTimeout(ack, 30000, `acknowledgment of token ${token}`);

        // No audio was sent between the commit and the acknowledgment.
        expect(wire.indicesOfAudioDataFrames().length).toEqual(framesAtCommit);
        // All audio written so far, and no more, has been sent.
        expect(wire.indicesOfAudioDataFrames().length).toEqual(written / kChunkSize);
    }

    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(2);
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toEqual(obs.issued);
}, 120000);

// ===========================================================================
// [SpeechRecognizer] Commit on silence, followed by silence until the service times out.
// ===========================================================================
test("InlineCommit: Commit on silence", async (): Promise<void> => {
    const { r, stream, obs, stop } = await setupSpeechRecognizer();
    const silence: ArrayBuffer = new ArrayBuffer(kChunkSize);

    await startContinuous(r);

    // Five seconds of silence in real time, well inside the silence timeout.
    for (let i = 0; i < 50; i++) {
        stream.write(silence.slice(0));
        await sleep(100);
    }
    const commitToken: number = stream.commit();
    obs.addIssued(commitToken);

    // Keep writing until the service's own silence timeout produces a result.
    for (let i = 0; i < 160; i++) {
        stream.write(silence.slice(0));
        await sleep(100);
    }
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(commitToken).toEqual(1);
    expect(obs.results.length).toBeGreaterThanOrEqual(2);

    // The acknowledgment comes first and covers the silence written before the commit.
    expect(obs.results[0].commitToken).toEqual(commitToken);
    expect(obs.results[0].reason).toEqual(sdk.ResultReason.NoMatch);
    expect(obs.results[0].text).toEqual("");
    expect(obs.results[0].duration).toBeGreaterThan(0);

    // The silence timeout result follows without a token. Its reason depends on the
    // service endpoint version (NoMatch with v1, RecognizedSpeech with v2).
    expect(obs.results[1].commitToken).toEqual(0);
    expect([sdk.ResultReason.NoMatch, sdk.ResultReason.RecognizedSpeech]).toContain(obs.results[1].reason);
    expect(obs.results[1].text).toEqual("");
    expect(obs.results[1].duration).toBeGreaterThan(0);
}, 120000);

// ===========================================================================
// [SpeechRecognizer] A commit during single-shot recognition.
// ===========================================================================
test("InlineCommit: Commit during single-shot recognition", async (): Promise<void> => {
    const { r, stream, obs } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    // Prime the stream so recognition starts with audio available.
    stream.write(pcm.slice(0, kChunkSize));
    const writer: Promise<void> = (async (): Promise<void> => {
        await writeWithCommits(stream, pcm.slice(kChunkSize), { commitAtBytes: [kDefaultCommitAtBytes[0] - kChunkSize], pacingMs: 100 }, obs);
        stream.close();
    })();

    const result: sdk.SpeechRecognitionResult = await new Promise<sdk.SpeechRecognitionResult>(
        (resolve: (x: sdk.SpeechRecognitionResult) => void, reject: (e: string) => void): void => r.recognizeOnceAsync(resolve, reject));
    await writer;

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued).toEqual([1]);
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toEqual(obs.issued);
    expect(result.reason).toEqual(sdk.ResultReason.RecognizedSpeech);
    expect(result.text.length).toBeGreaterThan(0);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] A commit not yet delivered at end of audio is discarded.
// ===========================================================================
test("InlineCommit: Undelivered commit is discarded at end of audio", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const log: SdkLog = new SdkLog([kLogDroppedAtEndOfAudio]);

    await startContinuous(r);
    await writeWithCommits(stream, loadPcm(kSpeechFile, kSpeechBytes), { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);

    // Commit immediately before end of audio: either sent before the close, or discarded.
    obs.addIssued(stream.commit());
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(2);
    expect(obs.acknowledged.length).toBeGreaterThanOrEqual(1);
    expect(obs.acknowledged[0].token).toEqual(obs.issued[0]);

    const sends: number = wire.countSends("audio.commit");
    expect(sends).toBeGreaterThanOrEqual(1);
    expect(sends).toBeLessThanOrEqual(2);
    expect(log.count(kLogDroppedAtEndOfAudio)).toEqual(sends === 1 ? 1 : 0);
    expect(wire.countReceived("turn.end")).toEqual(1);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] Against a service without inline commit support, the commit is sent
// but not acknowledged, and recognition is unaffected.
// ===========================================================================
test("InlineCommit: Unsupported service degrades gracefully", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer(false);

    await startContinuous(r);
    await writeWithCommits(stream, loadPcm(kSpeechFile, kSpeechBytes), { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(1);
    expect(obs.issued[0]).toBeGreaterThanOrEqual(1);
    expect(wire.countSends("audio.commit")).toEqual(1);
    expect(obs.acknowledged).toEqual([]);
    expect(countNonEmpty(obs.recognizedText)).toBeGreaterThanOrEqual(1);
    expect(wire.countReceived("turn.end")).toEqual(1);
}, 90000);

// Writes the speech file in a loop, in real time.
class LoopingWriter {
    private privPcm: ArrayBuffer;
    private privPosition: number = 0;

    public constructor(private privStream: sdk.PushAudioInputStream) {
        this.privPcm = loadPcm(kSpeechFile);
    }

    public async writeChunk(): Promise<void> {
        if (this.privPosition + kChunkSize > this.privPcm.byteLength) {
            this.privPosition = 0;
        }
        this.privStream.write(this.privPcm.slice(this.privPosition, this.privPosition + kChunkSize));
        this.privPosition += kChunkSize;
        await sleep(100);
    }
}

// The service closes the connection after this many seconds of real time. Anything below
// 60 is ignored by the service.
const kMaxConnectionDurationSecs: number = 60;

// ===========================================================================
// [SpeechRecognizer] Commits are acknowledged across a reconnect.
//
// Re-emission of a commit outstanding at the drop is not asserted: with a service-initiated
// close the service has acknowledged audio past every pending commit, so they are discarded
// as obsolete. See the next case for disposal.
// ===========================================================================
test("InlineCommit: Commits are acknowledged across a reconnect", async (): Promise<void> => {
    const s: sdk.SpeechConfig = await BuildSpeechConfig();
    s.setServiceProperty("maxConnectionDurationSecs", kMaxConnectionDurationSecs.toString(), sdk.ServicePropertyChannel.UriQueryParameter);
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer(true, s);
    const writer: LoopingWriter = new LoopingWriter(stream);

    await startContinuous(r);

    const tokensBefore: number[] = [];
    const tokensAfter: number[] = [];
    const issue = (into: number[]): void => {
        const token: number = stream.commit();
        obs.addIssued(token);
        if (token !== 0) {
            into.push(token);
        }
    };

    // Phase 1: until the service closes the connection; commit about once a second.
    const deadline: number = Date.now() + (kMaxConnectionDurationSecs + 25) * 1000;
    let chunks: number = 0;
    while (wire.disconnectedCount === 0 && Date.now() < deadline) {
        await writer.writeChunk();
        if (++chunks % 10 === 0) {
            issue(tokensBefore);
        }
    }
    expect(wire.disconnectedCount).toBeGreaterThanOrEqual(1);
    const commitSendsBeforeReconnect: number = wire.countSends("audio.commit");

    // Phase 2: continue after the reconnect.
    for (let i = 1; i <= 40; i++) {
        await writer.writeChunk();
        if (i % 10 === 0) {
            issue(tokensAfter);
        }
    }
    stream.close();
    await stop.wait(120000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(wire.connectedCount).toBeGreaterThanOrEqual(2);
    expect(tokensBefore.length).toBeGreaterThan(0);
    expect(tokensAfter.length).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.info(`Reconnect coverage: ${tokensBefore.length} commits before, ${tokensAfter.length} after, ${wire.disconnectedCount} disconnects, ${wire.connectedCount} connects`);

    expect(wire.countSends("audio.commit") - commitSendsBeforeReconnect).toBeGreaterThan(0);
    expectStrictlyIncreasing([...tokensBefore, ...tokensAfter]);

    const acked: number[] = obs.acknowledged.map((a: { token: number }): number => a.token);
    expect(tokensAfter.some((t: number): boolean => acked.indexOf(t) >= 0)).toBe(true);
}, 240000);

// ===========================================================================
// [SpeechRecognizer] Pending commits are disposed of correctly across a reconnect, against
// a service that does not acknowledge them.
// ===========================================================================
test("InlineCommit: Pending commits are disposed of across a reconnect", async (): Promise<void> => {
    const s: sdk.SpeechConfig = await BuildSpeechConfig(false);
    s.setServiceProperty("maxConnectionDurationSecs", kMaxConnectionDurationSecs.toString(), sdk.ServicePropertyChannel.UriQueryParameter);
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer(false, s);
    const log: SdkLog = new SdkLog([kLogDiscardedObsolete]);
    const writer: LoopingWriter = new LoopingWriter(stream);

    await startContinuous(r);

    // Real time until the service closes the connection at its duration limit, then five
    // seconds more on the new connection. A commit every four seconds stays well inside the
    // pending cap.
    const deadline: number = Date.now() + (kMaxConnectionDurationSecs + 25) * 1000;
    let lastCommitAt: number = Date.now();
    let chunksAfterDisconnect: number = 0;
    while (chunksAfterDisconnect < 50 && Date.now() < deadline) {
        await writer.writeChunk();
        if (wire.disconnectedCount > 0) {
            chunksAfterDisconnect++;
        }
        if (Date.now() - lastCommitAt > 4000) {
            obs.addIssued(stream.commit());
            lastCommitAt = Date.now();
        }
    }
    stream.close();
    await stop.wait(120000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toBeGreaterThanOrEqual(3);
    expect(wire.disconnectedCount).toBeGreaterThanOrEqual(1);
    expect(wire.connectedCount).toBeGreaterThanOrEqual(2);
    expect(obs.acknowledged).toEqual([]);

    const sent: number[] = wire.sentCommitTokens();
    for (const token of sent) {
        expect(obs.issued).toContain(token);
    }
    const discarded: number = log.count(kLogDiscardedObsolete);
    expect(discarded).toBeLessThanOrEqual(obs.issued.length);

    // Each commit is sent at least once, and re-sent at most once per reconnect.
    const maxSendsPerToken: number = 1 + wire.disconnectedCount;
    let reEmitted: number = 0;
    for (const token of obs.issued) {
        const count: number = sent.filter((t: number): boolean => t === token).length;
        expect(count).toBeGreaterThanOrEqual(1);
        expect(count).toBeLessThanOrEqual(maxSendsPerToken);
        reEmitted += count - 1;
    }
    // eslint-disable-next-line no-console
    console.info(`Reconnect disposition: ${obs.issued.length} issued, ${reEmitted} re-emitted, ${discarded} discarded, ${wire.disconnectedCount} disconnects`);
}, 240000);

// ===========================================================================
// [SpeechRecognizer] A channel-scoped commit on multichannel input.
// ===========================================================================
test("InlineCommit: Channel-scoped commit on multichannel audio", async (): Promise<void> => {
    const s: sdk.SpeechConfig = BuildMultichannelConfig();
    // 16 kHz, 16-bit, 2 channels, matching the file.
    const stream: sdk.PushAudioInputStream = createPushStream(16000, 2);
    const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(s, sdk.AudioConfig.fromStreamInput(stream));
    objsToClose.push(r);
    const obs: CommitObservations = new CommitObservations();
    const stop: SessionStopSignal = new SessionStopSignal();
    connectSpeechObservers(r, obs, stop);
    const wire: WireLog = new WireLog(r);

    await startContinuous(r);

    // 100 ms chunks of stereo audio; commit on channel 1 after one second. Ten seconds of
    // the file are enough for results on both channels.
    const pcm: ArrayBuffer = loadPcm(Settings.MultiChannelWaveFile, 640000);
    const stereoChunk: number = 6400;
    const targetChannel: number = 1; // the other channel than default 0
    let channelToken: number = 0;
    let written: number = 0;
    while (written < pcm.byteLength) {
        stream.write(pcm.slice(written, written + stereoChunk));
        written += stereoChunk;
        if (channelToken === 0 && written >= 64000) {
            channelToken = stream.commit(targetChannel);
        }
        await sleep(100);
    }
    stream.close();
    await stop.wait(90000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(channelToken).toBeGreaterThanOrEqual(1);

    const commitSends: IWireRecord[] = wire.records.filter((x: IWireRecord): boolean => x.sent && x.path === "audio.commit");
    expect(commitSends.length).toEqual(1);
    expect(commitSends[0].commitToken).toEqual(channelToken);
    expect(commitSends[0].channelIndex).toEqual(targetChannel.toString());

    expect(obs.results.length).toBeGreaterThan(0);
    const ack: IResultRecord = obs.results.find((x: IResultRecord): boolean => x.commitToken === channelToken);
    expect(ack).not.toBeUndefined();
    expect(ack.channel).toEqual(targetChannel);
    expect(obs.results.filter((x: IResultRecord): boolean => x.commitToken === channelToken && x.channel !== targetChannel).length).toEqual(0);
}, 120000);

// ===========================================================================
// [SpeechRecognizer] The rate limit rejects commits within 100 ms, and recovers.
// ===========================================================================
test("InlineCommit: Commit rate limit rejects and recovers", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    await startContinuous(r);
    let written: number = 0;
    for (let i = 0; i < 16; i++) {
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        await sleep(100);
    }

    const accepted: number = stream.commit();
    const rejectedA: number = stream.commit();
    const rejectedB: number = stream.commit();
    await sleep(250);
    const acceptedAfterWait: number = stream.commit();

    for (let i = 0; i < 16 && written < pcm.byteLength; i++) {
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        await sleep(100);
    }
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(accepted).toBeGreaterThanOrEqual(1);
    expect(rejectedA).toEqual(0);
    expect(rejectedB).toEqual(0);
    expect(acceptedAfterWait).toEqual(accepted + 1);
    expect(wire.countSends("audio.commit")).toEqual(2);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] Unacknowledged commits are capped at 64; further ones are discarded.
// ===========================================================================
test("InlineCommit: Pending commit queue is capped", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer(false);
    const log: SdkLog = new SdkLog([kLogDiscardedAtCap]);
    const pcm: ArrayBuffer = loadPcm(kSpeechFile);

    await startContinuous(r);
    const targetCommits: number = 80;
    let written: number = 0;
    while (obs.issued.length < targetCommits) {
        if (written + kChunkSize > pcm.byteLength) {
            written = 0;
        }
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        obs.addIssued(stream.commit());
        await sleep(110);
    }
    stream.close();
    await stop.wait(90000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(targetCommits);
    expect(obs.rejectedCount).toEqual(0);
    expectStrictlyIncreasing(obs.issued);

    const kSdkMaxUnacknowledgedCommits: number = 64;
    expect(log.count(kLogDiscardedAtCap)).toEqual(targetCommits - kSdkMaxUnacknowledgedCommits);
    expect(wire.countSends("audio.commit")).toEqual(kSdkMaxUnacknowledgedCommits);
}, 120000);

// ===========================================================================
// [SpeechRecognizer] A commit is delivered while the audio written last is less than one
// chunk, with the reader waiting for more.
//
// The push stream collects writes into 100 ms chunks before the reader gets them. A commit
// must send the partially filled chunk and itself without waiting for more audio.
// ===========================================================================
test("InlineCommit: Commit during a partially satisfied read is delivered", async (): Promise<void> => {
    const { r, stream, obs, stop, wire } = await setupSpeechRecognizer();
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    await startContinuous(r);
    let written: number = 0;
    for (let i = 0; i < 6; i++) {
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        await sleep(100);
    }
    // All written audio has been sent, so the reader is waiting for more.
    for (let i = 0; i < 400 && wire.indicesOfAudioDataFrames().length < 6; i++) {
        await sleep(50);
    }
    expect(wire.indicesOfAudioDataFrames().length).toEqual(6);

    const kPartialChunkSize: number = 1000;
    stream.write(pcm.slice(written, written + kPartialChunkSize));
    written += kPartialChunkSize;
    await sleep(1000);

    const commitsBefore: number = wire.countSends("audio.commit");
    const token: number = stream.commit();
    expect(token).toBeGreaterThanOrEqual(1);
    obs.addIssued(token);

    let commitSent: boolean = false;
    for (let i = 0; i < 100 && !commitSent; i++) {
        commitSent = wire.countSends("audio.commit") > commitsBefore;
        if (!commitSent) {
            await sleep(100);
        }
    }
    expect(commitSent).toBe(true);

    // The partial chunk is sent before the commit.
    const commitIndex: number = wire.indicesOfSend("audio.commit")[0];
    const frames: number[] = wire.indicesOfAudioDataFrames().filter((i: number): boolean => i < commitIndex);
    expect(frames.length).toEqual(7);
    expect(wire.records[frames[frames.length - 1]].size).toEqual(kPartialChunkSize);

    await writeWithCommits(stream, pcm.slice(written), { pacingMs: 50 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
}, 90000);

// ===========================================================================
// [SpeechRecognizer] Commits work for a second recognizer on a reused push stream.
// ===========================================================================
test("InlineCommit: Commit anchors are re-based for a reused push stream", async (): Promise<void> => {
    const stream: sdk.PushAudioInputStream = createPushStream();
    const audioConfig: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(stream);
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);
    const obs: CommitObservations = new CommitObservations();

    const runSession = async (session: number, primeBeforeStart: boolean): Promise<void> => {
        const r: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(await BuildSpeechConfig(), audioConfig);
        objsToClose.push(r);
        obs.session = session;
        const stop: SessionStopSignal = new SessionStopSignal();
        connectSpeechObservers(r, obs, stop);

        if (primeBeforeStart) {
            stream.write(pcm.slice(0, kChunkSize));
        }
        await startContinuous(r);
        const issuedBefore: number = obs.issued.length;
        await writeWithCommits(stream, pcm, { commitAtBytes: [kDefaultCommitAtBytes[0]], pacingMs: 100 }, obs);
        expect(obs.issued.length).toEqual(issuedBefore + 1);
        // Stop once this session's commit is acknowledged. The stream stays open for reuse.
        await waitForAcknowledgment(obs, obs.issued[obs.issued.length - 1]);
        await stopContinuous(r);
    };

    await runSession(1, false);
    const tokensAfterFirst: number = obs.issued.length;
    const acknowledgedAfterFirst: number = obs.acknowledged.length;

    // The second recognizer's audio positions start from zero again, though the stream's
    // do not. A commit anchored in stream terms would wait for audio that never comes.
    await runSession(2, true);
    stream.close();

    expect(obs.canceledErrors).toEqual([]);
    expect(tokensAfterFirst).toBeGreaterThanOrEqual(1);
    expect(obs.issued.length).toBeGreaterThan(tokensAfterFirst);
    expectStrictlyIncreasing(obs.issued);

    const acknowledged = obs.acknowledged;
    expect(acknowledged.length).toBeGreaterThan(acknowledgedAfterFirst);
    expect(acknowledged.some((a: { session: number }): boolean => a.session === 2)).toBe(true);
    for (const ack of acknowledged) {
        expect(obs.issued).toContain(ack.token);
    }
}, 150000);

// ===========================================================================
// [ConversationTranscriber] Commit with diarization.
// ===========================================================================
test("InlineCommit: Commit with diarization", async (): Promise<void> => {
    const s: sdk.SpeechConfig = await BuildSpeechConfig();
    const stream: sdk.PushAudioInputStream = createPushStream();
    const t: sdk.ConversationTranscriber = new sdk.ConversationTranscriber(s, sdk.AudioConfig.fromStreamInput(stream));
    objsToClose.push(t);

    const obs: CommitObservations = new CommitObservations();
    const stop: SessionStopSignal = new SessionStopSignal();
    t.transcribed = (_: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionEventArgs): void => obs.record(e.result);
    t.canceled = (_: sdk.ConversationTranscriber, e: sdk.ConversationTranscriptionCanceledEventArgs): void => obs.onCanceled(e.reason, e.errorDetails);
    t.sessionStopped = (): void => stop.signal();

    await new Promise<void>((resolve: () => void, reject: (e: string) => void): void => t.startTranscribingAsync(resolve, reject));
    await writeWithCommits(stream, loadPcm(Settings.InputDir + "katiesteve_mono.wav"), { commitAtBytes: [480000], pacingMs: 100 }, obs); // 15 s
    stream.close();
    await stop.wait(60000);
    await new Promise<void>((resolve: () => void, reject: (e: string) => void): void => t.stopTranscribingAsync(resolve, reject));

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(1);

    const acked: number[] = obs.acknowledged.map((a: { token: number }): number => a.token);
    expect(acked.length).toBeGreaterThan(0);
    for (const token of obs.issued) {
        expect(acked).toContain(token);
    }
    for (const token of acked) {
        expect(obs.issued).toContain(token);
    }
    for (let i = 1; i < acked.length; i++) {
        expect(acked[i]).toBeGreaterThanOrEqual(acked[i - 1]);
    }
}, 90000);

// ===========================================================================
// [TranslationRecognizer] Commits on translation are each acknowledged once, with
// translations.
// ===========================================================================
test("InlineCommit: Commits on translation", async (): Promise<void> => {
    const stream: sdk.PushAudioInputStream = createPushStream();
    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(BuildTranslationConfig(), sdk.AudioConfig.fromStreamInput(stream));
    objsToClose.push(r);
    const obs: CommitObservations = new CommitObservations();
    const stop: SessionStopSignal = new SessionStopSignal();
    connectTranslationObservers(r, obs, stop);

    await startContinuous(r);
    await writeWithCommits(stream, loadPcm(kSpeechFile, kSpeechBytes), { commitAtBytes: kDefaultCommitAtBytes, pacingMs: 100 }, obs);
    stream.close();
    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    const acked: number[] = obs.acknowledged.map((a: { token: number }): number => a.token);
    expect(acked.length).toEqual(obs.issued.length);
    for (const token of obs.issued) {
        expect(acked.filter((a: number): boolean => a === token).length).toEqual(1);
    }

    const nonEmptyRecognized: number = countNonEmpty(obs.recognizedText);
    expect(nonEmptyRecognized).toBeGreaterThanOrEqual(kDefaultCommitAtBytes.length);
    expect(countNonEmpty(obs.results.map((x: IResultRecord): string => x.translation))).toEqual(nonEmptyRecognized);
    expectStrictlyIncreasing(acked);
}, 90000);

// ===========================================================================
// [TranslationRecognizer] A commit with no audio in processing is acknowledged with
// NoMatch and without a translation.
// ===========================================================================
test("InlineCommit: Commit on translation with no audio in processing", async (): Promise<void> => {
    const stream: sdk.PushAudioInputStream = createPushStream();
    const r: sdk.TranslationRecognizer = new sdk.TranslationRecognizer(BuildTranslationConfig(), sdk.AudioConfig.fromStreamInput(stream));
    objsToClose.push(r);
    const obs: CommitObservations = new CommitObservations();
    const stop: SessionStopSignal = new SessionStopSignal();
    connectTranslationObservers(r, obs, stop);
    const pcm: ArrayBuffer = loadPcm(kSpeechFile, kSpeechBytes);

    await startContinuous(r);

    // Write up to the first commit, wait until the service has acknowledged it, then commit
    // again with nothing written in between, so the second commit covers no audio.
    let written: number = 0;
    while (written < kDefaultCommitAtBytes[0]) {
        stream.write(pcm.slice(written, written + kChunkSize));
        written += kChunkSize;
        await sleep(100);
    }
    obs.addIssued(stream.commit());
    await Promise.all([waitForAcknowledgment(obs, obs.issued[0]), sleep(150)]); // 150 ms: past the rate limit
    obs.addIssued(stream.commit());

    await writeWithCommits(stream, pcm.slice(written), { pacingMs: 100 }, obs);
    stream.close();

    await stop.wait(60000);
    await stopContinuous(r);

    expect(obs.canceledErrors).toEqual([]);
    expect(obs.issued.length).toEqual(2);
    expect(obs.acknowledged.map((a: { token: number }): number => a.token)).toEqual(obs.issued);
    expect(obs.results.filter((x: IResultRecord): boolean => x.reason === sdk.ResultReason.NoMatch).length).toEqual(1);
    expect(obs.results.filter((x: IResultRecord): boolean => !x.translation).length).toEqual(1);
}, 90000);
