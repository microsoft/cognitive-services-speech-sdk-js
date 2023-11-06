// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createNoDashGuid } from "./Guid.js";
import { IStringDictionary } from "./IDictionary.js";

export enum EventType {
    Debug,
    Info,
    Warning,
    Error,
    None,
}

export class PlatformEvent {
    private privName: string;
    private privEventId: string;
    private privEventTime: string;
    private privEventType: EventType;
    private privMetadata: IStringDictionary<string>;

    public constructor(eventName: string, eventType: EventType) {
        this.privName = eventName;
        this.privEventId = createNoDashGuid();
        this.privEventTime = new Date().toISOString();
        this.privEventType = eventType;
        this.privMetadata = { };
    }

    public get name(): string {
        return this.privName;
    }

    public get eventId(): string {
        return this.privEventId;
    }

    public get eventTime(): string {
        return this.privEventTime;
    }

    public get eventType(): EventType {
        return this.privEventType;
    }

    public get metadata(): IStringDictionary<string> {
        return this.privMetadata;
    }
}
