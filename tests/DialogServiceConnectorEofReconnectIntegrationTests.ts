// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { AudioTurn, EofTestService, pcmInput, PeerConnection, PeerMessage, simulatedText, testIfNode, wavInput } from "./EofReconnectTestUtils";

type Handler = "installed" | "absent" | "throwing";
type Boundary = "normal" | "before-turn-start" | "mid-audio" | "after-eof";

interface DialogScenario {
    boundary: Boundary;
    handler: Handler;
}

describe("DialogServiceConnector EOF interruption integration", (): void => {
    const cases: DialogScenario[] = [];
    for (const boundary of ["normal", "before-turn-start", "mid-audio", "after-eof"] as const) {
        for (const handler of ["installed", "absent", "throwing"] as const) {
            cases.push({ boundary, handler });
        }
    }
    testIfNode.each(cases)("$boundary with $handler canceled handler", async (scenario: DialogScenario): Promise<void> => {
        const service: EofTestService = new EofTestService(`dialog-${scenario.boundary}-${scenario.handler}`, pcmInput());
        let interrupted: boolean = false;
        let canceled: number = 0;
        const cancellationReasons: sdk.CancellationReason[] = [];
        let callbacks: number = 0;
        service.onMessage = (peer: PeerConnection, message: PeerMessage): void => {
            const turn: AudioTurn = message.turn;
            if (message.path === "speech.context" && scenario.boundary !== "before-turn-start") {
                peer.send("turn.start", {}, turn.requestId);
            }
            const trigger: boolean = scenario.boundary === "before-turn-start" && message.path === "speech.context" ||
                scenario.boundary === "mid-audio" && message.path === "audio" && turn.pcm.length > 0 ||
                scenario.boundary === "after-eof" && message.path === "audio" && message.body.length === 0;
            if (trigger && !interrupted) {
                interrupted = true;
                service.record("dialog-interrupted", { boundary: scenario.boundary, pcmBytes: Buffer.concat(turn.pcm).length });
                peer.socket.close(1012, "interrupted dialog turn");
            }
            if (scenario.boundary === "normal" && message.path === "audio" && message.body.length === 0) {
                expect(Buffer.concat(turn.pcm)).toEqual(service.input);
                peer.send("speech.phrase", {
                    RecognitionStatus: "Success", DisplayText: simulatedText, Offset: 0, Duration: 4000000,
                }, turn.requestId);
                peer.send("turn.end", {}, turn.requestId);
            }
        };
        await service.run(async (): Promise<void> => {
            const config: sdk.BotFrameworkConfig = sdk.BotFrameworkConfig.fromEndpoint(service.endpoint, "loopback-dummy-key-not-a-secret");
            const audio: sdk.AudioConfig = sdk.AudioConfig.fromWavFileInput(wavInput(service.input));
            service.resources.push(audio, config);
            const connector: sdk.DialogServiceConnector = new sdk.DialogServiceConnector(config, audio);
            service.clients.push(connector);
            if (scenario.handler !== "absent") {
                connector.canceled = (_sender: sdk.Recognizer, event: sdk.SpeechRecognitionCanceledEventArgs): void => {
                    canceled++;
                    cancellationReasons.push(event.reason);
                    service.record("canceled", { reason: event.reason, code: event.errorCode, details: event.errorDetails });
                    if (scenario.handler === "throwing") {
                        throw new Error("Deliberately throwing application canceled handler");
                    }
                };
            }
            const result: sdk.SpeechRecognitionResult = await new Promise<sdk.SpeechRecognitionResult>((resolve: (result: sdk.SpeechRecognitionResult) => void, reject: (error: Error) => void): void => {
                connector.listenOnceAsync((value: sdk.SpeechRecognitionResult): void => {
                    callbacks++;
                    service.record("result-callback", { reason: value.reason, text: value.text });
                    resolve(value);
                }, (error: string): void => reject(new Error(error)));
            });
            const first = service.connections[0];
            expect(first.paths.indexOf("agent.config")).toBeGreaterThanOrEqual(0);
            expect(first.paths.indexOf("agent.config")).toBeLessThan(first.paths.indexOf("speech.context"));
            expect(callbacks).toBe(1);
            if (scenario.boundary === "normal") {
                expect(interrupted).toBe(false);
                expect(result.reason).toBe(sdk.ResultReason.RecognizedSpeech);
                expect(result.text).toBe(simulatedText);
                expect(canceled).toBe(0);
                expect(service.connections).toHaveLength(1);
                expect(first.turns[0].headers).toBe(1);
                expect(first.turns[0].eofs).toBeGreaterThanOrEqual(1);
            } else {
                expect(interrupted).toBe(true);
                expect(result.reason).toBe(sdk.ResultReason.Canceled);
                expect(canceled).toBe(scenario.handler === "absent" ? 0 : 1);
                expect(cancellationReasons).toEqual(scenario.handler === "absent" ? [] : [sdk.CancellationReason.Error]);
                expect(service.connections.length).toBeLessThanOrEqual(2);
                for (const replacement of service.connections.slice(1)) {
                    expect(replacement.paths).toEqual([]);
                }
                if (scenario.boundary === "after-eof") {
                    expect(first.turns[0].eofs).toBe(1);
                    expect(Buffer.concat(first.turns[0].pcm)).toEqual(service.input);
                }
            }
        });
    });
});
