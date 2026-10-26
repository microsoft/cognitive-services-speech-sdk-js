// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import WebSocket from "ws";

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import {
    AudioTurn, callbackPromise, EofTestService, pcmInput, PeerConnection, PeerMessage,
    simulatedText, testIfNode, wavInput, within,
} from "./EofReconnectTestUtils";

interface ReplayScenario {
    name: string;
    source: "wav" | "pull" | "push";
    disconnects: number;
    acknowledgedBytes?: number;
    beforeEof?: boolean;
    empty?: boolean;
}

interface FaultScenario {
    name: string;
    code: number;
}

interface TerminalScenario {
    action: "close" | "stop";
    boundary: "eof" | "replacement-opening";
}

const configFor = (service: EofTestService): sdk.SpeechConfig => {
    const config: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(service.endpoint, "loopback-dummy-key-not-a-secret");
    config.speechRecognitionLanguage = "en-US";
    service.resources.push(config);
    return config;
};

const start = (recognizer: sdk.SpeechRecognizer): Promise<void> =>
    callbackPromise((resolve: () => void, reject: (error: string) => void): void => recognizer.startContinuousRecognitionAsync(resolve, reject));

const stop = (recognizer: sdk.SpeechRecognizer): Promise<void> =>
    callbackPromise((resolve: () => void, reject: (error: string) => void): void => recognizer.stopContinuousRecognitionAsync(resolve, reject));

const finishTurn = (peer: PeerConnection, turn: AudioTurn, bytes: number, empty: boolean = false): void => {
    peer.send("speech.phrase", {
        RecognitionStatus: empty ? "InitialSilenceTimeout" : "Success",
        DisplayText: empty ? "" : simulatedText, Offset: 0, Duration: bytes * 10000000 / 32000,
    }, turn.requestId);
    peer.send("turn.end", {}, turn.requestId);
};

