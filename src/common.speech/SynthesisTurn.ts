// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    createNoDashGuid,
    Deferred,
    Events, IAudioDestination,
    Promise,
    PromiseState
} from "../common/Exports";
import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat";
import { PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream";
import {SynthesisAdapterBase} from "./SynthesisAdapterBase";
import {
    ConnectingToSynthesisServiceEvent,
    SpeechSynthesisEvent,
    SynthesisStartedEvent,
    SynthesisTriggeredEvent,
} from "./SynthesisEvents";

export interface ISynthesisResponseContext {
    serviceTag: string;
}

export interface ISynthesisResponseAudio {
    type: string;
    streamId: string;
}

export interface ISynthesisResponse {
    context: ISynthesisResponseContext;
    audio: ISynthesisResponseAudio;
}

export class SynthesisTurn {

    public get requestId(): string {
        return this.privRequestId;
    }

    public get streamId(): string {
        return this.privStreamId;
    }

    public set streamId(value: string) {
        this.privStreamId = value;
    }

    public get audioOutputFormat(): AudioOutputFormatImpl {
        return this.privAudioOutputFormat;
    }

    public set audioOutputFormat(format: AudioOutputFormatImpl) {
        this.privAudioOutputFormat = format;
    }

    public get turnCompletionPromise(): Promise<boolean> {
        return this.privTurnDeferral.promise();
    }

    public get isSynthesisEnded(): boolean {
        return this.privIsSynthesisEnded;
    }

    public get isSynthesizing(): boolean {
        return this.privIsSynthesizing;
    }

    public get currentTextOffset(): number {
        return this.privTextOffset;
    }

    // The number of bytes received for current turn
    public get bytesReceived(): number {
        return this.privBytesReceived;
    }

    public get allReceivedAudio(): ArrayBuffer {
        if (!!this.privReceivedAudio) {
            return this.privReceivedAudio;
        }
        if (!this.privIsSynthesisEnded) {
            return null;
        }
        this.readAllAudioFromStream();
        return this.allReceivedAudio;
    }

    public get allReceivedAudioWithHeader(): ArrayBuffer {
        if (!!this.privReceivedAudioWithHeader) {
            return this.privReceivedAudioWithHeader;
        }
        if (!this.privIsSynthesisEnded) {
            return null;
        }
        if (this.audioOutputFormat.hasHeader) {
            this.privReceivedAudioWithHeader = SynthesisAdapterBase.addHeader(this.allReceivedAudio, this.audioOutputFormat);
            return this.allReceivedAudioWithHeader;
        } else {
            return this.allReceivedAudio;
        }
    }
    private privIsDisposed: boolean = false;
    private privAudioNodeId: string;
    private privAuthFetchEventId: string;
    private privIsSynthesizing: boolean = false;
    private privIsSynthesisEnded: boolean = false;
    private privBytesReceived: number = 0;
    private privRequestId: string;
    private privStreamId: string;
    private privTurnDeferral: Deferred<boolean>;
    private privAudioOutputFormat: AudioOutputFormatImpl;
    private privAudioOutputStream: PullAudioOutputStreamImpl;
    private privReceivedAudio: ArrayBuffer;
    private privReceivedAudioWithHeader: ArrayBuffer;
    private privTextOffset: number = 0;
    private privNextSearchTextIndex: number = 0;
    private privRawText: string;
    private privIsSSML: boolean;
    private privTurnAudioDestination: IAudioDestination;

    constructor() {
        this.privRequestId = createNoDashGuid();
        this.privAudioNodeId = createNoDashGuid();
        this.privTurnDeferral = new Deferred<boolean>();

        // We're not in a turn, so resolve.
        this.privTurnDeferral.resolve(true);
    }

    public startNewSynthesis(requestId: string, rawText: string, isSSML: boolean, audioDestination?: IAudioDestination): void {
        this.privIsSynthesisEnded = false;
        this.privIsSynthesizing = true;
        this.privRequestId = requestId;
        this.privRawText = rawText;
        this.privIsSSML = isSSML;
        this.privAudioOutputStream = new PullAudioOutputStreamImpl();
        this.privAudioOutputStream.format = this.privAudioOutputFormat;
        this.privReceivedAudio = null;
        this.privReceivedAudioWithHeader = null;
        this.privBytesReceived = 0;
        this.privTextOffset = 0;
        this.privNextSearchTextIndex = 0;
        if (audioDestination !== undefined) {
            this.privTurnAudioDestination = audioDestination;
            this.privTurnAudioDestination.format = this.privAudioOutputFormat;
        }
        this.onEvent(new SynthesisTriggeredEvent(this.requestId, undefined, audioDestination === undefined ? undefined : audioDestination.id()));
    }

    public onPreConnectionStart = (authFetchEventId: string, connectionId: string): void => {
        this.privAuthFetchEventId = authFetchEventId;
        this.onEvent(new ConnectingToSynthesisServiceEvent(this.privRequestId, this.privAuthFetchEventId));
    }

    public onAuthCompleted = (isError: boolean, error?: string): void => {
        if (isError) {
            this.onComplete();
        }
    }

    public onConnectionEstablishCompleted = (statusCode: number, reason?: string): void => {
        if (statusCode === 200) {
            this.onEvent(new SynthesisStartedEvent(this.requestId, this.privAuthFetchEventId));
            this.privBytesReceived = 0;
            return;
        } else if (statusCode === 403) {
            this.onComplete();
        }
    }

    public onServiceResponseMessage = (responseJson: string): void => {
        const response: ISynthesisResponse = JSON.parse(responseJson);
        this.streamId = response.audio.streamId;
    }

    public onServiceTurnEndResponse = (): void => {
        this.privTurnDeferral.resolve(true);
        this.onComplete();
    }

    public onServiceTurnStartResponse = (): void => {
        if (this.privTurnDeferral.state() === PromiseState.None) {
            // What? How are we starting a turn with another not done?
            this.privTurnDeferral.reject("Another turn started before current completed.");
        }

        this.privTurnDeferral = new Deferred<boolean>();
    }

    public onAudioChunkReceived(data: ArrayBuffer): void {
        if (this.isSynthesizing) {
            this.privAudioOutputStream.write(data);
            this.privBytesReceived += data.byteLength;
            if (this.privTurnAudioDestination !== undefined) {
                this.privTurnAudioDestination.write(data);
            }
        }
    }

    public onWordBoundaryEvent(text: string): void {
        this.updateTextOffset(text);
    }

    public dispose = (error?: string): void => {
        if (!this.privIsDisposed) {
            // we should have completed by now. If we did not its an unknown error.
            this.privIsDisposed = true;
        }
    }

    public onStopSynthesizing(): void {
        this.onComplete();
    }

    protected onEvent = (event: SpeechSynthesisEvent): void => {
        Events.instance.onEvent(event);
    }

    private updateTextOffset(text: string): void {
        if (this.privTextOffset >= 0) {
            this.privTextOffset = this.privRawText.indexOf(text, this.privNextSearchTextIndex);
            if (this.privTextOffset >= 0) {
                this.privNextSearchTextIndex = this.privTextOffset + text.length;
            }
            if (this.privIsSSML) {
                if (this.privRawText.indexOf("<", this.privTextOffset + 1) > this.privRawText.indexOf(">", this.privTextOffset + 1)) {
                    this.updateTextOffset(text);
                }
            }
        }
    }

    private onComplete = (): void => {
        if (this.privIsSynthesizing) {
            this.privIsSynthesizing = false;
            this.privIsSynthesisEnded = true;
            this.privAudioOutputStream.close();
            if (this.privTurnAudioDestination !== undefined) {
                this.privTurnAudioDestination.close();
                this.privTurnAudioDestination = undefined;
            }
        }
    }

    private readAllAudioFromStream(): void {
        if (this.privIsSynthesisEnded) {
            this.privReceivedAudio = new ArrayBuffer(this.bytesReceived);
            try {
                this.privAudioOutputStream.read(this.privReceivedAudio);
            } catch (e) {
                this.privReceivedAudio = new ArrayBuffer(0);
            }
        }
    }
}
