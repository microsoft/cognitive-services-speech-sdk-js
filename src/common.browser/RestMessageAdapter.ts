// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    Deferred
} from "../common/Exports";
import { IRequestOptions } from "./Exports";

import bent, { BentResponse } from "bent";

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

// accept rest operations via request method and return abstracted objects from server response
export class RestMessageAdapter {

    private privIgnoreCache: boolean;
    private privHeaders: { [key: string]: string; };

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

    public set options(configParams: IRequestOptions) {
        this.privHeaders = configParams.headers;
        this.privIgnoreCache = configParams.ignoreCache;
    }

    public setHeaders(key: string, value: string ): void {
        this.privHeaders[key] = value;
    }

    public request(
        method: RestRequestType,
        uri: string,
        queryParams: any = {},
        body: any = null,
        binaryBody: Blob | Buffer = null,
        ): Promise<IRestResponse> {

        const responseReceivedDeferral = new Deferred<IRestResponse>();

        const requestCommand = method === RestRequestType.File ? "POST" : method;
        const handleRestResponse = (data: BentResponse, j: any = {}): IRestResponse => {
            const d: { statusText?: string, statusMessage?: string } = data;
            return {
                data: JSON.stringify(j),
                headers: JSON.stringify(data.headers),
                json: j,
                ok: data.statusCode >= 200 && data.statusCode < 300,
                status: data.statusCode,
                statusText: j.error ? j.error.message : d.statusText ? d.statusText : d.statusMessage
            };
        };

        const blobToArrayBuffer = (blob: Blob) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(blob);
            return new Promise((resolve: (value: unknown) => void) => {
                reader.onloadend = () => {
                resolve(reader.result);
                };
            });
        };

        const send = (postData: any): void => {
            const sendRequest = bent(uri, requestCommand, this.privHeaders, 200, 201, 202, 204, 400, 401, 402, 403, 404);
            const params = this.queryParams(queryParams) === "" ? "" : "?" + this.queryParams(queryParams);
            sendRequest(params, postData).then( async (data: any) => {
                if (method === RestRequestType.Delete || data.statusCode === 204) {
                    // No JSON from Delete and reset (204) operations
                    responseReceivedDeferral.resolve(handleRestResponse(data));
                } else {
                    const j: any = await data.json();
                    responseReceivedDeferral.resolve(handleRestResponse(data, j));
                }
            }).catch((error: string) => {
                responseReceivedDeferral.reject(error);
            });
        };

        if (this.privIgnoreCache) {
            this.privHeaders["Cache-Control"] = "no-cache";
        }

        if (method === RestRequestType.File && binaryBody) {
            const contentType = "multipart/form-data";
            this.privHeaders["content-type"] = contentType;
            this.privHeaders["Content-Type"] = contentType;
            if (typeof (Blob) !== "undefined" && binaryBody instanceof Blob) {
                blobToArrayBuffer(binaryBody as Blob).then( (res: any) => {
                    send(res);
                }).catch((error: any) => {
                    responseReceivedDeferral.reject(error);
                });
            } else {
                send(binaryBody as Buffer);
            }
        } else {
            if (method === RestRequestType.Post && body) {
                this.privHeaders["content-type"] = "application/json";
                this.privHeaders["Content-Type"] = "application/json";
            }
            send(body);
        }
        return responseReceivedDeferral.promise;
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