// The real loopback peer compares each completed upload with the expected input or
// unacknowledged suffix before returning a simulated result. Each case also checks
// connection counts, one WAV header per connection, EOF delivery and public completion.
const replay = async (scenario: ReplayScenario): Promise<void> => {
    const input: Buffer = scenario.empty ? Buffer.alloc(0) : pcmInput();
    const service: EofTestService = new EofTestService(`speech-${scenario.name}`, input);
    const acknowledged: number = scenario.acknowledgedBytes || 0;
    let recognizer: sdk.SpeechRecognizer;
    let position: number = 0;
    let exhaustedReads: number = 0;
    let stopped: boolean = false;
    let interruptedBeforeEof: boolean = false;
    const results: sdk.SpeechRecognitionResult[] = [];
    const completed: Set<string> = new Set<string>();
    service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
        const turn: AudioTurn = message.turn;
        const connection: number = service.connections.indexOf(peer);
        if (message.path === "speech.context") {
            peer.send("turn.start", {}, turn.requestId);
        }
        if (message.path !== "audio") {
            return;
        }
        if (message.body.length > 0) {
            expect(turn.eofs).toBe(0);
        }
        if (scenario.beforeEof && connection === 0) {
            if (!interruptedBeforeEof && turn.pcm.length > 0) {
                expect(Buffer.concat(turn.pcm).length).toBeLessThan(input.length);
                interruptedBeforeEof = true;
                service.record("pre-eof-disconnect", { pcmBytes: Buffer.concat(turn.pcm).length });
                peer.socket.close(1012, "interrupted during PCM");
            }
            return;
        }
        if (message.body.length !== 0) {
            return;
        }
        expect(Buffer.concat(turn.pcm)).toEqual(connection === 0 ? input : input.subarray(acknowledged));
        if (completed.has(turn.requestId)) {
            if (peer.socket.readyState === WebSocket.OPEN) {
                peer.send("turn.end", {}, turn.requestId);
            }
            return;
        }
        completed.add(turn.requestId);
        if (connection < scenario.disconnects) {
            if (connection === 0 && acknowledged > 0) {
                peer.send("speech.phrase", {
                    RecognitionStatus: "Success", DisplayText: "ACKNOWLEDGED PREFIX.",
                    Offset: 0, Duration: acknowledged * 10000000 / 32000,
                }, turn.requestId);
            } else {
                service.record("eof-disconnect", { connection });
                peer.socket.close(1012, "finite EOF interrupted");
            }
        } else {
            finishTurn(peer, turn, input.length - acknowledged, scenario.empty);
        }
    };
    await service.run(async (): Promise<void> => {
        expect(input.length).toBe(scenario.empty ? 0 : 12800);
        let audio: sdk.AudioConfig;
        if (scenario.source === "wav") {
            audio = sdk.AudioConfig.fromWavFileInput(wavInput(input));
            service.resources.push(audio);
        } else if (scenario.source === "push") {
            const stream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
            stream.write(new Uint8Array(input).buffer);
            stream.close();
            audio = sdk.AudioConfig.fromStreamInput(stream);
        } else {
            const stream: sdk.PullAudioInputStream = sdk.AudioInputStream.createPullStream({
                read: (buffer: ArrayBuffer): number => {
                    const bytes: number = Math.min(buffer.byteLength, input.length - position);
                    new Uint8Array(buffer).set(input.subarray(position, position + bytes));
                    position += bytes;
                    if (bytes === 0) {
                        exhaustedReads++;
                        expect(exhaustedReads).toBe(1);
                    }
                    service.record("provider-read", { bytes, position, exhaustedReads });
                    return bytes;
                },
                close: (): void => service.record("provider-close"),
            });
            audio = sdk.AudioConfig.fromStreamInput(stream);
            service.resources.push(stream);
        }
        recognizer = new sdk.SpeechRecognizer(configFor(service), audio);
        service.clients.push(recognizer);
        recognizer.recognized = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs): void => {
            results.push(event.result);
            service.record("recognized", { text: event.result.text, reason: event.result.reason });
            if (event.result.text === "ACKNOWLEDGED PREFIX.") {
                // This public event follows acknowledgement processing. Close only now
                // so the next upload must omit the prefix confirmed by speech.phrase.
                service.record("acknowledgement-observed", { acknowledgedBytes: acknowledged });
                service.connections[0].socket.close(1012, "confirmed prefix before reconnect");
            }
        };
        recognizer.sessionStopped = (): void => {
            stopped = true;
            service.record("session-stopped");
        };
        recognizer.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs): void => {
            service.record("canceled", { reason: event.reason, code: event.errorCode, details: event.errorDetails });
            if (acknowledged === 0 || event.reason !== sdk.CancellationReason.EndOfStream ||
                event.errorCode !== sdk.CancellationErrorCode.NoError) {
                service.fail(new Error(`Unexpected cancellation: ${event.errorDetails}`));
            }
        };
        if (acknowledged > 0) {
            await start(recognizer);
            await service.until((): boolean => stopped && results.length === 2, "Acknowledged replay did not complete");
            expect(results.map((result: sdk.SpeechRecognitionResult): string => result.text))
                .toEqual(["ACKNOWLEDGED PREFIX.", simulatedText]);
            expect(results.every((result: sdk.SpeechRecognitionResult): boolean =>
                result.reason === sdk.ResultReason.RecognizedSpeech)).toBe(true);
        } else {
            const result: sdk.SpeechRecognitionResult = await new Promise<sdk.SpeechRecognitionResult>((resolve: (result: sdk.SpeechRecognitionResult) => void, reject: (error: Error) => void): void => {
                recognizer.recognizeOnceAsync(resolve, (error: string): void => reject(new Error(error)));
            });
            expect(result.reason).toBe(scenario.empty ? sdk.ResultReason.NoMatch : sdk.ResultReason.RecognizedSpeech);
            expect(result.text).toBe(scenario.empty ? "" : simulatedText);
        }
        expect(service.connections).toHaveLength(scenario.disconnects + 1);
        expect(interruptedBeforeEof).toBe(Boolean(scenario.beforeEof));
        for (const [index, peer] of service.connections.entries()) {
            expect(peer.turns).toHaveLength(1);
            const turn: AudioTurn = peer.turns[0];
            expect(turn.headers).toBe(1);
            if (!scenario.beforeEof || index > 0) {
                expect(turn.eofs).toBeGreaterThanOrEqual(1);
                expect(Buffer.concat(turn.pcm)).toEqual(index === 0 ? input : input.subarray(acknowledged));
            }
        }
        if (scenario.source === "pull") {
            expect(position).toBe(input.length);
            expect(exhaustedReads).toBe(1);
        }
    });
};

