// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports.js";
import {
    createNoDashGuid,
    Deferred,
    Events,
    IDetachable,
    IEventSource,
    PlatformEvent
} from "../common/Exports.js";
import {
    ConnectingToServiceEvent,
    ListeningStartedEvent,
    RecognitionStartedEvent,
    RecognitionTriggeredEvent,
    SpeechRecognitionEvent,
} from "./RecognitionEvents.js";
import { ServiceTelemetryListener } from "./ServiceTelemetryListener.Internal.js";

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
    private privIsSpeechEnded: boolean = false;
    private privTurnStartAudioOffset: number = 0;
    private privLastRecoOffset: number = 0;
    private privHypothesisReceived: boolean = false;
    private privBytesSent: number = 0;
    private privRecognitionBytesSent: number = 0;
    private privRecogNumber: number = 0;
    private privSessionId: string;
    private privTurnDeferral: Deferred<void>;
    private privInTurn: boolean = false;
    private privConnectionAttempts: number = 0;

    public constructor(audioSourceId: string) {
        this.privAudioSourceId = audioSourceId;
        this.privRequestId = createNoDashGuid();
        this.privAudioNodeId = createNoDashGuid();
        this.privTurnDeferral = new Deferred<void>();

        // We're not in a turn, so resolve.
        this.privTurnDeferral.resolve();
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

    public get turnCompletionPromise(): Promise<void> {
        return this.privTurnDeferral.promise;
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

    public get numConnectionAttempts(): number {
        return this.privConnectionAttempts;
    }

    // The number of bytes sent for the current connection.
    // Counter is reset to 0 each time a connection is established.
    public get bytesSent(): number {
        return this.privBytesSent;
    }

    // The number of bytes sent for the current recognition.
    // Counter is reset to 0 each time recognition is started.
    public get recognitionBytesSent(): number {
        return this.privRecognitionBytesSent;
    }

    public listenForServiceTelemetry(eventSource: IEventSource<PlatformEvent>): void {
        if (!!this.privServiceTelemetryListener) {
            this.privDetachables.push(eventSource.attachListener(this.privServiceTelemetryListener));
        }
    }

    public startNewRecognition(): void {
        this.privRecognitionBytesSent = 0;
        this.privIsSpeechEnded = false;
        this.privIsRecognizing = true;
        this.privTurnStartAudioOffset = 0;
        this.privLastRecoOffset = 0;
        this.privRecogNumber++;
        this.privServiceTelemetryListener = new ServiceTelemetryListener(this.privRequestId, this.privAudioSourceId, this.privAudioNodeId);
        this.onEvent(new RecognitionTriggeredEvent(this.requestId, this.privSessionId, this.privAudioSourceId, this.privAudioNodeId));
    }

    public async onAudioSourceAttachCompleted(audioNode: ReplayableAudioNode, isError: boolean): Promise<void> {
        this.privAudioNode = audioNode;
        this.privIsAudioNodeDetached = false;

        if (isError) {
            await this.onComplete();
        } else {
            this.onEvent(new ListeningStartedEvent(this.privRequestId, this.privSessionId, this.privAudioSourceId, this.privAudioNodeId));
        }
    }

    public onPreConnectionStart(authFetchEventId: string, connectionId: string): void {
        this.privAuthFetchEventId = authFetchEventId;
        this.privSessionId = connectionId;
        this.onEvent(new ConnectingToServiceEvent(this.privRequestId, this.privAuthFetchEventId, this.privSessionId));
    }

    public async onAuthCompleted(isError: boolean): Promise<void> {
        if (isError) {
            await this.onComplete();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async onConnectionEstablishCompleted(statusCode: number, reason?: string): Promise<void> {
        if (statusCode === 200) {
            this.onEvent(new RecognitionStartedEvent(this.requestId, this.privAudioSourceId, this.privAudioNodeId, this.privAuthFetchEventId, this.privSessionId));
            if (!!this.privAudioNode) {
                this.privAudioNode.replay();
            }
            this.privTurnStartAudioOffset = this.privLastRecoOffset;
            this.privBytesSent = 0;
            return;
        } else if (statusCode === 403) {
            await this.onComplete();
        }
    }

    public async onServiceTurnEndResponse(continuousRecognition: boolean): Promise<void> {
        this.privTurnDeferral.resolve();

        if (!continuousRecognition || this.isSpeechEnded) {
            await this.onComplete();
            this.privInTurn = false;
        } else {
            // Start a new request set.
            this.privTurnStartAudioOffset = this.privLastRecoOffset;
            this.privAudioNode.replay();
        }
    }

    public onSpeechContext(): void {
        this.privRequestId = createNoDashGuid();
    }

    public onServiceTurnStartResponse(): void {
        if (!!this.privTurnDeferral && !!this.privInTurn) {
            // What? How are we starting a turn with another not done?
            this.privTurnDeferral.reject("Another turn started before current completed.");
            // Avoid UnhandledPromiseRejection if privTurnDeferral is not being awaited
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this.privTurnDeferral.promise.then().catch((): void => { });
        }
        this.privInTurn = true;
        this.privTurnDeferral = new Deferred<void>();
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
        this.privConnectionAttempts = 0;
    }

    public onAudioSent(bytesSent: number): void {
        this.privBytesSent += bytesSent;
        this.privRecognitionBytesSent += bytesSent;
    }

    public onRetryConnection(): void {
        this.privConnectionAttempts++;
    }

    public async dispose(): Promise<void> {
        if (!this.privIsDisposed) {
            // we should have completed by now. If we did not its an unknown error.
            this.privIsDisposed = true;
            for (const detachable of this.privDetachables) {
                await detachable.detach();
            }

            if (!!this.privServiceTelemetryListener) {
                this.privServiceTelemetryListener.dispose();
            }
            this.privIsRecognizing = false;
        }
    }

    public getTelemetry(): string {
        if (this.privServiceTelemetryListener.hasTelemetry) {
            return this.privServiceTelemetryListener.getTelemetry();
        } else {
            return null;
        }
    }

    public async onStopRecognizing(): Promise<void> {
        await this.onComplete();
    }

    // Should be called with the audioNode for this session has indicated that it is out of speech.
    public onSpeechEnded(): void {
        this.privIsSpeechEnded = true;
    }

    protected onEvent(event: SpeechRecognitionEvent): void {
        if (!!this.privServiceTelemetryListener) {
            this.privServiceTelemetryListener.onEvent(event);
        }
        Events.instance.onEvent(event);
    }

    private async onComplete(): Promise<void> {
        if (!!this.privIsRecognizing) {
            this.privIsRecognizing = false;
            await this.detachAudioNode();
        }
    }

    private async detachAudioNode(): Promise<void> {
        if (!this.privIsAudioNodeDetached) {
            this.privIsAudioNodeDetached = true;
            if (this.privAudioNode) {
                await this.privAudioNode.detach();
            }
        }
    }
}
