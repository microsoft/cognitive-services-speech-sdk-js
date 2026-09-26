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
import { ProxyInfo } from "../src/common.browser/ProxyInfo";
import type { PropertyCollection } from "../src/sdk/PropertyCollection";
import { PropertyId } from "../src/sdk/PropertyId";

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

const createProxyInfo = (
    hostName?: string,
    port?: number,
    userName?: string,
    password?: string,
    enableIpv6: boolean = false): ProxyInfo => {

    const values = new Map<PropertyId, string>([
        [PropertyId.SpeechServiceConnection_ProxyHostName, hostName],
        [PropertyId.SpeechServiceConnection_ProxyPort, port?.toString()],
        [PropertyId.SpeechServiceConnection_ProxyUserName, userName],
        [PropertyId.SpeechServiceConnection_ProxyPassword, password],
        [PropertyId.SpeechServiceConnection_EnableIpv6, enableIpv6.toString()],
    ]);
    const properties: Pick<PropertyCollection, "getProperty"> = {
        getProperty: (key: PropertyId | string, defaultValue?: string | number | boolean): string =>
            values.get(key as PropertyId) ?? (defaultValue === undefined ? undefined : String(defaultValue)),
    };

    return ProxyInfo.fromParameters(properties);
};

test("propagates the IPv6 opt-in property to transport configuration", (): void => {
    expect(createProxyInfo().EnableIpv6).toBe(false);
    expect(createProxyInfo(undefined, undefined, undefined, undefined, true).EnableIpv6).toBe(true);
});

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

    testIfNode("uses the configurable ws path in Node when no proxy is configured", async (): Promise<void> => {
        const browserWebSocketMock = jest.fn(() => createFakeSocket());
        const nodeSocket = createFakeSocket();
        (globalThis as any).WebSocket = browserWebSocketMock;
        wsMock.mockImplementation(() => nodeSocket);

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            undefined as any,
            {},
            false,
        );

        const openPromise = adapter.open();

        expect(browserWebSocketMock).not.toHaveBeenCalled();
        expect(wsMock).toHaveBeenCalledWith("wss://example.test/speech", expect.objectContaining({ agent: expect.anything() }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
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
            createProxyInfo("localhost", 8880),
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
            createProxyInfo("proxy.example", 8080, "user", "pass"),
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
        expect(agent.connectOpts.family).toBe(4);

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("supports IPv6 proxy hosts", async (): Promise<void> => {
        const nodeSocket = createFakeSocket();
        wsMock.mockImplementation(() => nodeSocket);

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            createProxyInfo("::1", 8080, undefined, undefined, true),
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as HttpsProxyAgent<string>;

        expect(agent.proxy.hostname).toBe("[::1]");
        expect(agent.proxy.port).toBe("8080");
        expect(agent.connectOpts.family).toBe(0);

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("rejects an IPv6 proxy host when IPv6 is disabled", async (): Promise<void> => {
        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            createProxyInfo("::1", 8080),
            {},
            false,
        );

        const response = await adapter.open();

        expect(response.statusCode).toBe(500);
        expect(String(response.reason)).toEqual(expect.stringContaining("IPv6 is disabled"));
        expect(wsMock).not.toHaveBeenCalled();
    });

    testIfNode("preserves percent sequences in proxy credentials", async (): Promise<void> => {
        const nodeSocket = createFakeSocket();
        wsMock.mockImplementation(() => nodeSocket);

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            createProxyInfo("proxy.example", 8080, "user%41", "pass%word"),
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as HttpsProxyAgent<string>;

        expect(decodeURIComponent(agent.proxy.username)).toBe("user%41");
        expect(decodeURIComponent(agent.proxy.password)).toBe("pass%word");

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
            family: 4,
            requestOCSP: true,
            servername: "example.test",
            secureEndpoint: true,
        }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("enables dual-stack address selection for direct Node connections", async (): Promise<void> => {
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
            createProxyInfo(undefined, undefined, undefined, undefined, true),
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as any;

        expect(agent.createConnection({ host: "example.test", port: 443 })).toBe(tlsSocket);
        expect(tlsConnectMock).toHaveBeenCalledWith(expect.objectContaining({
            family: 0,
            requestOCSP: true,
            servername: "example.test",
            secureEndpoint: true,
        }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("rejects a direct IPv6 literal when IPv6 is disabled", async (): Promise<void> => {
        const nodeSocket = createFakeSocket();
        wsMock.mockImplementation(() => nodeSocket);
        delete (globalThis as any).WebSocket;

        const adapter = new WebsocketMessageAdapter(
            "wss://[::1]/speech",
            "connection-id",
            formatter,
            undefined as any,
            {},
            false,
        );

        const openPromise = adapter.open();
        const options = wsMock.mock.calls[0][1] as ws.ClientOptions;
        const agent = options.agent as any;

        expect(() => agent.createConnection({ host: "::1", port: 443 })).toThrow("IPv6 is disabled");

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
            family: 4,
            requestOCSP: true,
            servername: "example.test",
            secureEndpoint: false,
        }));

        nodeSocket.onclose({ wasClean: false, code: 1000, reason: "closed", target: nodeSocket });
        await openPromise;
    });

    testIfNode("leaves address-family selection to the browser", async (): Promise<void> => {
        const browserSocket = createFakeSocket();
        const browserWebSocketMock = jest.fn(() => browserSocket);
        (globalThis as any).window = {};
        (globalThis as any).WebSocket = browserWebSocketMock;

        const adapter = new WebsocketMessageAdapter(
            "wss://example.test/speech",
            "connection-id",
            formatter,
            createProxyInfo("proxy.example", 8080, "user", "pass", true),
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