describe("SpeechRecognizer EOF reconnect integration", (): void => {
    testIfNode.each<ReplayScenario>([
        // Control: a normal finite WAV must complete on one connection. The peer
        // returns recognized text only after receiving the exact PCM bytes and EOF.
        { name: "wav-control", source: "wav", disconnects: 0 },
        // Reproduce the header-only reconnect regression by closing after the first
        // EOF. The replacement must replay all PCM plus EOF and return recognized text.
        { name: "wav-first-eof", source: "wav", disconnects: 1 },
        // Recovery must survive more than one EOF interruption. Close three times,
        // then require four connections with identical complete audio uploads.
        { name: "wav-three-eof-reconnects", source: "wav", disconnects: 3 },
        // An exhausted public pull provider must not be read again during replay.
        // Require exact PCM/EOF on both replacements and exactly one zero-byte read.
        { name: "pull-two-eof-reconnects-without-rereading", source: "pull", disconnects: 2 },
        // A push stream closed before recognition must still support recovery.
        // Compare the replacement PCM/EOF with the bytes written before stream.close().
        { name: "closed-push-eof", source: "push", disconnects: 1 },
        // Empty input is a valid boundary, not a missing-audio regression. Reconnect
        // after EOF, require header/EOF without PCM, and expect the simulated NoMatch.
        { name: "empty-wav-eof", source: "wav", disconnects: 1, empty: true },
        // Control for a peer-initiated mid-audio interruption: close on the first PCM
        // chunk, then require complete replay and recognition. In-flight original
        // frames may still arrive; this does not assert the SDK's internal EOF timing.
        { name: "pre-eof-control", source: "wav", disconnects: 1, beforeEof: true },
        // Confirm 3,200 bytes through a service phrase and its public recognized event.
        // Across two reconnects, require only the remaining 9,600 bytes plus EOF.
        { name: "partial-acknowledgement", source: "pull", disconnects: 2, acknowledgedBytes: 3200 },
        // Confirm all 12,800 bytes before disconnecting. Both replacements must send
        // header/EOF without resending confirmed PCM, then complete recognition.
        { name: "full-acknowledgement", source: "pull", disconnects: 2, acknowledgedBytes: 12800 },
    ])("$name", replay);

    testIfNode.each<FaultScenario>([
        // Repeated retryable closes must terminate rather than leave recognition
        // pending. Close every complete upload and require Error cancellation,
        // a Canceled result, multiple attempts and at most ten observed connections.
        { name: "persistent-eof-disconnects", code: 1012 },
        // A nonretryable close must cancel without a recognition retry. Close with
        // invalid-data code 1007 and require one connection before fixture cleanup,
        // one Error cancellation and a Canceled result.
        { name: "non-retryable-eof-disconnect", code: 1007 },
    ])("$name cancels instead of leaving recognition pending", async (scenario: FaultScenario): Promise<void> => {
        const service: EofTestService = new EofTestService(`speech-${scenario.name}`, pcmInput());
        const cancellations: sdk.CancellationReason[] = [];
        service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
            if (message.path === "speech.context") {
                peer.send("turn.start", {}, message.turn.requestId);
            } else if (message.path === "audio" && message.body.length === 0) {
                expect(Buffer.concat(message.turn.pcm)).toEqual(service.input);
                peer.socket.close(scenario.code, "planned terminal peer fault");
            }
        };
        await service.run(async (): Promise<void> => {
            const audio: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(wavInput(service.input));
            service.resources.push(audio);
            const recognizer: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(configFor(service), audio);
            service.clients.push(recognizer);
            recognizer.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs): void => {
                cancellations.push(event.reason);
                service.record("canceled", { reason: event.reason, code: event.errorCode });
            };
            const result: sdk.SpeechRecognitionResult = await new Promise<sdk.SpeechRecognitionResult>((resolve: (result: sdk.SpeechRecognitionResult) => void, reject: (error: Error) => void): void => {
                recognizer.recognizeOnceAsync(resolve, (error: string): void => reject(new Error(error)));
            });
            expect(result.reason).toBe(sdk.ResultReason.Canceled);
            expect(cancellations).toEqual([sdk.CancellationReason.Error]);
            expect(service.connections.length).toBeLessThanOrEqual(10);
            if (scenario.code === 1007) {
                expect(service.connections).toHaveLength(1);
            } else {
                expect(service.connections.length).toBeGreaterThan(1);
            }
        });
    });

    // Stop only after original EOF and the public speech-start event. Restart with
    // different application-owned pull input, then compare both uploads and request
    // IDs, require one exhausted read per input, and recognize only the second input.
    testIfNode("stops at EOF and restarts with fresh public pull input", async (): Promise<void> => {
        const inputs: Buffer[] = [pcmInput(), pcmInput(93)];
        const service: EofTestService = new EofTestService("speech-stop-restart", inputs[0]);
        let generation: number = 0;
        let position: number = 0;
        let stopping: boolean = false;
        let stopped: number = 0;
        let turnsStarted: number = 0;
        const cancellations: sdk.CancellationErrorCode[] = [];
        const exhaustedReads: number[] = [0, 0];
        const results: string[] = [];
        service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
            if (message.path === "speech.context") {
                peer.send("turn.start", {}, message.turn.requestId);
                peer.send("speech.startDetected", { Offset: 0 }, message.turn.requestId);
            } else if (message.path === "audio" && message.body.length === 0) {
                if (stopping) {
                    peer.send("turn.end", {}, message.turn.requestId);
                } else if (generation === 1) {
                    finishTurn(peer, message.turn, inputs[1].length);
                }
            }
        };
        await service.run(async (): Promise<void> => {
            expect(inputs[0]).not.toEqual(inputs[1]);
            const stream: sdk.PullAudioInputStream = sdk.AudioInputStream.createPullStream({
                read: (buffer: ArrayBuffer): number => {
                    const bytes: number = Math.min(buffer.byteLength, inputs[generation].length - position);
                    new Uint8Array(buffer).set(inputs[generation].subarray(position, position + bytes));
                    position += bytes;
                    if (bytes === 0) {
                        exhaustedReads[generation]++;
                    }
                    service.record("provider-read", { generation, bytes, position });
                    return bytes;
                },
                close: (): void => service.record("provider-close"),
            });
            const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(stream);
            service.resources.push(stream);
            const recognizer: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(configFor(service), audio);
            service.clients.push(recognizer);
            recognizer.speechStartDetected = (): void => {
                turnsStarted++;
                service.record("speech-start-detected", { generation });
            };
            recognizer.recognized = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs): void => {
                results.push(event.result.text);
                service.record("recognized", { generation, text: event.result.text });
            };
            recognizer.sessionStopped = (): void => {
                stopped++;
                service.record("session-stopped", { generation });
            };
            recognizer.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs): void => {
                cancellations.push(event.errorCode);
                service.record("canceled", { generation, code: event.errorCode });
            };
            await start(recognizer);
            await service.until((): boolean => service.connections[0]?.turns[0]?.eofs === 1 && turnsStarted === 1,
                "First generation did not reach EOF and process turn.start");
            stopping = true;
            await stop(recognizer);
            service.record("public-stop-completed");
            expect(results).toEqual([]);
            generation = 1;
            position = 0;
            stopping = false;
            service.record("public-restart", { inputBase64: inputs[1].toString("base64") });
            await start(recognizer);
            await service.until((): boolean => results.length === 1 && stopped === 2, "Restart did not complete");
            expect(results).toEqual([simulatedText]);
            const turns: AudioTurn[] = service.connections.flatMap((peer: PeerConnection): AudioTurn[] => peer.turns);
            expect(turns).toHaveLength(2);
            expect(turns[0].requestId).not.toBe(turns[1].requestId);
            turns.forEach((turn: AudioTurn, index: number): void => {
                expect(turn.headers).toBe(1);
                expect(turn.eofs).toBeGreaterThanOrEqual(1);
                expect(Buffer.concat(turn.pcm)).toEqual(inputs[index]);
            });
            expect(exhaustedReads).toEqual([1, 1]);
            expect(cancellations.every((code: sdk.CancellationErrorCode): boolean => code === sdk.CancellationErrorCode.NoError)).toBe(true);
        });
    });

    // Restart the same open push stream from either public stop notification. The
    // sessionStopped event can precede the stop callback; old cleanup must not stop
    // the new recognition or consume its input.
    testIfNode.each(["sessionStopped", "stop-callback"])("restarts push recognition from %s", async (restartFrom: string): Promise<void> => {
        const inputs: Buffer[] = [pcmInput(), pcmInput(93)];
        const service: EofTestService = new EofTestService(`speech-push-restart-${restartFrom}`, inputs[0]);
        const operations: Promise<void>[] = [];
        let hypotheses: number = 0;
        let stopped: number = 0;
        let restarted: boolean = false;
        service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
            const turn: AudioTurn = message.turn;
            if (message.path === "speech.context") {
                peer.send("turn.start", {}, turn.requestId);
            } else if (message.path === "audio" && message.body.length === 0) {
                peer.send("turn.end", {}, turn.requestId);
            } else if (message.path === "audio" && turn.pcm.length > 0) {
                const index: number = peer.turns.indexOf(turn);
                const received: Buffer = Buffer.concat(turn.pcm);
                expect(received).toEqual(inputs[index].subarray(0, received.length));
                if (received.length === inputs[index].length) {
                    peer.send("speech.hypothesis", { Text: simulatedText, Offset: 0, Duration: 4000000 }, turn.requestId);
                }
            }
        };
        await service.run(async (): Promise<void> => {
            const stream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
            service.resources.push(stream);
            const audio: sdk.AudioConfig = sdk.AudioConfig.fromStreamInput(stream);
            const recognizer: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(configFor(service), audio);
            service.clients.push(recognizer);
            const restart = (): void => {
                expect(restarted).toBe(false);
                restarted = true;
                const operation: Promise<void> = start(recognizer).then((): void => {
                    service.record("public-restart-completed");
                    stream.write(new Uint8Array(inputs[1]).buffer);
                });
                operations.push(operation);
                void operation.catch((error: unknown): void => service.fail(error));
            };
            recognizer.sessionStopped = (): void => {
                stopped++;
                service.record("session-stopped", { stopped });
                if (stopped === 1 && restartFrom === "sessionStopped") {
                    restart();
                }
            };
            recognizer.recognizing = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionEventArgs): void => {
                hypotheses++;
                service.record("recognizing", { hypotheses, text: event.result.text });
                expect(event.result.reason).toBe(sdk.ResultReason.RecognizingSpeech);
                const operation: Promise<void> = stop(recognizer).then((): void => {
                    service.record("public-stop-completed", { hypotheses });
                    if (!restarted && restartFrom === "stop-callback") {
                        restart();
                    }
                });
                operations.push(operation);
                void operation.catch((error: unknown): void => service.fail(error));
            };
            recognizer.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs): void =>
                service.fail(new Error(`Unexpected cancellation: ${event.errorDetails}`));
            stream.write(new Uint8Array(inputs[0]).buffer);
            await start(recognizer);
            await service.until((): boolean => hypotheses === 2 && stopped === 2, "Restarted push recognition did not complete");
            await Promise.all(operations);
            expect(service.connections).toHaveLength(1);
            const turns: AudioTurn[] = service.connections[0].turns;
            expect(turns).toHaveLength(2);
            turns.forEach((turn: AudioTurn, index: number): void => {
                expect(turn.headers).toBe(1);
                expect(turn.eofs).toBeGreaterThanOrEqual(1);
                expect(Buffer.concat(turn.pcm)).toEqual(inputs[index]);
            });
        });
    });

    testIfNode("closes after stop times out without turn.end", async (): Promise<void> => {
        const input: Buffer = pcmInput();
        const service: EofTestService = new EofTestService("speech-close-after-stop-timeout", input);
        service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
            if (message.path === "speech.context" && service.connections.indexOf(peer) === 0) {
                peer.send("turn.start", {}, message.turn.requestId);
            } else if (message.path === "audio" && message.body.length > 0 &&
                Buffer.concat(message.turn.pcm).length === input.length) {
                peer.send("speech.hypothesis", { Text: simulatedText, Offset: 0, Duration: 4000000 }, message.turn.requestId);
            }
            // Deliberately withhold turn.end so stop must time out and disconnect.
        };
        await service.run(async (): Promise<void> => {
            const config: sdk.SpeechConfig = configFor(service);
            config.setProperty(sdk.PropertyId.Recognizer_StopTimeoutMs, "100");
            const stream: sdk.PushAudioInputStream = sdk.AudioInputStream.createPushStream();
            service.resources.push(stream);
            const recognizer: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(config, sdk.AudioConfig.fromStreamInput(stream));
            service.clients.push(recognizer);
            let hypothesisReceived: boolean = false;
            recognizer.recognizing = (): void => {
                hypothesisReceived = true;
                service.record("recognizing");
            };
            stream.write(new Uint8Array(input).buffer);
            await start(recognizer);
            await service.until((): boolean => hypothesisReceived, "Service turn was not processed before stop");
            await expect(stop(recognizer)).rejects.toThrow("Stop operation timed out after 100ms");
            service.record("public-stop-timed-out");
            expect(service.connections).toHaveLength(1);
            expect(service.connections[0].turns[0].eofs).toBeGreaterThanOrEqual(1);
            expect(Buffer.concat(service.connections[0].turns[0].pcm)).toEqual(input);
            await service.closeClient(recognizer);
            await service.until((): boolean => service.connections[0].socket.readyState === WebSocket.CLOSED,
                "Timed-out recognition transport did not close");
        });
    });

    testIfNode.each<TerminalScenario>([
        // Closing at EOF must finish without a recognition result. Wait for exact
        // original audio/EOF, close publicly, and require the sole peer socket to close.
        { action: "close", boundary: "eof" },
        // Closing while a replacement handshake is held must settle after release.
        // Observe the held upgrade, request close, release it, and require completion
        // within two seconds, two closed peer sockets and no recognition result.
        { action: "close", boundary: "replacement-opening" },
        // Stopping at the same held-handshake boundary must also settle within two
        // seconds without a result. Release the upgrade after requesting stop, then
        // close publicly and require both peer sockets to close.
        { action: "stop", boundary: "replacement-opening" },
    ])("public $action completes while waiting at $boundary", async ({ action, boundary }: TerminalScenario): Promise<void> => {
            const service: EofTestService = new EofTestService(`speech-${action}-${boundary}`, pcmInput());
            let closing: boolean = false;
            let results: number = 0;
            service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
                // During shutdown, finish the pending turn instead of starting a new
                // one. These cases allow already-started replay frames to arrive.
                if (message.path === "speech.context" && !closing) {
                    peer.send("turn.start", {}, message.turn.requestId);
                } else if (message.path === "audio" && message.body.length === 0) {
                    if (closing) {
                        peer.send("turn.end", {}, message.turn.requestId);
                    } else if (boundary === "replacement-opening") {
                        service.holdUpgrades = true;
                        peer.socket.close(1012, "hold the replacement handshake");
                    }
                }
            };
            await service.run(async (): Promise<void> => {
                const audio: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(wavInput(service.input));
                service.resources.push(audio);
                const recognizer: sdk.SpeechRecognizer = new sdk.SpeechRecognizer(configFor(service), audio);
                service.clients.push(recognizer);
                recognizer.recognized = (): void => {
                    results++;
                };
                await start(recognizer);
                await service.until((): boolean => service.connections[0]?.turns[0]?.eofs === 1, "Input did not reach EOF");
                expect(Buffer.concat(service.connections[0].turns[0].pcm)).toEqual(service.input);
                if (boundary === "replacement-opening") {
                    await service.until((): boolean => service.heldUpgrades.length === 1, "No replacement handshake observed");
                }
                closing = true;
                service.record(`public-${action}-requested`, { boundary });
                const closed: Promise<void> = action === "close" ? service.closeClient(recognizer) : stop(recognizer);
                service.releaseUpgrades();
                await within(closed, `${action} did not settle after releasing the handshake`, 2000);
                if (action === "stop") {
                    service.record("public-stop-completed");
                    await service.closeClient(recognizer);
                }
                await service.until((): boolean => service.connections.every((peer: PeerConnection): boolean =>
                    peer.socket.readyState === WebSocket.CLOSED), "Close left a peer socket open");
                expect(results).toBe(0);
                expect(service.connections).toHaveLength(boundary === "eof" ? 1 : 2);
            });
        });
});
