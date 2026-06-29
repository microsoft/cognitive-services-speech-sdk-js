// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

jest.mock("ws", () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock("net", () => ({
    ...jest.requireActual("net"),
    connect: jest.fn(),
}));

jest.mock("tls", () => ({
    ...jest.requireActual("tls"),
    connect: jest.fn(),
}));

import ws from "ws";
import * as net from "net";
import * as tls from "tls";
import { HttpsProxyAgent } from "https-proxy-agent";

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
    const originalWindow = (globalThis as any).window;

    afterEach((): void => {
        jest.clearAllMocks();
        WebsocketMessageAdapter.forceNpmWebSocket = false;
        wsMock.mockReset();
        if (originalWebSocket === undefined) {
            delete (globalThis as any).WebSocket;
        } else {
            (globalThis as any).WebSocket = originalWebSocket;
        }
        if (originalWindow === undefined) {
            delete (globalThis as any).window;
        } else {
            (globalThis as any).window = originalWindow;
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

    testIfNode("translates proxy settings and credentials into the proxy agent", async (): Promise<void> => {
        const nodeSocket = createFakeSocket();
        wsMock.mockImplementation(() => nodeSocket);

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            { HostName: "proxy.example", Port: 8080, UserName: "user", Password: "pass" } as any,
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as HttpsProxyAgent<string>;

        expect(agent).toBeInstanceOf(HttpsProxyAgent);
        expect(agent.proxy.protocol).toBe("http:");
        expect(agent.proxy.hostname).toBe("proxy.example");
        expect(agent.proxy.port).toBe("8080");
        expect(agent.proxy.username).toBe("user");
        expect(agent.proxy.password).toBe("pass");

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("uses a direct TLS socket with OCSP options for wss without relying on secureEndpoint", async (): Promise<void> => {
        const nodeSocket = createFakeSocket();
        const tlsSocket = createFakeSocket();
        const tlsConnectMock = tls.connect as unknown as jest.Mock;
        tlsConnectMock.mockReturnValue(tlsSocket);
        wsMock.mockImplementation(() => nodeSocket);
        delete (globalThis as any).WebSocket;

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            undefined as any,
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as any;

        expect(agent.createConnection({ host: "example.test", port: 443 })).toBe(tlsSocket);
        expect(tlsConnectMock).toHaveBeenCalledWith(expect.objectContaining({
            requestOCSP: true,
            servername: "example.test",
            secureEndpoint: true,
        }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("uses a direct TCP socket with OCSP options for ws without relying on secureEndpoint", async (): Promise<void> => {
        const nodeSocket = createFakeSocket();
        const netSocket = createFakeSocket();
        const netConnectMock = net.connect as unknown as jest.Mock;
        netConnectMock.mockReturnValue(netSocket);
        wsMock.mockImplementation(() => nodeSocket);
        delete (globalThis as any).WebSocket;

        const adapter = new WebsocketMessageAdapter(
            "ws://example.test/speech",
            "connection-id",
            formatter,
            undefined as any,
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as any;

        expect(agent.createConnection({ host: "example.test", port: 80 })).toBe(netSocket);
        expect(netConnectMock).toHaveBeenCalledWith(expect.objectContaining({
            requestOCSP: true,
            servername: "example.test",
            secureEndpoint: false,
        }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("uses the browser WebSocket path when a browser global is present even if proxy is configured", async (): Promise<void> => {
        const browserSocket = createFakeSocket();
        const browserWebSocketMock = jest.fn(() => browserSocket);
        (globalThis as any).window = {};
        (globalThis as any).WebSocket = browserWebSocketMock;

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            { HostName: "proxy.example", Port: 8080, UserName: "user", Password: "pass" } as any,
            {},
            false,
        );

        const openPromise = adapter.open();

        expect(browserWebSocketMock).toHaveBeenCalledWith("wss://example.test/speech");
        expect(wsMock).not.toHaveBeenCalled();

        browserSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: browserSocket });
        await openPromise;
    });
});
