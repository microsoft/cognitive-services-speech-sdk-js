// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    createNoDashGuid,
    Deferred,
    Events,
    IAudioDestination
} from "../common/Exports.js";
import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat.js";
import { PullAudioOutputStreamImpl } from "../sdk/Audio/AudioOutputStream.js";
import {
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechSynthesisResult,
} from "../sdk/Exports.js";
import { ISynthesisMetadata, MetadataType } from "./ServiceMessages/SynthesisAudioMetadata.js";
import {
    ConnectingToSynthesisServiceEvent,
    SpeechSynthesisEvent,
    SynthesisStartedEvent,
    SynthesisTriggeredEvent,
} from "./SynthesisEvents.js";

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
    webrtc: {
        connectionString: string;
    };
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

    public get turnCompletionPromise(): Promise<void> {
        return this.privTurnDeferral.promise;
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

    public get currentSentenceOffset(): number {
        return this.privSentenceOffset;
    }

    // The number of bytes received for current turn
    public get bytesReceived(): number {
        return this.privBytesReceived;
    }

    public get audioDuration(): number {
        return this.privAudioDuration;
    }

    public get extraProperties(): PropertyCollection {
        if (!!this.privWebRTCSDP) {
            const properties = new PropertyCollection();
            properties.setProperty(PropertyId.TalkingAvatarService_WebRTC_SDP, this.privWebRTCSDP);
            return properties;
        }

        return undefined;
    }

    private privIsDisposed: boolean = false;
    private privAuthFetchEventId: string;
    private privIsSynthesizing: boolean = false;
    private privIsSynthesisEnded: boolean = false;
    private privBytesReceived: number = 0;
    private privRequestId: string;
    private privStreamId: string;
    private privTurnDeferral: Deferred<void>;
    private privInTurn: boolean = false;
    private privAudioOutputFormat: AudioOutputFormatImpl;
    private privAudioOutputStream: PullAudioOutputStreamImpl;
    private privReceivedAudio: ArrayBuffer;
    private privReceivedAudioWithHeader: ArrayBuffer;
    private privTextOffset: number = 0;
    private privNextSearchTextIndex: number = 0;
    private privSentenceOffset: number = 0;
    private privNextSearchSentenceIndex: number = 0;
    private privPartialVisemeAnimation: string;
    private privRawText: string;
    private privIsSSML: boolean;
    private privTurnAudioDestination: IAudioDestination;
    private privAudioDuration: number;
    private privWebRTCSDP: string;

    public constructor() {
        this.privRequestId = createNoDashGuid();
        this.privTurnDeferral = new Deferred<void>();

        // We're not in a turn, so resolve.
        this.privTurnDeferral.resolve();
    }

    public async getAllReceivedAudio(): Promise<ArrayBuffer> {
        if (!!this.privReceivedAudio) {
            return Promise.resolve(this.privReceivedAudio);
        }
        if (!this.privIsSynthesisEnded) {
            return null;
        }
        await this.readAllAudioFromStream();
        return Promise.resolve(this.privReceivedAudio);
    }

    public async getAllReceivedAudioWithHeader(): Promise<ArrayBuffer> {
        if (!!this.privReceivedAudioWithHeader) {
            return this.privReceivedAudioWithHeader;
        }
        if (!this.privIsSynthesisEnded) {
            return null;
        }
        if (this.audioOutputFormat.hasHeader) {
            const audio: ArrayBuffer = await this.getAllReceivedAudio();
            this.privReceivedAudioWithHeader = this.audioOutputFormat.addHeader(audio);
            return this.privReceivedAudioWithHeader;
        } else {
            return this.getAllReceivedAudio();
        }
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
        this.privSentenceOffset = 0;
        this.privNextSearchSentenceIndex = 0;
        this.privPartialVisemeAnimation = "";
        this.privWebRTCSDP = "";
        if (audioDestination !== undefined) {
            this.privTurnAudioDestination = audioDestination;
            this.privTurnAudioDestination.format = this.privAudioOutputFormat;
        }
        this.onEvent(new SynthesisTriggeredEvent(this.requestId, undefined, audioDestination === undefined ? undefined : audioDestination.id()));
    }

    public onPreConnectionStart(authFetchEventId: string): void {
        this.privAuthFetchEventId = authFetchEventId;
        this.onEvent(new ConnectingToSynthesisServiceEvent(this.privRequestId, this.privAuthFetchEventId));
    }

    public onAuthCompleted(isError: boolean): void {
        if (isError) {
            this.onComplete();
        }
    }

    public onConnectionEstablishCompleted(statusCode: number): void {
        if (statusCode === 200) {
            this.onEvent(new SynthesisStartedEvent(this.requestId, this.privAuthFetchEventId));
            this.privBytesReceived = 0;
            return;
        } else if (statusCode === 403) {
            this.onComplete();
        }
    }

    public onServiceResponseMessage(responseJson: string): void {
        const response: ISynthesisResponse = JSON.parse(responseJson) as ISynthesisResponse;
        this.streamId = response.audio.streamId;
    }

    public onServiceTurnEndResponse(): void {
        this.privInTurn = false;
        this.privTurnDeferral.resolve();
        this.onComplete();
    }

    public onServiceTurnStartResponse(responseJson: string): void {
        if (!!this.privTurnDeferral && !!this.privInTurn) {
            // What? How are we starting a turn with another not done?
            this.privTurnDeferral.reject("Another turn started before current completed.");
            // Avoid UnhandledPromiseRejection if privTurnDeferral is not being awaited
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            this.privTurnDeferral.promise.then().catch((): void => { });
        }
        this.privInTurn = true;
        this.privTurnDeferral = new Deferred<void>();
        const response: ISynthesisResponse = JSON.parse(responseJson) as ISynthesisResponse;
        if (!!response.webrtc) {
            this.privWebRTCSDP = response.webrtc.connectionString;
        }
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

    public onTextBoundaryEvent(metadata: ISynthesisMetadata): void {
        this.updateTextOffset(metadata.Data.text.Text, metadata.Type);
    }

    public onVisemeMetadataReceived(metadata: ISynthesisMetadata): void {
        if (metadata.Data.AnimationChunk !== undefined) {
            this.privPartialVisemeAnimation += metadata.Data.AnimationChunk;
        }
    }

    public onSessionEnd(metadata: ISynthesisMetadata): void {
        this.privAudioDuration = metadata.Data.Offset;
    }

    public async constructSynthesisResult(): Promise<SpeechSynthesisResult> {
        const audioBuffer: ArrayBuffer = await this.getAllReceivedAudioWithHeader();
        return new SpeechSynthesisResult(
            this.requestId,
            ResultReason.SynthesizingAudioCompleted,
            audioBuffer,
            undefined,
            this.extraProperties,
            this.audioDuration
        );
    }

    public dispose(): void {
        if (!this.privIsDisposed) {
            // we should have completed by now. If we did not its an unknown error.
            this.privIsDisposed = true;
        }
    }

    public onStopSynthesizing(): void {
        this.onComplete();
    }

    /**
     * Gets the viseme animation string (merged from animation chunk), and clears the internal
     * partial animation.
     */
    public getAndClearVisemeAnimation(): string {
        const animation: string = this.privPartialVisemeAnimation;
        this.privPartialVisemeAnimation = "";
        return animation;
    }

    protected onEvent(event: SpeechSynthesisEvent): void {
        Events.instance.onEvent(event);
    }

    /**
     * Check if the text is an XML(SSML) tag
     * @param text
     * @private
     */
    private static isXmlTag(text: string): boolean {
        return text.length >= 2 && text[0] === "<" && text[text.length - 1] === ">";
    }

    private updateTextOffset(text: string, type: MetadataType): void {
        if (type === MetadataType.WordBoundary) {
            this.privTextOffset = this.privRawText.indexOf(text, this.privNextSearchTextIndex);
            if (this.privTextOffset >= 0) {
                this.privNextSearchTextIndex = this.privTextOffset + text.length;
                if (this.privIsSSML) {
                    if (this.withinXmlTag(this.privTextOffset) && !SynthesisTurn.isXmlTag(text)) {
                        this.updateTextOffset(text, type);
                    }
                }
            }
        } else {
            this.privSentenceOffset = this.privRawText.indexOf(text, this.privNextSearchSentenceIndex);
            if (this.privSentenceOffset >= 0) {
                this.privNextSearchSentenceIndex = this.privSentenceOffset + text.length;
                if (this.privIsSSML) {
                    if (this.withinXmlTag(this.privSentenceOffset) && !SynthesisTurn.isXmlTag(text)) {
                        this.updateTextOffset(text, type);
                    }
                }
            }
        }
    }

    private onComplete(): void {
        if (this.privIsSynthesizing) {
            this.privIsSynthesizing = false;
            this.privIsSynthesisEnded = true;
            this.privAudioOutputStream.close();
            this.privInTurn = false;
            if (this.privTurnAudioDestination !== undefined) {
                this.privTurnAudioDestination.close();
                this.privTurnAudioDestination = undefined;
            }
        }
    }

    private async readAllAudioFromStream(): Promise<void> {
        if (this.privIsSynthesisEnded) {
            this.privReceivedAudio = new ArrayBuffer(this.bytesReceived);
            try {
                await this.privAudioOutputStream.read(this.privReceivedAudio);
            } catch (e) {
                this.privReceivedAudio = new ArrayBuffer(0);
            }
        }
    }

    /**
     * Check if current idx is in XML(SSML) tag
     * @param idx
     * @private
     */
    private withinXmlTag(idx: number): boolean {
        return this.privRawText.indexOf("<", idx + 1) > this.privRawText.indexOf(">", idx + 1);
    }
}
