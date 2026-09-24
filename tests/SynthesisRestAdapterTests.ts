// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    RestMessageAdapter,
    RestRequestType,
} from "../src/common.browser/Exports";
import { HttpRequest } from "../src/common.browser/HttpRequest";
import type { IHttpResponse } from "../src/common.browser/HttpRequest";
import { ConnectionFactoryBase } from "../src/common.speech/ConnectionFactoryBase";
import {
    AuthInfo,
    IAuthentication,
    SynthesisRestAdapter,
    SynthesizerConfig,
} from "../src/common.speech/Exports";
import { HeaderNames } from "../src/common.speech/HeaderNames";
import { PropertyCollection, PropertyId } from "../src/sdk/Exports";

// Minimal IAuthentication stub so the adapter can attach an auth header without contacting any service.
class StubAuthentication implements IAuthentication {
    public fetch(_authFetchEventId: string): Promise<AuthInfo> {
        return Promise.resolve(new AuthInfo(HeaderNames.Authorization, "Bearer test-token"));
    }
    public fetchOnExpiry(_authFetchEventId: string): Promise<AuthInfo> {
        return Promise.resolve(new AuthInfo(HeaderNames.Authorization, "Bearer test-token"));
    }
}

const buildAdapter = (configure: (params: PropertyCollection) => void): { adapter: SynthesisRestAdapter; requestMock: jest.Mock } => {
    const params: PropertyCollection = new PropertyCollection();
    configure(params);
    const config: SynthesizerConfig = new SynthesizerConfig(null, params);
    const adapter: SynthesisRestAdapter = new SynthesisRestAdapter(config, new StubAuthentication());

    // Capture the URI handed to the REST layer and short-circuit the actual network call.
    const requestMock: jest.Mock = jest.fn().mockResolvedValue({ ok: true, status: 200, data: "{}", json: {} });
    jest.spyOn(RestMessageAdapter.prototype, "request").mockImplementation(requestMock as never);
    jest.spyOn(RestMessageAdapter.prototype, "setHeaders").mockImplementation((): void => { /* no-op */ });

    return { adapter, requestMock };
};

describe("SynthesisRestAdapter voices/list URI resolution", (): void => {

    afterEach((): void => {
        jest.restoreAllMocks();
    });

    test("uses the region-derived host when no endpoint is supplied (no redirect resolution)", async (): Promise<void> => {
        const redirectSpy = jest.spyOn(ConnectionFactoryBase, "getRedirectUrlFromEndpoint");
        const { adapter, requestMock } = buildAdapter((params: PropertyCollection): void => {
            params.setProperty(PropertyId.SpeechServiceConnection_Region, "westus2");
        });

        await adapter.getVoicesList("conn-id");

        expect(redirectSpy).not.toHaveBeenCalled();
        const calledUri: string = requestMock.mock.calls[0][1] as string;
        expect(calledUri).toEqual("https://westus2.tts.speech.microsoft.com/cognitiveservices/voices/list");
    });

    test("resolves a custom-domain endpoint via the synthesis redirect and retargets to voices/list", async (): Promise<void> => {
        // The redirect handler is exposed on the synthesis route and returns the regional host plus the
        // custom-domain parameter required for AAD token auth.
        const redirectSpy = jest.spyOn(ConnectionFactoryBase, "getRedirectUrlFromEndpoint").mockResolvedValue(
            "https://eastus.tts.speech.microsoft.com/cognitiveservices/websocket/v1?GenerateRedirectResponse=true&Ocp-Apim-Custom-Domain-Name=mycustom.cognitiveservices.azure.com");

        const { adapter, requestMock } = buildAdapter((params: PropertyCollection): void => {
            params.setProperty(PropertyId.SpeechServiceConnection_Endpoint, "https://mycustom.cognitiveservices.azure.com/");
        });

        await adapter.getVoicesList("conn-id");

        // Redirect must be resolved on the synthesis path, keeping the http(s) scheme for this REST call.
        expect(redirectSpy).toHaveBeenCalledTimes(1);
        const redirectArg: string = redirectSpy.mock.calls[0][0] as string;
        const useWebSocketProtocol: boolean = redirectSpy.mock.calls[0][1] as boolean;
        expect(new URL(redirectArg).pathname).toEqual("/tts/cognitiveservices/websocket/v1");
        expect(useWebSocketProtocol).toBe(false);

        // Final voices URI is on the resolved regional host, carries the custom-domain param, and drops
        // the GenerateRedirectResponse marker.
        const calledUri: URL = new URL(requestMock.mock.calls[0][1] as string);
        expect(calledUri.protocol).toEqual("https:");
        expect(calledUri.host).toEqual("eastus.tts.speech.microsoft.com");
        expect(calledUri.pathname).toEqual("/cognitiveservices/voices/list");
        expect(calledUri.searchParams.get("Ocp-Apim-Custom-Domain-Name")).toEqual("mycustom.cognitiveservices.azure.com");
        expect(calledUri.searchParams.has("GenerateRedirectResponse")).toBe(false);
    });

    test("falls back to the original host when no redirect applies to a custom endpoint", async (): Promise<void> => {
        // getRedirectUrlFromEndpoint returns its input unchanged on a non-200 response.
        jest.spyOn(ConnectionFactoryBase, "getRedirectUrlFromEndpoint").mockImplementation(
            (endpoint: string): Promise<string> => Promise.resolve(endpoint));

        const { adapter, requestMock } = buildAdapter((params: PropertyCollection): void => {
            params.setProperty(PropertyId.SpeechServiceConnection_Endpoint, "https://eastus.tts.speech.microsoft.com/");
        });

        await adapter.getVoicesList("conn-id");

        const calledUri: URL = new URL(requestMock.mock.calls[0][1] as string);
        expect(calledUri.host).toEqual("eastus.tts.speech.microsoft.com");
        expect(calledUri.pathname).toEqual("/cognitiveservices/voices/list");
    });

    test("preserves legacy behavior when the endpoint already carries a path", async (): Promise<void> => {
        const redirectSpy = jest.spyOn(ConnectionFactoryBase, "getRedirectUrlFromEndpoint");
        const { adapter, requestMock } = buildAdapter((params: PropertyCollection): void => {
            params.setProperty(PropertyId.SpeechServiceConnection_Endpoint, "https://myhost.example.com/custom/path");
        });

        await adapter.getVoicesList("conn-id");

        expect(redirectSpy).not.toHaveBeenCalled();
        const calledUri: string = requestMock.mock.calls[0][1] as string;
        expect(calledUri).toEqual("https://myhost.example.com/custom/path/cognitiveservices/voices/list");
    });

    test("resolves the URI only once across multiple calls", async (): Promise<void> => {
        const redirectSpy = jest.spyOn(ConnectionFactoryBase, "getRedirectUrlFromEndpoint").mockResolvedValue(
            "https://eastus.tts.speech.microsoft.com/cognitiveservices/websocket/v1?Ocp-Apim-Custom-Domain-Name=mycustom.cognitiveservices.azure.com");

        const { adapter } = buildAdapter((params: PropertyCollection): void => {
            params.setProperty(PropertyId.SpeechServiceConnection_Endpoint, "https://mycustom.cognitiveservices.azure.com/");
        });

        await adapter.getVoicesList("conn-id");
        await adapter.getVoicesList("conn-id");

        expect(redirectSpy).toHaveBeenCalledTimes(1);
    });
});

