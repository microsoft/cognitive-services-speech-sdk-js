import { ConnectionMessage } from "./ConnectionMessage";
import { IStringDictionary } from "./IDictionary";
import { EventType, PlatformEvent } from "./PlatformEvent";
export declare class ConnectionEvent extends PlatformEvent {
    private privConnectionId;
    constructor(eventName: string, connectionId: string, eventType?: EventType);
    readonly connectionId: string;
}
export declare class ConnectionStartEvent extends ConnectionEvent {
    private privUri;
    private privHeaders;
    constructor(connectionId: string, uri: string, headers?: IStringDictionary<string>);
    readonly uri: string;
    readonly headers: IStringDictionary<string>;
}
export declare class ConnectionEstablishedEvent extends ConnectionEvent {
    constructor(connectionId: string, metadata?: IStringDictionary<string>);
}
export declare class ConnectionClosedEvent extends ConnectionEvent {
    private privRreason;
    private privStatusCode;
    constructor(connectionId: string, statusCode: number, reason: string);
    readonly reason: string;
    readonly statusCode: number;
}
export declare class ConnectionEstablishErrorEvent extends ConnectionEvent {
    private privStatusCode;
    private privReason;
    constructor(connectionId: string, statuscode: number, reason: string);
    readonly reason: string;
    readonly statusCode: number;
}
export declare class ConnectionMessageReceivedEvent extends ConnectionEvent {
    private privNetworkReceivedTime;
    private privMessage;
    constructor(connectionId: string, networkReceivedTimeISO: string, message: ConnectionMessage);
    readonly networkReceivedTime: string;
    readonly message: ConnectionMessage;
}
export declare class ConnectionMessageSentEvent extends ConnectionEvent {
    private privNetworkSentTime;
    private privMessage;
    constructor(connectionId: string, networkSentTimeISO: string, message: ConnectionMessage);
    readonly networkSentTime: string;
    readonly message: ConnectionMessage;
}
