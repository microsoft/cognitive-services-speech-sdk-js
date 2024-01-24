// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConnectionEvent } from "./ConnectionEvents.js";
import { ConnectionMessage } from "./ConnectionMessage.js";
import { ConnectionOpenResponse } from "./ConnectionOpenResponse.js";
import { EventSource } from "./EventSource.js";

export enum ConnectionState {
    None,
    Connected,
    Connecting,
    Disconnected,
}

export interface IConnection {
    id: string;
    state(): ConnectionState;
    open(): Promise<ConnectionOpenResponse>;
    send(message: ConnectionMessage): Promise<void>;
    read(): Promise<ConnectionMessage>;
    events: EventSource<ConnectionEvent>;
    dispose(disposing?: string): Promise<void>;
}
