// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as http from "http";
import * as https from "https";
import * as net from "net";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ProxyInfo } from "./ProxyInfo.js";

export interface IHttpResponse {
    body: string;
    headers: http.IncomingHttpHeaders;
    status: number;
    statusText: string;
}

export type HttpRequestBody = string | ArrayBuffer | ArrayBufferView | NodeJS.ReadableStream | null | undefined;

interface BrowserResponse {
    headers: {
        forEach(callback: (value: string, key: string) => void): void;
    };
    status: number;
    statusText: string;
    text(): Promise<string>;
}

type BrowserRequestBody = string | ArrayBuffer | null | undefined;

export const isHttpRequestStream = (body: unknown): body is NodeJS.ReadableStream =>
    body !== null &&
    typeof body === "object" &&
    "pipe" in body &&
    typeof body.pipe === "function";

export class HttpRequest {
    public static async request(
        method: string,
        uri: string,
        headers: { [key: string]: string },
        body: HttpRequestBody,
        enableIpv6: boolean,
        proxyInfo?: ProxyInfo): Promise<IHttpResponse> {

        if (typeof window !== "undefined") {
            if (isHttpRequestStream(body)) {
                throw new Error("Streaming HTTP request bodies are not supported in browser environments.");
            }
            const browserBody: BrowserRequestBody = ArrayBuffer.isView(body)
                ? new Uint8Array(body.buffer, body.byteOffset, body.byteLength).slice().buffer
                : body;
            const browserGlobal = globalThis as unknown as {
                fetch(input: string, init: {
                    body: BrowserRequestBody;
                    headers: { [key: string]: string };
                    method: string;
                }): Promise<BrowserResponse>;
            };
            const response: BrowserResponse = await browserGlobal.fetch(uri, {
                body: browserBody,
                headers,
                method,
            });
            const responseHeaders: { [key: string]: string } = {};
            response.headers.forEach((value: string, key: string): void => {
                responseHeaders[key] = value;
            });
            return {
                body: await response.text(),
                headers: responseHeaders,
                status: response.status,
                statusText: response.statusText,
            };
        }

        return HttpRequest.requestNode(method, uri, headers, body, enableIpv6, proxyInfo);
    }

    private static requestNode(
        method: string,
        uri: string,
        headers: { [key: string]: string },
        body: HttpRequestBody,
        enableIpv6: boolean,
        proxyInfo?: ProxyInfo): Promise<IHttpResponse> {

        return new Promise<IHttpResponse>((resolve: (value: IHttpResponse) => void, reject: (reason?: any) => void): void => {
            const url = new URL(uri);
            const family: 0 | 4 = enableIpv6 ? 0 : 4;
            const targetHost: string = url.hostname.replace(/^\[|\]$/g, "").split("%")[0];
            if (!enableIpv6 &&
                ((!proxyInfo?.IsConfigured && net.isIPv6(targetHost)) ||
                    (proxyInfo?.IsConfigured && proxyInfo.IsIpv6Host))) {
                throw new Error("IPv6 is disabled for this Speech service connection.");
            }

            const options: https.RequestOptions = {
                family,
                headers,
                method,
            };

            if (proxyInfo?.IsConfigured) {
                options.agent = new HttpsProxyAgent<"http:">(proxyInfo.Url, { family });
            }

            const transport: typeof http | typeof https = url.protocol === "https:" ? https : http;
            const request: http.ClientRequest = transport.request(url, options, (response: http.IncomingMessage): void => {
                const chunks: Buffer[] = [];
                response.on("data", (chunk: Buffer | string): void => {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                });
                response.on("end", (): void => {
                    resolve({
                        body: Buffer.concat(chunks).toString(),
                        headers: response.headers,
                        status: response.statusCode,
                        statusText: response.statusMessage,
                    });
                });
                response.on("error", reject);
            });

            request.on("error", reject);
            if (isHttpRequestStream(body)) {
                body.pipe(request);
            } else if (body instanceof ArrayBuffer) {
                request.end(Buffer.from(body));
            } else if (ArrayBuffer.isView(body)) {
                request.end(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
            } else {
                request.end(body);
            }
        });
    }
}
