import { EventType, PlatformEvent } from "./PlatformEvent";
export declare class AudioSourceEvent extends PlatformEvent {
    private privAudioSourceId;
    constructor(eventName: string, audioSourceId: string, eventType?: EventType);
    readonly audioSourceId: string;
}
export declare class AudioSourceInitializingEvent extends AudioSourceEvent {
    constructor(audioSourceId: string);
}
export declare class AudioSourceReadyEvent extends AudioSourceEvent {
    constructor(audioSourceId: string);
}
export declare class AudioSourceOffEvent extends AudioSourceEvent {
    constructor(audioSourceId: string);
}
export declare class AudioSourceErrorEvent extends AudioSourceEvent {
    private privError;
    constructor(audioSourceId: string, error: string);
    readonly error: string;
}
export declare class AudioStreamNodeEvent extends AudioSourceEvent {
    private privAudioNodeId;
    constructor(eventName: string, audioSourceId: string, audioNodeId: string);
    readonly audioNodeId: string;
}
export declare class AudioStreamNodeAttachingEvent extends AudioStreamNodeEvent {
    constructor(audioSourceId: string, audioNodeId: string);
}
export declare class AudioStreamNodeAttachedEvent extends AudioStreamNodeEvent {
    constructor(audioSourceId: string, audioNodeId: string);
}
export declare class AudioStreamNodeDetachedEvent extends AudioStreamNodeEvent {
    constructor(audioSourceId: string, audioNodeId: string);
}
export declare class AudioStreamNodeErrorEvent extends AudioStreamNodeEvent {
    private privError;
    constructor(audioSourceId: string, audioNodeId: string, error: string);
    readonly error: string;
}
