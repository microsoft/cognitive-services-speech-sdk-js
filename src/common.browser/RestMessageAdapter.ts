// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    ConnectionErrorEvent,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionMessageReceivedEvent,
    ConnectionMessageSentEvent,
    ConnectionOpenResponse,
    createNoDashGuid,
    Deferred,
    Events,
    EventSource,
    MessageType,
    Promise,
    PromiseHelper,
    Queue,
} from "../common/Exports";
import { IRequestOptions } from "./Exports";

export enum RestRequestType {
    Get = "get",
    Post = "post",
    Delete = "delete",
    File = "file",
}

export interface IRestResponse {
    ok: boolean;
    status: number;
    statusText: string;
    data: string;
    json: <T>() => T;
    headers: string;
}

interface ISendItem {
    Message: ConnectionMessage;
    RawMessage: XMLHttpRequest;
    sendStatusDeferral: Deferred<boolean>;
}

// accept rest operations via request method and return abstracted objects from server response
export class RestMessageAdapter {

    private privTimeout: number;
    private privIgnoreCache: boolean;
    private privHeaders: { [key: string]: string; };
    private privConnectionEvents: EventSource<ConnectionEvent>;
    private privConnectionId: string;
    private privReceivedQueue: Queue<ConnectionMessage>;
    private privSendQueue: Queue<ISendItem>;

    public constructor(
        configParams: IRequestOptions,
        connectionId?: string
        ) {

        if (!configParams) {
            throw new ArgumentNullError("configParams");
        }

        this.privHeaders = configParams.headers;
        this.privTimeout = configParams.timeout;
        this.privIgnoreCache = configParams.ignoreCache;
        this.privConnectionEvents = new EventSource<ConnectionEvent>();
        this.privConnectionId = connectionId ? connectionId : createNoDashGuid();
    }

    public setHeaders(key: string, value: string ): void {
        this.privHeaders[key] = value;
    }

    public open(): Promise<ConnectionOpenResponse> {
        const responseReceivedDeferral = new Deferred<ConnectionOpenResponse>();
        const ontimeout = () => {
            responseReceivedDeferral.resolve(new ConnectionOpenResponse(200, ""));
        };
        this.privSendQueue = new Queue<ISendItem>();
        setTimeout(ontimeout, 20);
        this.processSendQueue();
        return responseReceivedDeferral.promise();
    }

    public send(message: ConnectionMessage): Promise<boolean> {
        const messageSendStatusDeferral = new Deferred<boolean>();

        const xhr = new XMLHttpRequest();
        const requestCommand = message.headers.method === RestRequestType.File ? "post" : message.headers.method;
        xhr.open(requestCommand, this.withQuery(message.headers.uri, message.headers.queryParams), true);

        if (this.privHeaders) {
            Object.keys(this.privHeaders).forEach((key: any) => xhr.setRequestHeader(key, this.privHeaders[key]));
        }

        if (this.privIgnoreCache) {
            xhr.setRequestHeader("Cache-Control", "no-cache");
        }

        xhr.timeout = this.privTimeout;

        xhr.onload = () => {
            const received = this.xhrResultToMessage(xhr);
            this.privReceivedQueue.enqueue(received);
            this.onEvent(new ConnectionMessageReceivedEvent(this.privConnectionId, new Date().toISOString(), received));
        };

        xhr.onerror = () => {
            this.onEvent(new ConnectionErrorEvent(this.privConnectionId, new Date().toISOString(), "Failed to make request"));
        };

        xhr.ontimeout = () => {
            this.onEvent(new ConnectionErrorEvent(this.privConnectionId, new Date().toISOString(), "Request took longer than expected"));
        };

        this.privSendQueue.enqueue({
            Message: message,
            RawMessage: xhr,
            sendStatusDeferral: messageSendStatusDeferral
        });
        return messageSendStatusDeferral.promise();
    }

    public read = (): Promise<ConnectionMessage> => {
        return this.privReceivedQueue.dequeue();
    }

    public request(
        method: RestRequestType,
        uri: string,
        queryParams: any = {},
        body: any = null,
        ): Promise<IRestResponse> {

        const responseReceivedDeferral = new Deferred<IRestResponse>();

        const xhr = new XMLHttpRequest();
        const requestCommand = method === RestRequestType.File ? "post" : method;
        xhr.open(requestCommand, this.withQuery(uri, queryParams), true);

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

        if (method === RestRequestType.File && body) {
            xhr.setRequestHeader("Content-Type", "multipart/form-data");
            xhr.send(body);
        } else if (method === RestRequestType.Post && body) {
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(body));
        } else {
            xhr.send();
        }

        return responseReceivedDeferral.promise();
    }

    public get events(): EventSource<ConnectionEvent> {
        return this.privConnectionEvents;
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

    private xhrResultToMessage(xhr: XMLHttpRequest): ConnectionMessage {
        return new ConnectionMessage(MessageType.Text, xhr.responseText);
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

    private onEvent = (event: ConnectionEvent): void => {
        this.privConnectionEvents.onEvent(event);
        Events.instance.onEvent(event);
    }

    private processSendQueue = (): void => {
        this.privSendQueue
            .dequeue()
            .on((sendItem: ISendItem) => {
                // indicates we are draining the queue and it came with no message;
                if (!sendItem) {
                    return;
                }

                this.sendXHR(sendItem)
                    .on((result: boolean) => {
                        sendItem.sendStatusDeferral.resolve(result);
                        this.processSendQueue();
                    }, (sendError: string) => {
                        sendItem.sendStatusDeferral.reject(sendError);
                        this.processSendQueue();
                    });
            }, (error: string) => {
                // do nothing
            });
    }

    private sendXHR = (sendItem: ISendItem): Promise<boolean> => {
        try {
            // indicates we are draining the queue and it came with no message;
            if (!sendItem) {
                return PromiseHelper.fromResult(true);
            }
            if (sendItem.Message.headers.method === RestRequestType.File && sendItem.Message.body) {
                sendItem.RawMessage.setRequestHeader("Content-Type", "multipart/form-data");
                sendItem.RawMessage.send(sendItem.Message.body);
            } else if (sendItem.Message.headers.method === RestRequestType.Post && sendItem.Message.body) {
                sendItem.RawMessage.setRequestHeader("Content-Type", "application/json");
                sendItem.RawMessage.send(JSON.stringify(sendItem.Message.body));
            } else {
                sendItem.RawMessage.send();
            }

            this.onEvent(new ConnectionMessageSentEvent(this.privConnectionId, new Date().toISOString(), sendItem.Message));

            return PromiseHelper.fromResult(true);

        } catch (e) {
            return PromiseHelper.fromError<boolean>(`websocket send error: ${e}`);
        }
    }

}
