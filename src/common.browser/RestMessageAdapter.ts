// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArgumentNullError } from "../common/Exports.js";
import type { IRequestOptions } from "./RestConfigBase.js";
import { HttpRequest, HttpRequestBody, IHttpResponse, isHttpRequestStream } from "./HttpRequest.js";
import { ProxyInfo } from "./ProxyInfo.js";

export enum RestRequestType {
    Get = "GET",
    Post = "POST",
    Delete = "DELETE",
    File = "file",
}

export interface IRestResponse {
    ok: boolean;
    status: number;
    statusText: string;
    data: string;
    json: any;
    headers: string;
}

interface JsonError {
    error?: {
        message: string;
    };
}

const normalizeRequestBody = (body: unknown): HttpRequestBody => {
    if (body === null) {
        return null;
    }
    if (body === undefined) {
        return undefined;
    }
    if (typeof body === "string") {
        return body;
    }
    if (body instanceof ArrayBuffer) {
        return body;
    }
    if (ArrayBuffer.isView(body)) {
        return body;
    }
    if (isHttpRequestStream(body)) {
        return body;
    }
    return JSON.stringify(body);
};

// accept rest operations via request method and return abstracted objects from server response
export class RestMessageAdapter {

    private privIgnoreCache: boolean;
    private privHeaders: { [key: string]: string };
    private privProxyInfo: ProxyInfo;

    public constructor(
        configParams: IRequestOptions
        ) {

        if (!configParams) {
            throw new ArgumentNullError("configParams");
        }

        this.privHeaders = configParams.headers;
        this.privIgnoreCache = configParams.ignoreCache;
        this.privProxyInfo = configParams.proxyInfo;
    }

    public static extractHeaderValue(headerKey: string, headers: string): string {
        let headerValue: string = "";

        try {
            const arr = headers.trim().split(/[\r\n]+/);
            const headerMap: { [key: string]: string } = {};
            arr.forEach((line: string): void => {
                const parts = line.split(": ");
                const header = parts.shift().toLowerCase();
                const value = parts.join(": ");
                headerMap[header] = value;
            });

            headerValue = headerMap[headerKey.toLowerCase()];
        } catch (e) {
            // ignore the error
        }

        return headerValue;
    }

    public set options(configParams: IRequestOptions) {
        this.privHeaders = configParams.headers;
        this.privIgnoreCache = configParams.ignoreCache;
        this.privProxyInfo = configParams.proxyInfo;
    }

    public setHeaders(key: string, value: string): void {
        this.privHeaders[key] = value;
    }

    public async request(
        method: RestRequestType,
        uri: string,
        queryParams: { [key: string]: any } = {},
        body: unknown = null,
        ): Promise<IRestResponse> {
        const requestCommand = method === RestRequestType.File ? "POST" : method;

        if (this.privIgnoreCache) {
            this.privHeaders["Cache-Control"] = "no-cache";
        }

        if (method === RestRequestType.Post && body) {
            this.privHeaders["content-type"] = "application/json";
            this.privHeaders["Content-Type"] = "application/json";
        }

        const params: string = this.queryParams(queryParams);
        const requestUri: string = params === "" ? uri : `${uri}?${params}`;
        const postData: HttpRequestBody = normalizeRequestBody(body);
        const response: IHttpResponse = await HttpRequest.request(
            requestCommand,
            requestUri,
            this.privHeaders,
            postData,
            this.privProxyInfo?.EnableIpv6 ?? false,
            this.privProxyInfo);

        const acceptedStatusCodes: number[] = [200, 201, 202, 204, 400, 401, 402, 403, 404];
        if (!acceptedStatusCodes.includes(response.status)) {
            const error: Error & { statusCode?: number } = new Error(response.statusText);
            error.statusCode = response.status;
            throw error;
        }

        let json: JsonError = {};
        if (method !== RestRequestType.Delete && response.status !== 204 && response.body !== "") {
            try {
                json = JSON.parse(response.body) as JsonError;
            } catch {
                json = {};
            }
        }

        return {
            data: JSON.stringify(json),
            headers: JSON.stringify(response.headers),
            json,
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            statusText: json.error ? json.error.message : response.statusText,
        };
    }

    private queryParams(params: { [key: string]: string } = {}): string {
        return Object.keys(params)
            .map((k: string): string => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
            .join("&");
    }
}
