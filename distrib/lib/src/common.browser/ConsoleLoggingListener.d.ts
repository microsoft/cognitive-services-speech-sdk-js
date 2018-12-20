import { EventType, IEventListener, PlatformEvent } from "../common/Exports";
export declare class ConsoleLoggingListener implements IEventListener<PlatformEvent> {
    private privLogLevelFilter;
    constructor(logLevelFilter?: EventType);
    onEvent: (event: PlatformEvent) => void;
    private toString;
}
