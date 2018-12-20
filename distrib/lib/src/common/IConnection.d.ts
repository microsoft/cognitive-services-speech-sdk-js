import { ConnectionEvent } from "./ConnectionEvents";
import { ConnectionMessage } from "./ConnectionMessage";
import { ConnectionOpenResponse } from "./ConnectionOpenResponse";
import { EventSource } from "./EventSource";
import { IDisposable } from "./IDisposable";
import { Promise } from "./Promise";
export declare enum ConnectionState {
    None = 0,
    Connected = 1,
    Connecting = 2,
    Disconnected = 3
}
export interface IConnection extends IDisposable {
    id: string;
    state(): ConnectionState;
    open(): Promise<ConnectionOpenResponse>;
    send(message: ConnectionMessage): Promise<boolean>;
    read(): Promise<ConnectionMessage>;
    events: EventSource<ConnectionEvent>;
}
