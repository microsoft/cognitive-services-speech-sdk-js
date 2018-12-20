import { IDetachable } from "./IDetachable";
import { IStringDictionary } from "./IDictionary";
import { IEventListener, IEventSource } from "./IEventSource";
import { PlatformEvent } from "./PlatformEvent";
export declare class EventSource<TEvent extends PlatformEvent> implements IEventSource<TEvent> {
    private privEventListeners;
    private privMetadata;
    private privIsDisposed;
    constructor(metadata?: IStringDictionary<string>);
    onEvent: (event: TEvent) => void;
    attach: (onEventCallback: (event: TEvent) => void) => IDetachable;
    attachListener: (listener: IEventListener<TEvent>) => IDetachable;
    isDisposed: () => boolean;
    dispose: () => void;
    readonly metadata: IStringDictionary<string>;
}
