// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import bent, { BentResponse, RequestBody } from "bent";
import {
    ArgumentNullError,
    Deferred
} from "../common/Exports.js";
import { IRequestOptions } from "./Exports.js";

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

// accept rest operations via request method and return abstracted objects from server response
export class RestMessageAdapter {

    private privIgnoreCache: boolean;
    private privHeaders: { [key: string]: string };

    public constructor(
        configParams: IRequestOptions
        ) {

        if (!configParams) {
            throw new ArgumentNullError("configParams");
        }

        this.privHeaders = configParams.headers;
        this.privIgnoreCache = configParams.ignoreCache;
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
    }

    public setHeaders(key: string, value: string): void {
        this.privHeaders[key] = value;
    }

    public request(
        method: RestRequestType,
        uri: string,
        queryParams: { [key: string]: any } = {},
        body: any = null,
        ): Promise<IRestResponse> {

        const responseReceivedDeferral = new Deferred<IRestResponse>();

        const requestCommand = method === RestRequestType.File ? "POST" : method;
        const handleRestResponse = (data: BentResponse, j: JsonError = {}): IRestResponse => {
            const d: { statusText?: string; statusMessage?: string } = data;
            return {
                data: JSON.stringify(j),
                headers: JSON.stringify(data.headers),
                json: j,
                ok: data.statusCode >= 200 && data.statusCode < 300,
                status: data.statusCode,
                statusText: j.error ? j.error.message : d.statusText ? d.statusText : d.statusMessage
            };
        };

        const send = (postData: RequestBody): void => {
            const sendRequest = bent(uri, requestCommand, this.privHeaders, 200, 201, 202, 204, 400, 401, 402, 403, 404);
            const params = this.queryParams(queryParams) === "" ? "" : `?${this.queryParams(queryParams)}`;
            sendRequest(params, postData).then( async (data: BentResponse): Promise<void> => {
                if (method === RestRequestType.Delete || data.statusCode === 204) {
                    // No JSON from Delete and reset (204) operations
                    responseReceivedDeferral.resolve(handleRestResponse(data));
                } else {
                    try {
                        const j: JsonError = await data.json() as JsonError;
                        responseReceivedDeferral.resolve(handleRestResponse(data, j));
                    } catch {
                        responseReceivedDeferral.resolve(handleRestResponse(data));
                    }
                }
            }).catch((error: string): void => {
                responseReceivedDeferral.reject(error);
            });
        };

        if (this.privIgnoreCache) {
            this.privHeaders["Cache-Control"] = "no-cache";
        }

        if (method === RestRequestType.Post && body) {
            this.privHeaders["content-type"] = "application/json";
            this.privHeaders["Content-Type"] = "application/json";
        }
        send(body as RequestBody);
        return responseReceivedDeferral.promise;
    }

    private queryParams(params: { [key: string]: string } = {}): string {
        return Object.keys(params)
            .map((k: string): string => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
            .join("&");
    }
}
