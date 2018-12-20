import { IEventListener, PlatformEvent } from "../common/Exports";
export declare class ServiceTelemetryListener implements IEventListener<PlatformEvent> {
    private privIsDisposed;
    private privRequestId;
    private privAudioSourceId;
    private privAudioNodeId;
    private privListeningTriggerMetric;
    private privMicMetric;
    private privConnectionEstablishMetric;
    private privMicStartTime;
    private privConnectionId;
    private privConnectionStartTime;
    private privReceivedMessages;
    constructor(requestId: string, audioSourceId: string, audioNodeId: string);
    onEvent: (e: PlatformEvent) => void;
    getTelemetry: () => string;
    dispose: () => void;
    private getConnectionError;
}
