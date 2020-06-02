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
    Promise,
} from "../common/Exports";
import { IRequestOptions, RestConfigBase, RestMessageAdapter } from "./Exports";

export class RestConnection implements IConnection {
    private privId: string;
    private privMessageAdapter: RestMessageAdapter;
    private privIsDisposed: boolean = false;

    public constructor(
        connectionId?: string) {
        this.privId = connectionId ? connectionId : createNoDashGuid();
        const options: IRequestOptions = RestConfigBase.requestOptions;
        this.privMessageAdapter = new RestMessageAdapter(options);
    }

    public dispose = (): void => {
        this.privIsDisposed = true;
        // No persistent connection for REST
    }

    public isDisposed = (): boolean => {
        return this.privIsDisposed;
    }

    public get id(): string {
        return this.privId;
    }

    // REST connections are not persistent
    public state = (): ConnectionState => {
        return ConnectionState.Connected;
    }

    public open = (): Promise<ConnectionOpenResponse> => {
        return this.privMessageAdapter.open();
    }

    public send = (message: ConnectionMessage): Promise<boolean> => {
        return this.privMessageAdapter.send(message);
    }

    public read = (): Promise<ConnectionMessage> => {
        return this.privMessageAdapter.read();
    }

    public get events(): EventSource<ConnectionEvent> {
        return this.privMessageAdapter.events;
    }
}
