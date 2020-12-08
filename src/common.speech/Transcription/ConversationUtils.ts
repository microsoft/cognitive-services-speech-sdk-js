// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IResponse } from "./ConversationTranslatorInterfaces";

import { IRequestOptions, RestConfigBase } from "../../common.browser/RestConfigBase";
import { Callback } from "../../sdk/Transcription/IConversation";

// Node.JS specific xmlhttprequest / browser support.
import * as XHR from "xmlhttprequest-ts";

/**
 * Config settings for Conversation Translator
 */
/**
 * Helpers for sending / receiving HTTPS requests / responses.
 * @param params
 */
function queryParams(params: any = {}): any {
    return Object.keys(params)
        .map((k: any) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
        .join("&");
}

function withQuery(url: string, params: any = {}): any {
    const queryString = queryParams(params);
    return queryString ? url + (url.indexOf("?") === -1 ? "?" : "&") + queryString : url;
}

function parseXHRResult(xhr: XMLHttpRequest | XHR.XMLHttpRequest): IResponse {
    return {
        data: xhr.responseText,
        headers: xhr.getAllResponseHeaders(),
        json: <T>() => JSON.parse(xhr.responseText) as T,
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
    };
}

function errorResponse(xhr: XMLHttpRequest | XHR.XMLHttpRequest, message: string | null = null): IResponse {
    return {
        data: message || xhr.statusText,
        headers: xhr.getAllResponseHeaders(),
        json: <T>() => JSON.parse(message || ("\"" + xhr.statusText + "\"")) as T,
        ok: false,
        status: xhr.status,
        statusText: xhr.statusText,
    };
}

export function extractHeaderValue(headerKey: string, headers: string): string {

    let headerValue: string = "";

    try {
        const arr = headers.trim().split(/[\r\n]+/);
        const headerMap: any = {};
        arr.forEach((line: any) => {
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

export function request(
    method: "get" | "post" | "delete",
    url: string,
    queryParams: any = {},
    body: any = null,
    options: IRequestOptions = {},
    callback: any): any {

    const defaultRequestOptions = RestConfigBase.requestOptions;

    const ignoreCache = options.ignoreCache || defaultRequestOptions.ignoreCache;
    const headers = options.headers || defaultRequestOptions.headers;
    const timeout = options.timeout || defaultRequestOptions.timeout;

    let xhr: XMLHttpRequest | XHR.XMLHttpRequest;
    if (typeof window === "undefined") { // Node
        xhr = new XHR.XMLHttpRequest();

    } else {
        xhr = new XMLHttpRequest();
    }
    xhr.open(method, withQuery(url, queryParams), true);

    if (headers) {
        Object.keys(headers).forEach((key: any) => xhr.setRequestHeader(key, headers[key]));
    }

    if (ignoreCache) {
        xhr.setRequestHeader("Cache-Control", "no-cache");
    }

    xhr.timeout = timeout;

    xhr.onload = (evt: any) => {
        callback(parseXHRResult(xhr));
    };

    xhr.onerror = (evt: any) => {
        callback(errorResponse(xhr, "Failed to make request."));
    };

    xhr.ontimeout = (evt: any) => {
        callback(errorResponse(xhr, "Request took longer than expected."));
    };

    if (method === "post" && body) {
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(body));
    } else {
        xhr.send();
    }
}

export function PromiseToEmptyCallback<T>(promise: Promise<T>, cb?: Callback, err?: Callback): void {
    if (!!promise) {
        promise.then((result: T): void => {
            try {
                if (!!cb) {
                    cb();
                }
            } catch (e) {
                if (!!err) {
                    err(`'Unhandled error on promise callback: ${e}'`);
                }
            }
        }, (reason: any) => {
            try {
                if (!!err) {
                    err(reason);
                }
                /* tslint:disable:no-empty */
            } catch (error) {
            }
        });
    } else {
        if (!!err) {
            err("Null promise");
        }
    }
}
