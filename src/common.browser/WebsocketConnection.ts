// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
    ConnectionEvent,
    ConnectionMessage,
    ConnectionOpenResponse,
    ConnectionState,
    createNoDashGuid,
    EventSource,
    IConnection,
    IStringDictionary,
    IWebsocketMessageFormatter,
} from "../common/Exports.js";
import { ProxyInfo } from "./ProxyInfo.js";
import { WebsocketMessageAdapter } from "./WebsocketMessageAdapter.js";

export class WebsocketConnection implements IConnection {

    private privUri: string;
    private privMessageFormatter: IWebsocketMessageFormatter;
    private privConnectionMessageAdapter: WebsocketMessageAdapter;
    private privId: string;
    private privIsDisposed: boolean = false;

    public constructor(
        uri: string,
        queryParameters: IStringDictionary<string>,
        headers: IStringDictionary<string>,
        messageFormatter: IWebsocketMessageFormatter,
        proxyInfo: ProxyInfo,
        enableCompression: boolean = false,
        connectionId?: string) {

        if (!uri) {
            throw new ArgumentNullError("uri");
        }

        if (!messageFormatter) {
            throw new ArgumentNullError("messageFormatter");
        }

        this.privMessageFormatter = messageFormatter;

        let queryParams = "";
        let i = 0;

        if (queryParameters) {
            for (const paramName in queryParameters) {
                if (paramName) {
                    queryParams += ((i === 0) && (uri.indexOf("?") === -1)) ? "?" : "&";

                    const key = encodeURIComponent(paramName);
                    queryParams += key;

                    let val = queryParameters[paramName];
                    if (val) {
                        val = encodeURIComponent(val);
                        queryParams += `=${val}`;
                    }

                    i++;
                }
            }
        }

        if (headers) {
            for (const headerName in headers) {
                if (headerName) {
                    queryParams += ((i === 0) && (uri.indexOf("?") === -1)) ? "?" : "&";
                    const val = encodeURIComponent(headers[headerName]);
                    queryParams += `${headerName}=${val}`;
                    i++;
                }
            }
        }

        this.privUri = uri + queryParams;
        this.privId = connectionId ? connectionId : createNoDashGuid();

        this.privConnectionMessageAdapter = new WebsocketMessageAdapter(
            this.privUri,
            this.id,
            this.privMessageFormatter,
            proxyInfo,
            headers,
            enableCompression);
    }

    public async dispose(): Promise<void> {
        this.privIsDisposed = true;

        if (this.privConnectionMessageAdapter) {
            await this.privConnectionMessageAdapter.close();
        }
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public get id(): string {
        return this.privId;
    }

    public get uri(): string {
        return this.privUri;
    }

    public state(): ConnectionState {
        return this.privConnectionMessageAdapter.state;
    }

    public open(): Promise<ConnectionOpenResponse> {
        return this.privConnectionMessageAdapter.open();
    }

    public send(message: ConnectionMessage): Promise<void> {
        return this.privConnectionMessageAdapter.send(message);
    }

    public read(): Promise<ConnectionMessage> {
        return this.privConnectionMessageAdapter.read();
    }

    public get events(): EventSource<ConnectionEvent> {
        return this.privConnectionMessageAdapter.events;
    }
}
