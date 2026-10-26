// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { once } from "events";
import { mkdirSync, writeFileSync } from "fs";
import { createServer, IncomingMessage, Server } from "http";
import { join } from "path";
import { Duplex } from "stream";
import WebSocket, { RawData, WebSocketServer } from "ws";

export const testIfNode: jest.It = typeof window === "undefined" ? test : test.skip;
export const simulatedText: string = "SIMULATED MOCK RESULT.";

export interface AudioTurn {
    requestId: string;
    pcm: Buffer[];
    headers: number;
    eofs: number;
}

export interface PeerConnection {
    socket: WebSocket;
    paths: string[];
    turns: AudioTurn[];
    send: (path: string, body: object, requestId: string) => void;
}

export interface PeerMessage {
    path: string;
    body: Buffer;
    turn?: AudioTurn;
}

interface PublicClient {
    close: (success?: () => void, failure?: (error: string) => void) => void;
}

export const within = async <T>(operation: Promise<T>, description: string, milliseconds: number = 10000): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;
    try {
        return await Promise.race([
            operation,
            new Promise<never>((_resolve: (value: PromiseLike<never>) => void, reject: (error: Error) => void): void => {
                timer = setTimeout((): void => reject(new Error(description)), milliseconds);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
};

export const callbackPromise = (operation: (success: () => void, failure: (error: string) => void) => void): Promise<void> =>
    new Promise<void>((resolve: () => void, reject: (error: Error) => void): void =>
        operation(resolve, (error: string): void => reject(new Error(error))));

export const pcmInput = (seed: number = 17): Buffer => Buffer.from(
    Uint8Array.from({ length: 12800 }, (_value: unknown, index: number): number => (index * 29 + seed) % 251 + 1));

export const wavInput = (pcm: Buffer): Buffer => {
    const header: Buffer = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(pcm.length + 36, 4);
    header.write("WAVEfmt ", 8);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(16000, 24);
    header.writeUInt32LE(32000, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
};

export class EofTestService {
    public readonly connections: PeerConnection[] = [];
    public readonly clients: PublicClient[] = [];
    public readonly resources: { close: () => void }[] = [];
    public readonly events: object[] = [];
    public readonly errors: Error[] = [];
    public holdUpgrades: boolean = false;
    public readonly heldUpgrades: (() => void)[] = [];
    public onMessage: (connection: PeerConnection, message: PeerMessage) => void;
    public endpoint: URL;
    private readonly server: Server = createServer();
    private readonly websockets: WebSocketServer = new WebSocketServer({ noServer: true });
    private readonly upgradeSockets: Set<Duplex> = new Set<Duplex>();
    private cleaningUp: boolean = false;
    private rejectFailure: (error: Error) => void;
    private readonly failure: Promise<never> = new Promise<never>((_resolve: (value: PromiseLike<never>) => void, reject: (error: Error) => void): void => {
        this.rejectFailure = reject;
    });

    public constructor(public readonly name: string, public readonly input: Buffer) {
        void this.failure.catch((error: Error): void => this.record("asynchronous-failure", { error: error.message }));
        this.server.on("error", (error: Error): void => this.fail(error));
        this.websockets.on("error", (error: Error): void => this.fail(error));
        this.server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer): void => {
            this.upgradeSockets.add(socket);
            socket.on("close", (): void => {
                this.upgradeSockets.delete(socket);
            });
            socket.on("error", (error: Error): void => this.fail(error));
            const accept = (): void => {
                this.websockets.handleUpgrade(request, socket, head, (connection: WebSocket): void => {
                    this.websockets.emit("connection", connection);
                });
            };
            this.record("upgrade", { held: this.holdUpgrades });
            if (this.holdUpgrades) {
                this.heldUpgrades.push(accept);
            } else {
                accept();
            }
        });
        this.websockets.on("connection", (socket: WebSocket): void => {
            const peer: PeerConnection = {
                socket, paths: [], turns: [],
                send: (path: string, body: object, requestId: string): void => {
                    this.record("service-message", { path, requestId });
                    socket.send(`Path: ${path}\r\nX-RequestId: ${requestId}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(body)}`,
                        (error?: Error): void => {
                            if (error) {
                                this.fail(error);
                            }
                        });
                },
            };
            this.connections.push(peer);
            this.record("connected", { connection: this.connections.length });
            socket.on("error", (error: Error): void => this.fail(error));
            socket.on("close", (code: number): void => this.record("closed", { connection: this.connections.indexOf(peer), code }));
            socket.on("message", (data: RawData, binary: boolean): void => {
                try {
                    const packet: Buffer = Array.isArray(data) ? Buffer.concat(data) :
                        Buffer.isBuffer(data) ? data : Buffer.from(data);
                    const start: number = binary ? 2 : 0;
                    expect(packet.length).toBeGreaterThanOrEqual(start);
                    const end: number = binary ? 2 + packet.readUInt16BE(0) : packet.indexOf("\r\n\r\n");
                    expect(end).toBeGreaterThanOrEqual(start);
                    expect(end).toBeLessThanOrEqual(packet.length);
                    const headers: Record<string, string> = Object.fromEntries<string>(
                        packet.subarray(start, end).toString("utf8").split("\r\n").filter(Boolean)
                            .map((line: string): [string, string] => {
                                const colon: number = line.indexOf(":");
                                expect(colon).toBeGreaterThan(0);
                                return [line.slice(0, colon).toLowerCase(), line.slice(colon + 1).trim()];
                            }));
                    const path: string = headers.path;
                    const requestId: string = headers["x-requestid"];
                    const body: Buffer = packet.subarray(end + (binary ? 0 : 4));
                    this.record("client-message", { connection: this.connections.indexOf(peer), path, requestId, bytes: body.length });
                    peer.paths.push(path);
                    let turn: AudioTurn = peer.turns.find((candidate: AudioTurn): boolean => candidate.requestId === requestId);
                    if (path === "speech.context") {
                        expect(turn).toBeUndefined();
                        turn = { requestId, pcm: [], headers: 0, eofs: 0 };
                        peer.turns.push(turn);
                    }
                    if (path === "audio") {
                        expect(binary).toBe(true);
                        expect(turn).toBeDefined();
                        if (body.subarray(0, 4).toString("ascii") === "RIFF") {
                            expect(turn.headers).toBe(0);
                            expect(turn.pcm).toHaveLength(0);
                            expect(body.length).toBe(44);
                            expect(body.readUInt32LE(24)).toBe(16000);
                            turn.headers++;
                        } else if (body.length > 0) {
                            expect(turn.headers).toBe(1);
                            turn.pcm.push(Buffer.from(body));
                        } else {
                            expect(turn.headers).toBe(1);
                            turn.eofs++;
                        }
                    }
                    if (this.cleaningUp && path === "audio" && body.length === 0 && socket.readyState === WebSocket.OPEN) {
                        peer.send("turn.end", {}, requestId);
                    } else if (!this.cleaningUp) {
                        this.onMessage(peer, { path, body, turn });
                    }
                } catch (error) {
                    this.fail(error);
                }
            });
        });
    }

    public record(event: string, details: object = {}): void {
        this.events.push({ timestamp: new Date().toISOString(), event, ...details });
    }

    public fail(error: unknown): void {
        const cause: Error = error instanceof Error ? error : new Error(
            typeof error === "string" ? error : `Unexpected non-Error failure (${typeof error})`);
        this.errors.push(cause);
        this.rejectFailure(cause);
    }

    public async until(predicate: () => boolean, description: string): Promise<void> {
        const deadline: number = Date.now() + 10000;
        while (!predicate()) {
            if (this.errors.length > 0) {
                throw this.errors[0];
            }
            if (Date.now() >= deadline) {
                throw new Error(description);
            }
            await new Promise<void>((resolve: () => void): ReturnType<typeof setTimeout> => setTimeout(resolve, 2));
        }
    }

    public releaseUpgrades(): void {
        this.holdUpgrades = false;
        for (const accept of this.heldUpgrades.splice(0)) {
            accept();
        }
    }

    public async closeClient(client: PublicClient): Promise<void> {
        this.clients.splice(this.clients.indexOf(client), 1);
        await within(callbackPromise((resolve: () => void, reject: (error: string) => void): void =>
            client.close(resolve, reject)), "Public close deadline", 2000);
        this.record("public-close-completed");
    }

    public async run(operation: () => Promise<void>): Promise<void> {
        this.record("test-start", { name: this.name, inputBytes: this.input.length });
        try {
            this.server.listen(0, "127.0.0.1");
            await once(this.server, "listening");
            const address = this.server.address();
            if (!address || typeof address === "string") {
                throw new Error("The test service must listen on a TCP port");
            }
            this.endpoint = new URL(`ws://127.0.0.1:${address.port}/speech/recognition/interactive/cognitiveservices/v1`);
            await within(Promise.race([operation(), this.failure]), `Scenario deadline: ${this.name}`);
        } catch (error) {
            this.fail(error);
        } finally {
            this.cleaningUp = true;
            this.releaseUpgrades();
            for (const client of [...this.clients]) {
                try {
                    await this.closeClient(client);
                } catch (error) {
                    this.fail(error);
                }
            }
            for (const resource of this.resources) {
                try {
                    resource.close();
                } catch (error) {
                    this.fail(error);
                }
            }
            try {
                await within(Promise.all(this.connections.map(async (peer: PeerConnection): Promise<void> => {
                    if (peer.socket.readyState !== WebSocket.CLOSED) {
                        const closed = once(peer.socket, "close");
                        peer.socket.close();
                        await closed;
                    }
                })), "Peer socket closure deadline", 2000);
            } catch (error) {
                this.fail(error);
            } finally {
                for (const peer of this.connections) {
                    if (peer.socket.readyState !== WebSocket.CLOSED) {
                        peer.socket.terminate();
                    }
                }
                for (const socket of this.upgradeSockets) {
                    socket.destroy();
                }
                this.websockets.close();
            }
            try {
                await within(new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
                    this.server.close((error?: Error): void => error ? reject(error) : resolve());
                }), "HTTP listener closure deadline", 2000);
                expect(this.server.address()).toBeNull();
            } catch (error) {
                this.fail(error);
            }
            this.record("test-end", { pass: this.errors.length === 0, listenerClosed: this.server.address() === null });
            const directory: string = process.env.SPEECHSDK_EOF_TEST_OUTPUT_DIR;
            if (directory) {
                const output: string = join(directory, this.name);
                mkdirSync(output, { recursive: true });
                writeFileSync(join(output, "input.pcm"), this.input);
                for (const [connectionIndex, peer] of this.connections.entries()) {
                    for (const [turnIndex, turn] of peer.turns.entries()) {
                        writeFileSync(join(output, `connection-${connectionIndex}-turn-${turnIndex}.pcm`), Buffer.concat(turn.pcm));
                    }
                }
                writeFileSync(join(output, "observations.json"), JSON.stringify({
                    name: this.name, pass: this.errors.length === 0, events: this.events,
                    errors: this.errors.map((error: Error): string => error.stack || error.message),
                    connections: this.connections.map((peer: PeerConnection): object => ({
                        paths: peer.paths,
                        turns: peer.turns.map((turn: AudioTurn): object => ({
                            requestId: turn.requestId, headers: turn.headers, eofs: turn.eofs,
                            pcmBytes: Buffer.concat(turn.pcm).length,
                        })),
                    })),
                }, undefined, 2));
            }
        }
        if (this.errors.length > 0) {
            throw new Error(this.errors.map((error: Error): string => error.stack || error.message).join("\n"));
        }
    }
}