describe("ConnectionFactoryBase.getRedirectUrlFromEndpoint protocol handling", (): void => {
    const regionalHttpsUrl = "https://eastus.tts.speech.microsoft.com/cognitiveservices/websocket/v1";

    afterEach((): void => {
        jest.restoreAllMocks();
    });

    test("converts to wss by default (WebSocket callers)", async (): Promise<void> => {
        jest.spyOn(HttpRequest, "request").mockResolvedValue({
            body: regionalHttpsUrl,
            headers: {},
            status: 200,
            statusText: "OK",
        });

        const result: string = await ConnectionFactoryBase.getRedirectUrlFromEndpoint("https://mycustom.cognitiveservices.azure.com/tts/cognitiveservices/websocket/v1");
        expect(new URL(result).protocol).toEqual("wss:");
    });

    test("keeps https when useWebSocketProtocol is false (REST callers)", async (): Promise<void> => {
        jest.spyOn(HttpRequest, "request").mockResolvedValue({
            body: regionalHttpsUrl,
            headers: {},
            status: 200,
            statusText: "OK",
        });

        const result: string = await ConnectionFactoryBase.getRedirectUrlFromEndpoint("https://mycustom.cognitiveservices.azure.com/tts/cognitiveservices/websocket/v1", false);
        expect(new URL(result).protocol).toEqual("https:");
    });

    test("returns the original endpoint on a non-200 response", async (): Promise<void> => {
        jest.spyOn(HttpRequest, "request").mockResolvedValue({
            body: "",
            headers: {},
            status: 404,
            statusText: "Not Found",
        });

        const endpoint = "https://mycustom.cognitiveservices.azure.com/tts/cognitiveservices/websocket/v1";
        const result: string = await ConnectionFactoryBase.getRedirectUrlFromEndpoint(endpoint, false);
        expect(result).toEqual(endpoint);
    });
});

describe("RestMessageAdapter IPv6 transport options", (): void => {

    afterEach((): void => {
        jest.restoreAllMocks();
    });

    test("forwards IPv6 opt-in and proxy configuration to HTTP requests", async (): Promise<void> => {
        const parameters = new PropertyCollection();
        parameters.setProperty(PropertyId.SpeechServiceConnection_EnableIpv6, "true");
        parameters.setProperty(PropertyId.SpeechServiceConnection_ProxyHostName, "::1");
        parameters.setProperty(PropertyId.SpeechServiceConnection_ProxyPort, "8080");
        const proxyInfo: ProxyInfo = ProxyInfo.fromParameters(parameters);
        const response: IHttpResponse = {
            body: "{}",
            headers: {},
            status: 200,
            statusText: "OK",
        };
        const requestSpy = jest.spyOn(HttpRequest, "request").mockResolvedValue(response);
        const adapter = new RestMessageAdapter({
            headers: {},
            proxyInfo,
        });

        await adapter.request(RestRequestType.Get, "https://example.test/voices");

        expect(requestSpy).toHaveBeenCalledWith(
            "GET",
            "https://example.test/voices",
            {},
            null,
            true,
            proxyInfo);
    });
});
