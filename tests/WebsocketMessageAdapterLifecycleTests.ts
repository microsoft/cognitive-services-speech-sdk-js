// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

jest.mock("ws", (): { __esModule: boolean; default: jest.Mock } => ({
    __esModule: true,
    default: jest.fn(),
}));

import ws from "ws";

import {
    ConnectionMessage,
    ConnectionOpenResponse,
    ConnectionState,
    IWebsocketMessageFormatter,
    Queue,
    RawWebsocketMessage,
} from "../src/common/Exports";
import { WebsocketMessageAdapter } from "../src/common.browser/WebsocketMessageAdapter";

interface FakeSocket {
    OPEN: number;
    readyState: number;
    binaryType: string;
    onopen: (() => void) | undefined;
    onerror: ((event: { error: Error; message: string; type: string; target: FakeSocket }) => void) | undefined;
    onclose: ((event: { wasClean: boolean; code: number; reason: string; target: FakeSocket }) => void) | undefined;
    onmessage: (() => void) | undefined;
    on: jest.Mock;
    close: jest.Mock;
    send: jest.Mock;
}

const createFakeSocket = (): FakeSocket => ({
    OPEN: 1,
    readyState: 0,
    binaryType: "",
    onopen: undefined,
    onerror: undefined,
    onclose: undefined,
    onmessage: undefined,
    on: jest.fn(),
    close: jest.fn(),
    send: jest.fn(),
});

const formatter: IWebsocketMessageFormatter = {
    fromConnectionMessage: jest.fn<Promise<RawWebsocketMessage>, [ConnectionMessage]>(),
    toConnectionMessage: jest.fn<Promise<ConnectionMessage>, [RawWebsocketMessage]>(),
};

const createAdapter = (): WebsocketMessageAdapter => new WebsocketMessageAdapter(
    "wss://example.test/speech",
    "connection-id",
    formatter,
    undefined,
    {},
    false,
);

const flushCleanup = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

const emitError = (socket: FakeSocket, message: string): void => {
    if (!socket.onerror) {
        throw new Error("WebSocket error handler is not assigned.");
    }
    socket.onerror({ error: new Error(message), message, type: "error", target: socket });
};

const emitClose = (socket: FakeSocket, code: number, reason: string): void => {
    if (!socket.onclose) {
        throw new Error("WebSocket close handler is not assigned.");
    }
    socket.onclose({ wasClean: false, code, reason, target: socket });
};

const emitOpen = (socket: FakeSocket): void => {
    if (!socket.onopen) {
        throw new Error("WebSocket open handler is not assigned.");
    }
    socket.onopen();
};

describe("WebsocketMessageAdapter connection establishment", (): void => {
    const wsMock = ws as unknown as jest.Mock;

    beforeEach((): void => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        wsMock.mockReset();
        WebsocketMessageAdapter.forceNpmWebSocket = true;
    });

    afterEach((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("settles an opening error without waiting for close", async (): Promise<void> => {
        const socket = createFakeSocket();
        const drainSpy = jest.spyOn(Queue.prototype, "drainAndDispose");
        wsMock.mockImplementation((): FakeSocket => socket);
        const adapter = createAdapter();

        const openPromise = adapter.open();
        emitError(socket, "failed");
        const response = await openPromise;
        await flushCleanup();

        expect(response.statusCode).toBe(1006);
        expect(response.reason).toBe("failed");
        expect(adapter.state).toBe(ConnectionState.Disconnected);
        expect(socket.close).toHaveBeenCalledTimes(1);
        expect(drainSpy).toHaveBeenCalledTimes(2);
    });

    test("ignores a late close after an opening error", async (): Promise<void> => {
        const socket = createFakeSocket();
        const drainSpy = jest.spyOn(Queue.prototype, "drainAndDispose");
        wsMock.mockImplementation((): FakeSocket => socket);
        const adapter = createAdapter();
        let settlementCount = 0;

        const openPromise = adapter.open().then((response: ConnectionOpenResponse): ConnectionOpenResponse => {
            settlementCount++;
            return response;
        });
        emitError(socket, "failed");
        const response = await openPromise;
        await flushCleanup();
        emitClose(socket, 1006, "late close");
        await flushCleanup();

        expect(response.statusCode).toBe(1006);
        expect(settlementCount).toBe(1);
        expect(adapter.state).toBe(ConnectionState.Disconnected);
        expect(socket.close).toHaveBeenCalledTimes(1);
        expect(drainSpy).toHaveBeenCalledTimes(2);
    });

    test("settles when close arrives before open", async (): Promise<void> => {
        const socket = createFakeSocket();
        const drainSpy = jest.spyOn(Queue.prototype, "drainAndDispose");
        wsMock.mockImplementation((): FakeSocket => socket);
        const adapter = createAdapter();

        const openPromise = adapter.open();
        emitClose(socket, 1001, "closed first");
        const response = await openPromise;
        await flushCleanup();

        expect(response.statusCode).toBe(1001);
        expect(response.reason).toContain("closed first");
        expect(adapter.state).toBe(ConnectionState.Disconnected);
        expect(socket.close).not.toHaveBeenCalled();
        expect(drainSpy).toHaveBeenCalledTimes(2);
    });

    test("settles a provider constructor throw with status 500", async (): Promise<void> => {
        wsMock.mockImplementation((): never => {
            throw new Error("constructor failed");
        });
        const adapter = createAdapter();

        const response = await adapter.open();

        expect(response.statusCode).toBe(500);
        expect(response.reason).toContain("constructor failed");
        expect(adapter.state).toBe(ConnectionState.Disconnected);
        expect(jest.getTimerCount()).toBe(0);
    });

    test("settles when the provider produces no callback before the deadline", async (): Promise<void> => {
        const socket = createFakeSocket();
        const drainSpy = jest.spyOn(Queue.prototype, "drainAndDispose");
        wsMock.mockImplementation((): FakeSocket => socket);
        const adapter = createAdapter();
        let settlementCount = 0;

        const openPromise = adapter.open().then((response: ConnectionOpenResponse): ConnectionOpenResponse => {
            settlementCount++;
            return response;
        });
        jest.advanceTimersByTime(29999);
        await Promise.resolve();
        expect(settlementCount).toBe(0);

        jest.advanceTimersByTime(1);
        const response = await openPromise;
        await flushCleanup();

        expect(response.statusCode).toBe(1006);
        expect(response.reason).toContain("timed out");
        expect(settlementCount).toBe(1);
        expect(socket.close).toHaveBeenCalledTimes(1);
        expect(drainSpy).toHaveBeenCalledTimes(2);
        expect(jest.getTimerCount()).toBe(0);
    });

    test("settles a successful open and cancels the deadline", async (): Promise<void> => {
        const socket = createFakeSocket();
        wsMock.mockImplementation((): FakeSocket => socket);
        const adapter = createAdapter();
        let settlementCount = 0;

        const openPromise = adapter.open().then((response: ConnectionOpenResponse): ConnectionOpenResponse => {
            settlementCount++;
            return response;
        });
        emitOpen(socket);
        const response = await openPromise;

        expect(response.statusCode).toBe(200);
        expect(adapter.state).toBe(ConnectionState.Connected);
        expect(settlementCount).toBe(1);
        expect(jest.getTimerCount()).toBe(0);

        jest.advanceTimersByTime(30000);
        await Promise.resolve();
        expect(settlementCount).toBe(1);
        expect(socket.close).not.toHaveBeenCalled();
    });
});
