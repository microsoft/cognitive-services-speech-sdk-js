// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import {
    createNoDashGuid,
    Deferred,
    Events,
    IDetachable,
    IEventSource,
    PlatformEvent,
    Promise,
} from "../common/Exports";
import {
    ConnectingToServiceEvent,
    ListeningStartedEvent,
    RecognitionStartedEvent,
    RecognitionTriggeredEvent,
    SpeechRecognitionEvent,
} from "./RecognitionEvents";
import { ServiceTelemetryListener } from "./ServiceTelemetryListener.Internal";

export class RequestSession {
    private privIsDisposed: boolean = false;
    private privServiceTelemetryListener: ServiceTelemetryListener;
    private privDetachables: IDetachable[] = new Array<IDetachable>();
    private privRequestId: string;
    private privAudioSourceId: string;
    private privAudioNodeId: string;
    private privAudioNode: ReplayableAudioNode;
    private privAuthFetchEventId: string;
    private privIsAudioNodeDetached: boolean = false;
    private privIsRecognizing: boolean = false;
    private privRequestCompletionDeferral: Deferred<boolean>;
    private privIsSpeechEnded: boolean = false;
    private privTurnStartAudioOffset: number = 0;
    private privLastRecoOffset: number = 0;
    private privHypothesisReceived: boolean = false;
    private privBytesSent: number = 0;
    private privRecogNumber: number = 0;
    private privSessionId: string;

    constructor(audioSourceId: string) {
        this.privAudioSourceId = audioSourceId;
        this.privRequestId = createNoDashGuid();
        this.privAudioNodeId = createNoDashGuid();
        this.privRequestCompletionDeferral = new Deferred<boolean>();
    }

    public get sessionId(): string {
        return this.privSessionId;
    }

    public get requestId(): string {
        return this.privRequestId;
    }

    public get audioNodeId(): string {
        return this.privAudioNodeId;
    }

    public get completionPromise(): Promise<boolean> {
        return this.privRequestCompletionDeferral.promise();
    }

    public get isSpeechEnded(): boolean {
        return this.privIsSpeechEnded;
    }

    public get isRecognizing(): boolean {
        return this.privIsRecognizing;
    }

    public get currentTurnAudioOffset(): number {
        return this.privTurnStartAudioOffset;
    }

    public get recogNumber(): number {
        return this.privRecogNumber;
    }

    // The number of bytes sent for the current connection.
    // Counter is reset to 0 each time a connection is established.
    public get bytesSent(): number {
        return this.privBytesSent;
    }
    public listenForServiceTelemetry(eventSource: IEventSource<PlatformEvent>): void {
        if (!!this.privServiceTelemetryListener) {
            this.privDetachables.push(eventSource.attachListener(this.privServiceTelemetryListener));
        }
    }

    public startNewRecognition(): void {
        this.privIsSpeechEnded = false;
        this.privIsRecognizing = true;
        this.privTurnStartAudioOffset = 0;
        this.privLastRecoOffset = 0;
        this.privRequestId = createNoDashGuid();
        this.privRecogNumber++;
        this.privServiceTelemetryListener = new ServiceTelemetryListener(this.privRequestId, this.privAudioSourceId, this.privAudioNodeId);
        this.onEvent(new RecognitionTriggeredEvent(this.requestId, this.privSessionId, this.privAudioSourceId, this.privAudioNodeId));
    }

    public onAudioSourceAttachCompleted = (audioNode: ReplayableAudioNode, isError: boolean, error?: string): void => {
        this.privAudioNode = audioNode;

        if (isError) {
            this.onComplete();
        } else {
            this.onEvent(new ListeningStartedEvent(this.privRequestId, this.privSessionId, this.privAudioSourceId, this.privAudioNodeId));
        }
    }

    public onPreConnectionStart = (authFetchEventId: string, connectionId: string): void => {
        this.privAuthFetchEventId = authFetchEventId;
        this.privSessionId = connectionId;
        this.onEvent(new ConnectingToServiceEvent(this.privRequestId, this.privAuthFetchEventId, this.privSessionId));
    }

    public onAuthCompleted = (isError: boolean, error?: string): void => {
        if (isError) {
            this.onComplete();
        }
    }

    public onConnectionEstablishCompleted = (statusCode: number, reason?: string): void => {
        if (statusCode === 200) {
            this.onEvent(new RecognitionStartedEvent(this.requestId, this.privAudioSourceId, this.privAudioNodeId, this.privAuthFetchEventId, this.privSessionId));
            if (!!this.privAudioNode) {
                this.privAudioNode.replay();
            }
            this.privTurnStartAudioOffset = this.privLastRecoOffset;
            this.privBytesSent = 0;
            return;
        } else if (statusCode === 403) {
            this.onComplete();
        }
    }

    public onServiceTurnEndResponse = (continuousRecognition: boolean): void => {
        if (!continuousRecognition || this.isSpeechEnded) {
            this.onComplete();
        } else {
            // Start a new request set.
            this.privTurnStartAudioOffset = this.privLastRecoOffset;
            this.privRequestId = createNoDashGuid();
            this.privAudioNode.replay();
        }
    }

    public onHypothesis(offset: number): void {
        if (!this.privHypothesisReceived) {
            this.privHypothesisReceived = true;
            this.privServiceTelemetryListener.hypothesisReceived(this.privAudioNode.findTimeAtOffset(offset));
        }
    }

    public onPhraseRecognized(offset: number): void {
        this.privServiceTelemetryListener.phraseReceived(this.privAudioNode.findTimeAtOffset(offset));
        this.onServiceRecognized(offset);
    }

    public onServiceRecognized(offset: number): void {
        this.privLastRecoOffset = offset;
        this.privHypothesisReceived = false;
        this.privAudioNode.shrinkBuffers(offset);
    }

    public onAudioSent(bytesSent: number): void {
        this.privBytesSent += bytesSent;
    }

    public dispose = (error?: string): void => {
        if (!this.privIsDisposed) {
            // we should have completed by now. If we did not its an unknown error.
            this.privIsDisposed = true;
            for (const detachable of this.privDetachables) {
                detachable.detach();
            }

            this.privServiceTelemetryListener.dispose();
        }
    }

    public getTelemetry = (): string => {
        if (this.privServiceTelemetryListener.hasTelemetry) {
            return this.privServiceTelemetryListener.getTelemetry();
        } else {
            return null;
        }
    }

    public onStopRecognizing(): void {
        this.onComplete();
    }

    // Should be called with the audioNode for this session has indicated that it is out of speech.
    public onSpeechEnded(): void {
        this.privIsSpeechEnded = true;
    }

    protected onEvent = (event: SpeechRecognitionEvent): void => {
        if (!!this.privServiceTelemetryListener) {
            this.privServiceTelemetryListener.onEvent(event);
        }
        Events.instance.onEvent(event);
    }

    private onComplete = (): void => {
        if (!!this.privIsRecognizing) {
            this.privIsRecognizing = false;
            this.detachAudioNode();
        }
    }

    private detachAudioNode = (): void => {
        if (!this.privIsAudioNodeDetached) {
            this.privIsAudioNodeDetached = true;
            if (this.privAudioNode) {
                this.privAudioNode.detach();
            }
        }
    }
}
