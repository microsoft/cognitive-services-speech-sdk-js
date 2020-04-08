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
    IStringDictionary,
    Promise,
    PromiseHelper,
    Stream,
    StreamReader,
} from "../common/Exports";
import { AudioStreamFormat, AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";

export class FileAudioSource implements IAudioSource {

    private privAudioFormatPromise: Promise<AudioStreamFormatImpl>;

    private privStreams: IStringDictionary<Stream<ArrayBuffer>> = {};

    private privId: string;

    private privEvents: EventSource<AudioSourceEvent>;

    private privFile: File;

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

    public turnOn = (): Promise<boolean> => {
        if (typeof FileReader === "undefined") {
            const errorMsg = "Browser does not support FileReader.";
            this.onEvent(new AudioSourceErrorEvent(errorMsg, "")); // initialization error - no streamid at this point
            return PromiseHelper.fromError<boolean>(errorMsg);
        } else if (this.privFile.name.lastIndexOf(".wav") !== this.privFile.name.length - 4) {
            const errorMsg = this.privFile.name + " is not supported. Only WAVE files are allowed at the moment.";
            this.onEvent(new AudioSourceErrorEvent(errorMsg, ""));
            return PromiseHelper.fromError<boolean>(errorMsg);
        }

        this.onEvent(new AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new AudioSourceReadyEvent(this.privId));
        return PromiseHelper.fromResult(true);
    }

    public id = (): string => {
        return this.privId;
    }

    public attach = (audioNodeId: string): Promise<IAudioStreamNode> => {
        this.onEvent(new AudioStreamNodeAttachingEvent(this.privId, audioNodeId));

        return this.upload(audioNodeId).onSuccessContinueWith<IAudioStreamNode>(
            (streamReader: StreamReader<ArrayBuffer>) => {
                this.onEvent(new AudioStreamNodeAttachedEvent(this.privId, audioNodeId));
                return {
                    detach: () => {
                        streamReader.close();
                        delete this.privStreams[audioNodeId];
                        this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
                        this.turnOff();
                    },
                    id: () => {
                        return audioNodeId;
                    },
                    read: () => {
                        return streamReader.read();
                    },
                };
            });
    }

    public detach = (audioNodeId: string): void => {
        if (audioNodeId && this.privStreams[audioNodeId]) {
            this.privStreams[audioNodeId].close();
            delete this.privStreams[audioNodeId];
            this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
        }
    }

    public turnOff = (): Promise<boolean> => {
        for (const streamId in this.privStreams) {
            if (streamId) {
                const stream = this.privStreams[streamId];
                if (stream && !stream.isClosed) {
                    stream.close();
                }
            }
        }

        this.onEvent(new AudioSourceOffEvent(this.privId)); // no stream now
        return PromiseHelper.fromResult(true);
    }

    public get events(): EventSource<AudioSourceEvent> {
        return this.privEvents;
    }

    public get deviceInfo(): Promise<ISpeechConfigAudioDevice> {
        return this.privAudioFormatPromise.onSuccessContinueWithPromise<ISpeechConfigAudioDevice>((result: AudioStreamFormatImpl) => {
            return PromiseHelper.fromResult({
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

    private readHeader = (): Promise<AudioStreamFormatImpl> => {
        // Read the wave header.
        const header: Blob = this.privFile.slice(0, 44);
        const headerReader: FileReader = new FileReader();

        const headerResult: Deferred<AudioStreamFormatImpl> = new Deferred<AudioStreamFormatImpl>();

        const processHeader = (event: Event): void => {
            const header: ArrayBuffer = (event.target as FileReader).result as ArrayBuffer;

            const view: DataView = new DataView(header);

            // RIFF 4 bytes.
            const riff: string = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
            if ("RIFF" !== riff) {
                headerResult.reject("Invalid WAV header in file, RIFF was not found");
            }

            // length, 4 bytes
            // RIFF Type & fmt 8 bytes
            const type: string = String.fromCharCode(
                view.getUint8(8),
                view.getUint8(9),
                view.getUint8(10),
                view.getUint8(11),
                view.getUint8(12),
                view.getUint8(13),
                view.getUint8(14));
            if ("WAVEfmt" !== type) {
                headerResult.reject("Invalid WAV header in file, WAVEfmt was not found");
            }

            const channelCount: number = view.getUint16(22, true);
            const sampleRate: number = view.getUint32(24, true);
            const bitsPerSample: number = view.getUint16(34, true);

            headerResult.resolve(AudioStreamFormat.getWaveFormatPCM(sampleRate, bitsPerSample, channelCount) as AudioStreamFormatImpl);

        };

        headerReader.onload = processHeader;
        headerReader.readAsArrayBuffer(header);
        return headerResult.promise();
    }

    private upload = (audioNodeId: string): Promise<StreamReader<ArrayBuffer>> => {
        return this.turnOn()
            .onSuccessContinueWithPromise<StreamReader<ArrayBuffer>>((_: boolean) => {
                return this.privAudioFormatPromise.onSuccessContinueWith<StreamReader<ArrayBuffer>>((format: AudioStreamFormatImpl) => {
                    const fileStream: ChunkedArrayBufferStream = new ChunkedArrayBufferStream(3200);

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

                    const chunk = this.privFile.slice(44);
                    reader.readAsArrayBuffer(chunk);

                    return stream.getReader();
                });
            });

    }

    private onEvent = (event: AudioSourceEvent): void => {
        this.privEvents.onEvent(event);
        Events.instance.onEvent(event);
    }
}
