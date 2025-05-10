// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { ConnectionMessage } from "./ConnectionMessage.js";
import { IStringDictionary } from "./IDictionary.js";
import { EventType, PlatformEvent } from "./PlatformEvent.js";

export class ServiceEvent extends PlatformEvent {
    private privJsonResult: string;

    public constructor(eventName: string, jsonstring: string, eventType: EventType = EventType.Info) {
      super(eventName, eventType);
      this.privJsonResult = jsonstring;
    }

    public get jsonString(): string {
        return this.privJsonResult;
    }
}

export class ConnectionEvent extends PlatformEvent {
    private privConnectionId: string;

    public constructor(eventName: string, connectionId: string, eventType: EventType = EventType.Info) {
        super(eventName, eventType);
        this.privConnectionId = connectionId;
    }

    public get connectionId(): string {
        return this.privConnectionId;
    }
}

export class ConnectionStartEvent extends ConnectionEvent {
    private privUri: string;
    private privHeaders: IStringDictionary<string>;

    public constructor(connectionId: string, uri: string, headers?: IStringDictionary<string>) {
        super("ConnectionStartEvent", connectionId);
        this.privUri = uri;
        this.privHeaders = headers;
    }

    public get uri(): string {
        return this.privUri;
    }

    public get headers(): IStringDictionary<string> {
        return this.privHeaders;
    }
}

export class ConnectionEstablishedEvent extends ConnectionEvent {
    public constructor(connectionId: string) {
        super("ConnectionEstablishedEvent", connectionId);
    }
}

export class ConnectionClosedEvent extends ConnectionEvent {
    private privReason: string;
    private privStatusCode: number;

    public constructor(connectionId: string, statusCode: number, reason: string) {
        super("ConnectionClosedEvent", connectionId, EventType.Debug);
        this.privReason = reason;
        this.privStatusCode = statusCode;
    }

    public get reason(): string {
        return this.privReason;
    }

    public get statusCode(): number {
        return this.privStatusCode;
    }
}

export class ConnectionErrorEvent extends ConnectionEvent {
    private readonly privMessage: string;
    private readonly privType: string;

    public constructor(connectionId: string, message: string, type: string) {
        super("ConnectionErrorEvent", connectionId, EventType.Debug);
        this.privMessage = message;
        this.privType = type;
    }

    public get message(): string {
        return this.privMessage;
    }

    public get type(): string {
        return this.privType;
    }
}

export class ConnectionEstablishErrorEvent extends ConnectionEvent {
    private privStatusCode: number;
    private privReason: string;

    public constructor(connectionId: string, statuscode: number, reason: string) {
        super("ConnectionEstablishErrorEvent", connectionId, EventType.Error);
        this.privStatusCode = statuscode;
        this.privReason = reason;
    }

    public get reason(): string {
        return this.privReason;
    }

    public get statusCode(): number {
        return this.privStatusCode;
    }
}

export class ConnectionMessageReceivedEvent extends ConnectionEvent {
    private privNetworkReceivedTime: string;
    private privMessage: ConnectionMessage;

    public constructor(connectionId: string, networkReceivedTimeISO: string, message: ConnectionMessage) {
        super("ConnectionMessageReceivedEvent", connectionId);
        this.privNetworkReceivedTime = networkReceivedTimeISO;
        this.privMessage = message;
    }

    public get networkReceivedTime(): string {
        return this.privNetworkReceivedTime;
    }

    public get message(): ConnectionMessage {
        return this.privMessage;
    }
}

export class ConnectionMessageSentEvent extends ConnectionEvent {
    private privNetworkSentTime: string;
    private privMessage: ConnectionMessage;

    public constructor(connectionId: string, networkSentTimeISO: string, message: ConnectionMessage) {
        super("ConnectionMessageSentEvent", connectionId);
        this.privNetworkSentTime = networkSentTimeISO;
        this.privMessage = message;
    }

    public get networkSentTime(): string {
        return this.privNetworkSentTime;
    }

    public get message(): ConnectionMessage {
        return this.privMessage;
    }
}

export class ConnectionRedirectEvent extends ConnectionEvent {
    private privRedirectUrl: string;
    private privOriginalUrl?: string;
    private privContext?: string;

    public constructor(connectionId: string, redirectUrl: string, originalUrl?: string, context?: string) {
        super("ConnectionRedirectEvent", connectionId, EventType.Info);
        this.privRedirectUrl = redirectUrl;
        this.privOriginalUrl = originalUrl;
        this.privContext = context;
    }

    public get redirectUrl(): string {
        return this.privRedirectUrl;
    }

    public get originalUrl(): string | undefined {
        return this.privOriginalUrl;
    }

    public get context(): string | undefined {
        return this.privContext;
    }
}
