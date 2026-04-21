// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

jest.mock("ws", () => ({
    __esModule: true,
    default: jest.fn(),
}));

import ws from "ws";

import { WebsocketMessageAdapter } from "../src/common.browser/WebsocketMessageAdapter";

const testIfNode: jest.It = (typeof window !== "undefined") ? test.skip : test;

const createFakeSocket = (): any => ({
    OPEN: 1,
    readyState: 1,
    binaryType: undefined,
    onopen: undefined,
    onerror: undefined,
    onclose: undefined,
    onmessage: undefined,
    on: jest.fn(),
    close: jest.fn(),
    send: jest.fn(),
});

const formatter: any = {
    fromConnectionMessage: jest.fn(),
    toConnectionMessage: jest.fn(),
};

describe("WebsocketMessageAdapter transport selection", (): void => {
    const wsMock = ws as unknown as jest.Mock;
    const originalWebSocket = (globalThis as any).WebSocket;

    afterEach((): void => {
        WebsocketMessageAdapter.forceNpmWebSocket = false;
        wsMock.mockReset();
        if (originalWebSocket === undefined) {
            delete (globalThis as any).WebSocket;
        } else {
            (globalThis as any).WebSocket = originalWebSocket;
        }
    });

    testIfNode("uses the global WebSocket path in Node when no proxy is configured", async (): Promise<void> => {
        const browserSocket = createFakeSocket();
        const browserWebSocketMock = jest.fn(() => browserSocket);
        (globalThis as any).WebSocket = browserWebSocketMock;

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            undefined as any,
            {},
            false,
        );

        const openPromise = adapter.open();

        expect(browserWebSocketMock).toHaveBeenCalledWith("wss://example.test/speech");
        expect(wsMock).not.toHaveBeenCalled();

        browserSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: browserSocket });
        await openPromise;
    });

    testIfNode("uses the ws path in Node when proxy is configured even if global WebSocket exists", async (): Promise<void> => {
        const browserWebSocketMock = jest.fn(() => createFakeSocket());
        const nodeSocket = createFakeSocket();
        (globalThis as any).WebSocket = browserWebSocketMock;
        wsMock.mockImplementation(() => nodeSocket);

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            { HostName: "localhost", Port: 8880 } as any,
            {},
            false,
        );

        const openPromise = adapter.open();

        expect(browserWebSocketMock).not.toHaveBeenCalled();
        expect(wsMock).toHaveBeenCalledTimes(1);
        expect(wsMock.mock.calls[0][0]).toBe("wss://example.test/speech");
        expect(wsMock.mock.calls[0][1]).toEqual(expect.objectContaining({ agent: expect.anything() }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });
});
