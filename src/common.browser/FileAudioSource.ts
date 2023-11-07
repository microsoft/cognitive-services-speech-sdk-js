// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    connectivity,
    ISpeechConfigAudioDevice,
    type,
} from "../common.speech/Exports.js";
import {
    AudioSourceErrorEvent,
    AudioSourceEvent,
    AudioSourceInitializingEvent,
    AudioSourceOffEvent,
    AudioSourceReadyEvent,
    AudioStreamNodeAttachedEvent,
    AudioStreamNodeAttachingEvent,
    AudioStreamNodeDetachedEvent,
    AudioStreamNodeErrorEvent,
    ChunkedArrayBufferStream,
    createNoDashGuid,
    Deferred,
    Events,
    EventSource,
    IAudioSource,
    IAudioStreamNode,
    IStreamChunk,
    IStringDictionary,
    Stream,
} from "../common/Exports.js";
import { AudioStreamFormat, AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat.js";

export class FileAudioSource implements IAudioSource {

    private privAudioFormatPromise: Promise<AudioStreamFormatImpl>;

    private privStreams: IStringDictionary<Stream<ArrayBuffer>> = {};

    private privId: string;

    private privEvents: EventSource<AudioSourceEvent>;

    private privSource: Blob | Buffer;

    private privFilename: string;

    private privHeaderEnd: number = 44;

    public constructor(file: File | Buffer, filename?: string, audioSourceId?: string) {
        this.privId = audioSourceId ? audioSourceId : createNoDashGuid();
        this.privEvents = new EventSource<AudioSourceEvent>();
        this.privSource = file;
        if (typeof window !== "undefined" && typeof Blob !== "undefined" && this.privSource instanceof Blob) {
            this.privFilename = (file as File).name;
        } else {
            this.privFilename = filename || "unknown.wav";
        }

        // Read the header.
        this.privAudioFormatPromise = this.readHeader();
    }

    public get format(): Promise<AudioStreamFormatImpl> {
        return this.privAudioFormatPromise;
    }

    public turnOn(): Promise<void> {
        if (this.privFilename.lastIndexOf(".wav") !== this.privFilename.length - 4) {
            const errorMsg = this.privFilename + " is not supported. Only WAVE files are allowed at the moment.";
            this.onEvent(new AudioSourceErrorEvent(errorMsg, ""));
            return Promise.reject(errorMsg);
        }

        this.onEvent(new AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new AudioSourceReadyEvent(this.privId));
        return;
    }

    public id(): string {
        return this.privId;
    }

    public async attach(audioNodeId: string): Promise<IAudioStreamNode> {
        this.onEvent(new AudioStreamNodeAttachingEvent(this.privId, audioNodeId));

        const stream: Stream<ArrayBuffer> = await this.upload(audioNodeId);

        this.onEvent(new AudioStreamNodeAttachedEvent(this.privId, audioNodeId));
        return Promise.resolve({
            detach: async (): Promise<void> => {
                stream.readEnded();
                delete this.privStreams[audioNodeId];
                this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
                await this.turnOff();
            },
            id: (): string => audioNodeId,
            read: (): Promise<IStreamChunk<ArrayBuffer>> => stream.read(),
        });
    }

    public detach(audioNodeId: string): void {
        if (audioNodeId && this.privStreams[audioNodeId]) {
            this.privStreams[audioNodeId].close();
            delete this.privStreams[audioNodeId];
            this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
        }
    }

    public turnOff(): Promise<void> {
        for (const streamId in this.privStreams) {
            if (streamId) {
                const stream = this.privStreams[streamId];
                if (stream && !stream.isClosed) {
                    stream.close();
                }
            }
        }

        this.onEvent(new AudioSourceOffEvent(this.privId)); // no stream now
        return Promise.resolve();
    }

    public get events(): EventSource<AudioSourceEvent> {
        return this.privEvents;
    }

    public get deviceInfo(): Promise<ISpeechConfigAudioDevice> {
        return this.privAudioFormatPromise.then<ISpeechConfigAudioDevice>((result: AudioStreamFormatImpl): Promise<{
            bitspersample: number;
            channelcount: number;
            connectivity: connectivity.Unknown;
            manufacturer: string;
            model: string;
            samplerate: number;
            type: type.File;
        }> => ( Promise.resolve({
                bitspersample: result.bitsPerSample,
                channelcount: result.channels,
                connectivity: connectivity.Unknown,
                manufacturer: "Speech SDK",
                model: "File",
                samplerate: result.samplesPerSec,
                type: type.File,
            })
        ));
    }

    private readHeader(): Promise<AudioStreamFormatImpl> {
        // Read the wave header.
        const maxHeaderSize: number = 4296;
        const header: Blob | Buffer = this.privSource.slice(0, maxHeaderSize);

        const headerResult: Deferred<AudioStreamFormatImpl> = new Deferred<AudioStreamFormatImpl>();

        const processHeader = (header: ArrayBuffer): void => {
            const view: DataView = new DataView(header);

            const getWord = (index: number): string => String.fromCharCode(view.getUint8(index), view.getUint8(index + 1), view.getUint8(index + 2), view.getUint8(index + 3));

            // RIFF 4 bytes.
            if ("RIFF" !== getWord(0)) {
                headerResult.reject("Invalid WAV header in file, RIFF was not found");
                return;
            }

            // length, 4 bytes
            // RIFF Type & fmt 8 bytes
            if ("WAVE" !== getWord(8) || "fmt " !== getWord(12)) {
                headerResult.reject("Invalid WAV header in file, WAVEfmt was not found");
                return;
            }

            const formatSize: number = view.getInt32(16, true);
            const channelCount: number = view.getUint16(22, true);
            const sampleRate: number = view.getUint32(24, true);
            const bitsPerSample: number = view.getUint16(34, true);
            // Confirm if header is 44 bytes long.
            let pos: number = 36 + Math.max(formatSize - 16, 0);
            for (; getWord(pos) !== "data"; pos += 2) {
                if (pos > maxHeaderSize - 8) {
                    headerResult.reject("Invalid WAV header in file, data block was not found");
                    return;
                }
            }
            this.privHeaderEnd = pos + 8;
            headerResult.resolve(AudioStreamFormat.getWaveFormatPCM(sampleRate, bitsPerSample, channelCount) as AudioStreamFormatImpl);
        };

        if (typeof window !== "undefined" && typeof Blob !== "undefined" && header instanceof Blob) {
            const reader: FileReader = new FileReader();

            reader.onload = (event: Event): void => {
                const header: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;
                processHeader(header);
            };

            reader.readAsArrayBuffer(header);
        } else {
            const h: Buffer = header as Buffer;
            processHeader(h.buffer.slice(h.byteOffset, h.byteOffset + h.byteLength));
        }
        return headerResult.promise;
    }

    private async upload(audioNodeId: string): Promise<Stream<ArrayBuffer>> {
        const onerror = (error: string): void => {
            const errorMsg = `Error occurred while processing '${this.privFilename}'. ${error}`;
            this.onEvent(new AudioStreamNodeErrorEvent(this.privId, audioNodeId, errorMsg));
            throw new Error(errorMsg);
        };

        try {
            await this.turnOn();

            const format: AudioStreamFormatImpl = await this.privAudioFormatPromise;
            const stream = new ChunkedArrayBufferStream(format.avgBytesPerSec / 10, audioNodeId);

            this.privStreams[audioNodeId] = stream;
            const chunk: Blob | Buffer = this.privSource.slice(this.privHeaderEnd);

            const processFile = (buff: ArrayBuffer): void => {
                if (stream.isClosed) {
                    return; // output stream was closed (somebody called TurnOff). We're done here.
                }

                stream.writeStreamChunk({
                    buffer: buff,
                    isEnd: false,
                    timeReceived: Date.now(),
                });
                stream.close();
            };

            if (typeof window !== "undefined" && typeof Blob !== "undefined" && chunk instanceof Blob) {
                const reader: FileReader = new FileReader();
                reader.onerror = (ev: ProgressEvent<FileReader>): void  =>  onerror(ev.toString());

                reader.onload = (event: Event): void => {
                    const fileBuffer: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;
                    processFile(fileBuffer);
                };

                reader.readAsArrayBuffer(chunk);
            } else {
                const c: Buffer = chunk as Buffer;
                processFile(c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength));
            }

            return stream;
        } catch (e) {
            onerror(e as string);
        }
    }

    private onEvent(event: AudioSourceEvent): void {
        this.privEvents.onEvent(event);
        Events.instance.onEvent(event);
    }
}
