// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IRequestOptions, IResponse } from "./ConversationTranslatorInterfaces";

/**
 * Config settings for Conversation Translator
 */
export const ConversationTranslatorConfig = {
    apiVersion: "2.0",
    auth: {
        placeholderRegion: "westus",
        placeholderSubscriptionKey: "abcdefghijklmnopqrstuvwxyz012345",
    },
    clientAppId: "FC539C22-1767-4F1F-84BC-B4D811114F15",
    defaultLanguageCode: "en-US",
    defaultRequestOptions: {
    headers: {
        Accept: "application/json",
    },
    ignoreCache: false,
    timeout: 5000,
    },
    host: "dev.microsofttranslator.com",
    params: {
        apiVersion: "api-version",
        clientAppId: "X-ClientAppId",
        correlationId: "X-CorrelationId",
        languageCode: "language",
        nickname: "nickname",
        profanity: "profanity",
        requestId: "x-requestid",
        roomId: "roomid",
        sessionToken: "token",
        subscriptionKey: "Ocp-Apim-Subscription-Key",
        subscriptionRegion: "Ocp-Apim-Subscription-Region",
        token: "X-CapitoToken",
    },
    restPath: "/capito/room",
    speechHost: "{region}.s2s.speech.microsoft.com",
    speechPath: "/speech/translation/cognitiveservices/v1",
    strings: {
        invalidArgs: "Required input not found: {arg}.",
        invalidParticipantRequest: "The requested participant was not found.",
        permissionDeniedConnect: "Required credentials not found.",
        permissionDeniedConversation: "Invalid operation: only the host can {command} the conversation.",
        permissionDeniedParticipant: "Invalid operation: only the host can {command} a participant.",
        permissionDeniedSend: "Invalid operation: the conversation is not in a connected state.",
        permissionDeniedStart: "Invalid operation: there is already an active conversation.",
    },
    textMessageMaxLength: 1000,
    webSocketPath: "/capito/translate"
};

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

function parseXHRResult(xhr: XMLHttpRequest): IResponse {
    return {
        data: xhr.responseText,
        headers: xhr.getAllResponseHeaders(),
        json: <T>() => JSON.parse(xhr.responseText) as T,
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
    };
}

function errorResponse(xhr: XMLHttpRequest, message: string | null = null): IResponse {
    return {
        data: message || xhr.statusText,
        headers: xhr.getAllResponseHeaders(),
        json: <T>() => JSON.parse(message || xhr.statusText) as T,
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

      headerValue = headerMap[headerKey];
    } catch (e) {
      // ignore the error
    }

    return headerValue;
}

export function request(method: "get" | "post" | "delete",
                        url: string,
                        queryParams: any = {},
                        body: any = null,
                        options: IRequestOptions = ConversationTranslatorConfig.defaultRequestOptions,
                        callback: any): any {

    const ignoreCache = options.ignoreCache || ConversationTranslatorConfig.defaultRequestOptions.ignoreCache;
    const headers = options.headers || ConversationTranslatorConfig.defaultRequestOptions.headers;
    const timeout = options.timeout || ConversationTranslatorConfig.defaultRequestOptions.timeout;

    const xhr = new XMLHttpRequest();
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
