// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    BackgroundEvent,
    createNoDashGuid,
    Events,
    IAudioDestination,
    INumberDictionary
} from "../../common/Exports.js";
import { AudioStreamFormat, IPlayer } from "../Exports.js";
import { AudioOutputFormatImpl } from "./AudioOutputFormat.js";
import { PullAudioOutputStreamImpl } from "./AudioOutputStream.js";
import { AudioFormatTag } from "./AudioStreamFormat.js";

const MediaDurationPlaceholderSeconds = 60 * 30;

const AudioFormatToMimeType: INumberDictionary<string> = {
    [AudioFormatTag.PCM]: "audio/wav",
    [AudioFormatTag.MuLaw]: "audio/x-wav",
    [AudioFormatTag.MP3]: "audio/mpeg",
    [AudioFormatTag.OGG_OPUS]: "audio/ogg",
    [AudioFormatTag.WEBM_OPUS]: "audio/webm; codecs=opus",
    [AudioFormatTag.ALaw]: "audio/x-wav",
    [AudioFormatTag.FLAC]: "audio/flac",
    [AudioFormatTag.AMR_WB]: "audio/amr-wb",
    [AudioFormatTag.G722]: "audio/G722",
};

/**
 * Represents the speaker playback audio destination, which only works in browser.
 * Note: the SDK will try to use <a href="https://www.w3.org/TR/media-source/">Media Source Extensions</a> to play audio.
 * Mp3 format has better supports on Microsoft Edge, Chrome and Safari (desktop), so, it's better to specify mp3 format for playback.
 * @class SpeakerAudioDestination
 * Updated in version 1.17.0
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
    private privAudioOutputStream: PullAudioOutputStreamImpl;
    private privBytesReceived: number = 0;

    public constructor(audioDestinationId?: string) {
        this.privId = audioDestinationId ? audioDestinationId : createNoDashGuid();
        this.privIsPaused = false;
        this.privIsClosed = false;
    }

    public id(): string {
        return this.privId;
    }

    public write(buffer: ArrayBuffer, cb?: () => void, err?: (error: string) => void): void {
        if (this.privAudioBuffer !== undefined) {
            this.privAudioBuffer.push(buffer);
            this.updateSourceBuffer().then((): void => {
                if (!!cb) {
                    cb();
                }
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
            });
        } else if (this.privAudioOutputStream !== undefined) {
            this.privAudioOutputStream.write(buffer);
            this.privBytesReceived += buffer.byteLength;
        }
    }

    public close(cb?: () => void, err?: (error: string) => void): void {
        this.privIsClosed = true;
        if (this.privSourceBuffer !== undefined) {
            this.handleSourceBufferUpdateEnd().then((): void => {
                if (!!cb) {
                    cb();
                }
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
            });
        } else if (this.privAudioOutputStream !== undefined && typeof window !== "undefined") {
            if ((this.privFormat.formatTag === AudioFormatTag.PCM || this.privFormat.formatTag === AudioFormatTag.MuLaw
                || this.privFormat.formatTag === AudioFormatTag.ALaw) && this.privFormat.hasHeader === false) {
                // eslint-disable-next-line no-console
                console.warn("Play back is not supported for raw PCM, mulaw or alaw format without header.");
                if (!!this.onAudioEnd) {
                    this.onAudioEnd(this);
                }
            } else {
                let receivedAudio = new ArrayBuffer(this.privBytesReceived);
                this.privAudioOutputStream.read(receivedAudio).then((): void => {
                    receivedAudio = this.privFormat.addHeader(receivedAudio);
                    const audioBlob = new Blob([receivedAudio], { type: AudioFormatToMimeType[this.privFormat.formatTag] });
                    this.privAudio.src = window.URL.createObjectURL(audioBlob);
                    this.notifyPlayback().then((): void => {
                        if (!!cb) {
                            cb();
                        }
                    }, (error: string): void => {
                        if (!!err) {
                            err(error);
                        }
                    });
                }, (error: string): void => {
                    if (!!err) {
                        err(error);
                    }
                });
            }
        } else {
            // unsupported format, call onAudioEnd directly.
            if (!!this.onAudioEnd) {
                this.onAudioEnd(this);
            }
        }
    }

    public set format(format: AudioStreamFormat) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (typeof (AudioContext) !== "undefined" || (typeof (window) !== "undefined" && typeof ((window as any).webkitAudioContext) !== "undefined")) {
            this.privFormat = format as AudioOutputFormatImpl;
            const mimeType: string = AudioFormatToMimeType[this.privFormat.formatTag];
            if (mimeType === undefined) {
                // eslint-disable-next-line no-console
                console.warn(
                    `Unknown mimeType for format ${AudioFormatTag[this.privFormat.formatTag]}; playback is not supported.`);

            } else if (typeof (MediaSource) !== "undefined" && MediaSource.isTypeSupported(mimeType)) {
                this.privAudio = new Audio();
                this.privAudioBuffer = [];
                this.privMediaSource = new MediaSource();
                this.privAudio.src = URL.createObjectURL(this.privMediaSource);
                this.privAudio.load();
                this.privMediaSource.onsourceopen = (): void => {
                    this.privMediaSourceOpened = true;
                    this.privMediaSource.duration = MediaDurationPlaceholderSeconds;
                    this.privSourceBuffer = this.privMediaSource.addSourceBuffer(mimeType);
                    this.privSourceBuffer.onupdate = (): void => {
                        this.updateSourceBuffer().catch((reason: string): void => {
                            Events.instance.onEvent(new BackgroundEvent(reason));
                        });
                    };
                    this.privSourceBuffer.onupdateend = (): void => {
                        this.handleSourceBufferUpdateEnd().catch((reason: string): void => {
                            Events.instance.onEvent(new BackgroundEvent(reason));
                        });
                    };
                    this.privSourceBuffer.onupdatestart = (): void => {
                        this.privAppendingToBuffer = false;
                    };
                };
                this.updateSourceBuffer().catch((reason: string): void => {
                    Events.instance.onEvent(new BackgroundEvent(reason));
                });

            } else {
                // eslint-disable-next-line no-console
                console.warn(
                    `Format ${AudioFormatTag[this.privFormat.formatTag]} could not be played by MSE, streaming playback is not enabled.`);
                this.privAudioOutputStream = new PullAudioOutputStreamImpl();
                this.privAudioOutputStream.format = this.privFormat;
                this.privAudio = new Audio();
            }
        }
    }

    public get volume(): number {
        return this.privAudio?.volume ?? -1;
    }

    public set volume(volume: number) {
        if (!!this.privAudio) {
            this.privAudio.volume = volume;
        }
    }

    public mute(): void {
        if (!!this.privAudio) {
            this.privAudio.muted = true;
        }
    }

    public unmute(): void {
        if (!!this.privAudio) {
            this.privAudio.muted = false;
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

    public resume(cb?: () => void, err?: (error: string) => void): void {
        if (this.privIsPaused && this.privAudio !== undefined) {
            this.privAudio.play().then((): void => {
                if (!!cb) {
                    cb();
                }
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
            });
            this.privIsPaused = false;
        }
    }

    public onAudioStart: (sender: IPlayer) => void;

    public onAudioEnd: (sender: IPlayer) => void;

    public get internalAudio(): HTMLAudioElement {
        return this.privAudio;
    }

    private async updateSourceBuffer(): Promise<void> {
        if (this.privAudioBuffer !== undefined && (this.privAudioBuffer.length > 0) && this.sourceBufferAvailable()) {
            this.privAppendingToBuffer = true;
            const binary = this.privAudioBuffer.shift();
            try {
                this.privSourceBuffer.appendBuffer(binary);
            } catch (error) {
                this.privAudioBuffer.unshift(binary);
                // eslint-disable-next-line no-console
                console.log(
                    "buffer filled, pausing addition of binaries until space is made");
                return;
            }
            await this.notifyPlayback();
        } else if (this.canEndStream()) {
            await this.handleSourceBufferUpdateEnd();
        }
    }

    private async handleSourceBufferUpdateEnd(): Promise<void> {
        if (this.canEndStream() && this.sourceBufferAvailable()) {
            this.privMediaSource.endOfStream();
            await this.notifyPlayback();
        }
    }

    private async notifyPlayback(): Promise<void> {
        if (!this.privPlaybackStarted && this.privAudio !== undefined) {
            this.privPlaybackStarted = true;
            if (!!this.onAudioStart) {
                this.onAudioStart(this);
            }
            this.privAudio.onended = (): void => {
                if (!!this.onAudioEnd) {
                    this.onAudioEnd(this);
                }
            };
            if (!this.privIsPaused) {
                await this.privAudio.play();
            }
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
