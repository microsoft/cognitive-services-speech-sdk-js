// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    Deferred,
    Promise,
} from "../common/Exports";
import { IRequestOptions } from "./Exports";

export enum RestRequestType {
    Get = "get",
    Post = "post",
    Delete = "delete",
}

export interface IRestResponse {
    ok: boolean;
    status: number;
    statusText: string;
    data: string;
    json: <T>() => T;
    headers: string;
}

// accept rest operations via request method and return abstracted objects from server response
export class RestMessageAdapter {

    private privTimeout: number;
    private privIgnoreCache: boolean;
    private privHeaders: { [key: string]: string; };

    public constructor(
        configParams: IRequestOptions,
        ) {

        if (!configParams) {
            throw new ArgumentNullError("configParams");
        }

        this.privHeaders = configParams.headers;
        this.privTimeout = configParams.timeout;
        this.privIgnoreCache = configParams.ignoreCache;
    }

    public request(
        method: RestRequestType,
        uri: string,
        queryParams: any = {},
        body: any = null,
        ): Promise<IRestResponse> {

        const responseReceivedDeferral = new Deferred<IRestResponse>();

        const xhr = new XMLHttpRequest();
        xhr.open(method, this.withQuery(uri, queryParams), true);

        if (this.privHeaders) {
            Object.keys(this.privHeaders).forEach((key: any) => xhr.setRequestHeader(key, this.privHeaders[key]));
        }

        if (this.privIgnoreCache) {
            xhr.setRequestHeader("Cache-Control", "no-cache");
        }

        xhr.timeout = this.privTimeout;

        xhr.onload = () => {
            responseReceivedDeferral.resolve(this.parseXHRResult(xhr));
        };

        xhr.onerror = () => {
            responseReceivedDeferral.resolve(this.errorResponse(xhr, "Failed to make request."));
        };

        xhr.ontimeout = () => {
            responseReceivedDeferral.resolve(this.errorResponse(xhr, "Request took longer than expected."));
        };

        if (method === "post" && body) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(body));
        } else {
            xhr.send();
        }

        return responseReceivedDeferral.promise();
    }

    private parseXHRResult(xhr: XMLHttpRequest): IRestResponse {
        return {
            data: xhr.responseText,
            headers: xhr.getAllResponseHeaders(),
            json: <T>() => JSON.parse(xhr.responseText) as T,
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
        };
    }

    private errorResponse(xhr: XMLHttpRequest, message: string | null = null): IRestResponse {
        return {
            data: message || xhr.statusText,
            headers: xhr.getAllResponseHeaders(),
            json: <T>() => JSON.parse(message || ("\"" + xhr.statusText + "\"")) as T,
            ok: false,
            status: xhr.status,
            statusText: xhr.statusText,
        };
    }

    private withQuery(url: string, params: any = {}): any {
        const queryString = this.queryParams(params);
        return queryString ? url + (url.indexOf("?") === -1 ? "?" : "&") + queryString : url;
    }

    private queryParams(params: any = {}): any {
        return Object.keys(params)
            .map((k: any) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
            .join("&");
    }
}
