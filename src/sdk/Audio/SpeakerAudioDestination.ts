// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    createNoDashGuid,
    IAudioDestination,
    INumberDictionary
} from "../../common/Exports";
import { AudioStreamFormat, IPlayer } from "../Exports";
import { AudioFormatTag, AudioOutputFormatImpl } from "./AudioOutputFormat";

const MediaDurationPlaceholderSeconds = 60 * 30;

const AudioFormatToMimeType: INumberDictionary<string> = {
    [AudioFormatTag.PCM]: "audio/wav",
    [AudioFormatTag.MP3]: "audio/mpeg",
};

/**
 * Represents the speaker playback audio destination, which only works in browser.
 * Note: the playback is based on <a href="https://www.w3.org/TR/media-source/">Media Source Extensions</a>, on most browsers, only mp3 format is supported.
 * @class SpeakerAudioDestination
 * Updated in version 1.12.0
 */
export class SpeakerAudioDestination implements IAudioDestination, IPlayer {
    private readonly privId: string;
    private privFormat: AudioOutputFormatImpl;
    private privAudio: HTMLAudioElement;
    private privMediaSource: MediaSource;
    private privSourceBuffer: SourceBuffer;
    private privPlaybackStarted: boolean = false;
    private privAudioBuffer: ArrayBuffer[];
    private privAppendingToBuffer: boolean = false;
    private privMediaSourceOpened: boolean = false;
    private privIsClosed: boolean;
    private privIsPaused: boolean;

    public constructor(audioDestinationId?: string) {
        this.privId = audioDestinationId ? audioDestinationId : createNoDashGuid();
        this.privIsPaused = false;
        this.privIsClosed = false;
    }

    public id(): string {
        return this.privId;
    }

    public write(buffer: ArrayBuffer): void {
        if (this.privAudioBuffer !== undefined) {
            this.privAudioBuffer.push(buffer);
            this.updateSourceBuffer();
        }
    }

    public close(): void {
        this.privIsClosed = true;
        if (this.privSourceBuffer !== undefined) {
            this.handleSourceBufferUpdateEnd();
        }
    }

    set format(format: AudioStreamFormat) {
        if (typeof (AudioContext) !== "undefined") {
            this.privFormat = format as AudioOutputFormatImpl;
            const mimeType: string = AudioFormatToMimeType[this.privFormat.formatTag];
            if (mimeType !== undefined && typeof(MediaSource) !== "undefined" && MediaSource.isTypeSupported(mimeType)) {
                this.privAudio = new Audio();
                this.privAudioBuffer = [];
                this.privMediaSource = new MediaSource();
                this.privAudio.src = URL.createObjectURL(this.privMediaSource);
                this.privAudio.load();
                this.privMediaSource.onsourceopen = (event: Event): void => {
                    this.privMediaSourceOpened = true;
                    this.privMediaSource.duration = MediaDurationPlaceholderSeconds;
                    this.privSourceBuffer = this.privMediaSource.addSourceBuffer("audio/mpeg");
                    this.privSourceBuffer.onupdate = (_: Event) => {
                        this.updateSourceBuffer();
                    };
                    this.privSourceBuffer.onupdateend = (_: Event) => {
                        this.handleSourceBufferUpdateEnd();
                    };
                    this.privSourceBuffer.onupdatestart = (_: Event) => {
                        this.privAppendingToBuffer = false;
                    };
                };
                this.updateSourceBuffer();
            } else {
                // tslint:disable-next-line:no-console
                console.warn(
                    `Format ${AudioFormatTag[this.privFormat.formatTag]} is not supported for playback.`);
            }
        }
    }

    public get isClosed(): boolean {
        return this.privIsClosed;
    }

    public get currentTime(): number {
        if (this.privAudio !== undefined) {
            return this.privAudio.currentTime;
        }
        return -1;
    }

    public pause(): void {
        if (!this.privIsPaused && this.privAudio !== undefined) {
            this.privAudio.pause();
            this.privIsPaused = true;
        }
    }

    public resume(): void {
        if (this.privIsPaused && this.privAudio !== undefined) {
            this.privAudio.play();
            this.privIsPaused = false;
        }
    }

    public onAudioEnd: (sender: IPlayer) => void;

    public get internalAudio(): HTMLAudioElement {
        return this.privAudio;
    }

    private updateSourceBuffer(): void {
        if (this.privAudioBuffer !== undefined && (this.privAudioBuffer.length > 0) && this.sourceBufferAvailable()) {
            this.privAppendingToBuffer = true;
            const binary = this.privAudioBuffer.shift();
            try {
                this.privSourceBuffer.appendBuffer(binary);
            } catch (error) {
                this.privAudioBuffer.unshift(binary);
                // tslint:disable-next-line:no-console
                console.log(
                    "buffer filled, pausing addition of binaries until space is made");
                return;
            }
            this.notifyPlayback();
        } else if (this.canEndStream()) {
            this.handleSourceBufferUpdateEnd();
        }
    }

    private handleSourceBufferUpdateEnd(): void {
        if (this.canEndStream() && this.sourceBufferAvailable()) {
            this.privMediaSource.endOfStream();
            this.notifyPlayback();
        }
    }

    private notifyPlayback(): void {
        if (!this.privPlaybackStarted && this.privAudio !== undefined) {
            this.privAudio.onended = (): void => {
                if (!!this.onAudioEnd) {
                    this.onAudioEnd(this);
                }
            };
            if (!this.privIsPaused) {
                this.privAudio.play();
            }
            this.privPlaybackStarted = true;
        }
    }

    private canEndStream(): boolean {
        return (this.isClosed && this.privSourceBuffer !== undefined && (this.privAudioBuffer.length === 0)
            && this.privMediaSourceOpened && !this.privAppendingToBuffer && this.privMediaSource.readyState === "open");
    }

    private sourceBufferAvailable(): boolean {
        return (this.privSourceBuffer !== undefined && !this.privSourceBuffer.updating);
    }
}
