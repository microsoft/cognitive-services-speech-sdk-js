import { IStringDictionary } from "./IDictionary";
export declare enum EventType {
    Debug = 0,
    Info = 1,
    Warning = 2,
    Error = 3
}
export declare class PlatformEvent {
    private privName;
    private privEventId;
    private privEventTime;
    private privEventType;
    private privMetadata;
    constructor(eventName: string, eventType: EventType);
    readonly name: string;
    readonly eventId: string;
    readonly eventTime: string;
    readonly eventType: EventType;
    readonly metadata: IStringDictionary<string>;
}
