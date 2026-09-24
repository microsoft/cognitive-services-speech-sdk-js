// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

jest.mock("http", () => ({
    ...jest.requireActual("http"),
    request: jest.fn(),
}));

import { EventEmitter } from "events";
import * as http from "http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { HttpRequest } from "../src/common.browser/HttpRequest";
import { ProxyInfo } from "../src/common.browser/ProxyInfo";
import type { PropertyCollection } from "../src/sdk/PropertyCollection";
import { PropertyId } from "../src/sdk/PropertyId";

const testIfNode: jest.It = (typeof window !== "undefined") ? test.skip : test;
const testIfBrowser: jest.It = (typeof window === "undefined") ? test.skip : test;
const requestMock = http.request as unknown as jest.Mock;

const createProxyInfo = (hostName: string, enableIpv6: boolean): ProxyInfo => {
    const values = new Map<PropertyId, string>([
        [PropertyId.SpeechServiceConnection_ProxyHostName, hostName],
        [PropertyId.SpeechServiceConnection_ProxyPort, "8080"],
        [PropertyId.SpeechServiceConnection_EnableIpv6, enableIpv6.toString()],
    ]);
    const properties: Pick<PropertyCollection, "getProperty"> = {
        getProperty: (key: PropertyId | string, defaultValue?: string | number | boolean): string =>
            values.get(key as PropertyId) ?? (defaultValue === undefined ? undefined : String(defaultValue)),
    };
    return ProxyInfo.fromParameters(properties);
};

const configureResponse = (): void => {
    requestMock.mockImplementation((
        _url: URL,
        _options: http.RequestOptions,
        callback: (response: http.IncomingMessage) => void): http.ClientRequest => {

        const response = new EventEmitter() as http.IncomingMessage;
        response.headers = {};
        response.statusCode = 200;
        response.statusMessage = "OK";

        const request = new EventEmitter() as http.ClientRequest;
        request.end = jest.fn();

        callback(response);
        process.nextTick((): void => {
            response.emit("end");
        });
        return request;
    });
};

describe("HttpRequest IPv6 opt-in", (): void => {
    afterEach((): void => {
        jest.clearAllMocks();
    });

    testIfNode("uses IPv4-only address selection by default", async (): Promise<void> => {
        configureResponse();

        await HttpRequest.request("GET", "http://example.test/path", {}, undefined, false);

        expect(requestMock.mock.calls[0][1]).toEqual(expect.objectContaining({ family: 4 }));
    });

    testIfNode("uses dual-stack address selection when IPv6 is enabled", async (): Promise<void> => {
        configureResponse();

        await HttpRequest.request("GET", "http://example.test/path", {}, undefined, true);

        expect(requestMock.mock.calls[0][1]).toEqual(expect.objectContaining({ family: 0 }));
    });

    testIfNode("rejects an IPv6 literal when IPv6 is disabled", async (): Promise<void> => {
        await expect(HttpRequest.request("GET", "http://[::1]/path", {}, undefined, false))
            .rejects.toThrow("IPv6 is disabled");
        expect(requestMock).not.toHaveBeenCalled();
    });

    testIfNode("applies IPv4-only selection to the proxy socket", async (): Promise<void> => {
        configureResponse();
        const proxyInfo: ProxyInfo = createProxyInfo("proxy.example", false);

        await HttpRequest.request("GET", "http://example.test/path", {}, undefined, false, proxyInfo);

        const options: http.RequestOptions = requestMock.mock.calls[0][1] as http.RequestOptions;
        const agent = options.agent as HttpsProxyAgent<string>;
        expect(agent).toBeInstanceOf(HttpsProxyAgent);
        expect(agent.connectOpts.family).toBe(4);
    });

    testIfNode("applies dual-stack selection to the proxy socket", async (): Promise<void> => {
        configureResponse();
        const proxyInfo: ProxyInfo = createProxyInfo("::1", true);

        await HttpRequest.request("GET", "http://example.test/path", {}, undefined, true, proxyInfo);

        const options: http.RequestOptions = requestMock.mock.calls[0][1] as http.RequestOptions;
        const agent = options.agent as HttpsProxyAgent<string>;
        expect(agent.connectOpts.family).toBe(0);
    });

    testIfNode("rejects an IPv6 proxy host when IPv6 is disabled", async (): Promise<void> => {
        const proxyInfo: ProxyInfo = createProxyInfo("::1", false);

        await expect(HttpRequest.request("GET", "http://example.test/path", {}, undefined, false, proxyInfo))
            .rejects.toThrow("IPv6 is disabled");
        expect(requestMock).not.toHaveBeenCalled();
    });

    testIfBrowser("leaves address-family selection to browser fetch", async (): Promise<void> => {
        const originalFetch = globalThis.fetch;
        const fetchMock = jest.fn().mockResolvedValue({
            headers: {
                forEach: jest.fn(),
            },
            status: 200,
            statusText: "OK",
            text: (): Promise<string> => Promise.resolve("{}"),
        });
        globalThis.fetch = fetchMock;

        try {
            await HttpRequest.request("GET", "https://example.test/path", {}, undefined, true);
            expect(fetchMock).toHaveBeenCalledWith("https://example.test/path", {
                body: undefined,
                headers: {},
                method: "GET",
            });
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
