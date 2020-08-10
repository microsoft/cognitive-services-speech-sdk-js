// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    connectivity,
    ISpeechConfigAudioDevice,
    type,
} from "../common.speech/Exports";
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
} from "../common/Exports";
import { AudioStreamFormat, AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";

export class FileAudioSource implements IAudioSource {

    private privAudioFormatPromise: Promise<AudioStreamFormatImpl>;

    private privStreams: IStringDictionary<Stream<ArrayBuffer>> = {};

    private privId: string;

    private privEvents: EventSource<AudioSourceEvent>;

    private privFile: File;

    private privHeaderEnd: number = 44;

    public constructor(file: File, audioSourceId?: string) {
        this.privId = audioSourceId ? audioSourceId : createNoDashGuid();
        this.privEvents = new EventSource<AudioSourceEvent>();
        this.privFile = file;

        // Read the header.
        this.privAudioFormatPromise = this.readHeader();
    }

    public get format(): Promise<AudioStreamFormatImpl> {
        return this.privAudioFormatPromise;
    }

    public get blob(): Promise<Blob | Buffer> {
        return Promise.resolve(this.privFile);
    }

    public turnOn = (): Promise<void> => {
        if (typeof FileReader === "undefined") {
            const errorMsg = "Browser does not support FileReader.";
            this.onEvent(new AudioSourceErrorEvent(errorMsg, "")); // initialization error - no streamid at this point
            return Promise.reject(errorMsg);
        } else if (this.privFile.name.lastIndexOf(".wav") !== this.privFile.name.length - 4) {
            const errorMsg = this.privFile.name + " is not supported. Only WAVE files are allowed at the moment.";
            this.onEvent(new AudioSourceErrorEvent(errorMsg, ""));
            return Promise.reject(errorMsg);
        }

        this.onEvent(new AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new AudioSourceReadyEvent(this.privId));
        return;
    }

    public id = (): string => {
        return this.privId;
    }

    public attach = async (audioNodeId: string): Promise<IAudioStreamNode> => {
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
            id: () => {
                return audioNodeId;
            },
            read: (): Promise<IStreamChunk<ArrayBuffer>> => {
                return stream.read();
            },
        });
    }

    public detach = (audioNodeId: string): void => {
        if (audioNodeId && this.privStreams[audioNodeId]) {
            this.privStreams[audioNodeId].close();
            delete this.privStreams[audioNodeId];
            this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
        }
    }

    public turnOff = (): Promise<void> => {
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
        return this.privAudioFormatPromise.then<ISpeechConfigAudioDevice>((result: AudioStreamFormatImpl) => {
            return Promise.resolve({
                bitspersample: result.bitsPerSample,
                channelcount: result.channels,
                connectivity: connectivity.Unknown,
                manufacturer: "Speech SDK",
                model: "File",
                samplerate: result.samplesPerSec,
                type: type.File,
            });
        });
    }

    private readHeader(): Promise<AudioStreamFormatImpl> {
        // Read the wave header.
        const maxHeaderSize: number = 128;
        const header: Blob = this.privFile.slice(0, maxHeaderSize);
        const headerReader: FileReader = new FileReader();

        const headerResult: Deferred<AudioStreamFormatImpl> = new Deferred<AudioStreamFormatImpl>();

        const processHeader = (event: Event): void => {
            const header: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;

            const view: DataView = new DataView(header);

            const getWord = (index: number): string => {
                return String.fromCharCode(view.getUint8(index), view.getUint8(index + 1), view.getUint8(index + 2), view.getUint8(index + 3));
            };

            // RIFF 4 bytes.
            if ("RIFF" !== getWord(0)) {
                headerResult.reject("Invalid WAV header in file, RIFF was not found");
            }

            // length, 4 bytes
            // RIFF Type & fmt 8 bytes
            if ("WAVE" !== getWord(8) || "fmt " !== getWord(12)) {
                headerResult.reject("Invalid WAV header in file, WAVEfmt was not found");
            }

            const formatSize: number = view.getInt32(16, true);
            const channelCount: number = view.getUint16(22, true);
            const sampleRate: number = view.getUint32(24, true);
            const bitsPerSample: number = view.getUint16(34, true);
            // Confirm if header is 44 bytes long.
            let pos: number = 36 + Math.max(formatSize - 16, 0);
            for (; getWord(pos) !== "data"; pos += 2) {
              if (pos > maxHeaderSize - 4) {
                  headerResult.reject("Invalid WAV header in file, data block was not found");
              }
            }

            this.privHeaderEnd = pos + 8;

            headerResult.resolve(AudioStreamFormat.getWaveFormatPCM(sampleRate, bitsPerSample, channelCount) as AudioStreamFormatImpl);
        };

        headerReader.onload = processHeader;
        headerReader.readAsArrayBuffer(header);
        return headerResult.promise;
    }

    private async upload(audioNodeId: string): Promise<Stream<ArrayBuffer>> {
        await this.turnOn();

        const format: AudioStreamFormatImpl = await this.privAudioFormatPromise;
        const reader: FileReader = new FileReader();
        const stream = new ChunkedArrayBufferStream(format.avgBytesPerSec / 10, audioNodeId);

        this.privStreams[audioNodeId] = stream;

        const processFile = (event: Event): void => {
            if (stream.isClosed) {
                return; // output stream was closed (somebody called TurnOff). We're done here.
            }

            stream.writeStreamChunk({
                buffer: reader.result as ArrayBuffer,
                isEnd: false,
                timeReceived: Date.now(),
            });
            stream.close();
        };

        reader.onload = processFile;

        reader.onerror = (event: ProgressEvent) => {
            const errorMsg = `Error occurred while processing '${this.privFile.name}'. ${event}`;
            this.onEvent(new AudioStreamNodeErrorEvent(this.privId, audioNodeId, errorMsg));
            throw new Error(errorMsg);
        };

        const chunk = this.privFile.slice(this.privHeaderEnd);
        reader.readAsArrayBuffer(chunk);

        return stream;
    }

    private onEvent = (event: AudioSourceEvent): void => {
        this.privEvents.onEvent(event);
        Events.instance.onEvent(event);
    }
}
