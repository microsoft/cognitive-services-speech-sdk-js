// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import {
    connectivity,
    ISpeechConfigAudioDevice,
    type,
} from "../../common.speech/Exports.js";
import {
    AudioSourceEvent,
    AudioSourceInitializingEvent,
    AudioSourceReadyEvent,
    AudioStreamNodeAttachedEvent,
    AudioStreamNodeAttachingEvent,
    AudioStreamNodeDetachedEvent,
    ChunkedArrayBufferStream,
    Events,
    EventSource,
    IAudioSource,
    IAudioStreamNode,
    IStreamChunk,
    Stream,
} from "../../common/Exports.js";
import { createNoDashGuid } from "../../common/Guid.js";
import { AudioStreamFormat, PullAudioInputStreamCallback } from "../Exports.js";
import { AudioStreamFormatImpl } from "./AudioStreamFormat.js";

/**
 * Represents audio input stream used for custom audio input configurations.
 * @class AudioInputStream
 */
export abstract class AudioInputStream {

    /**
     * Creates and initializes an instance.
     * @constructor
     */
    protected constructor() {
        return;
    }

    /**
     * Creates a memory backed PushAudioInputStream with the specified audio format.
     * @member AudioInputStream.createPushStream
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     * written to the push audio stream's write() method (Required if format is not 16 kHz 16bit mono PCM).
     * @returns {PushAudioInputStream} The audio input stream being created.
     */
    public static createPushStream(format?: AudioStreamFormat): PushAudioInputStream {
        return PushAudioInputStream.create(format);
    }

    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for read()
     * and close() methods.
     * @member AudioInputStream.createPullStream
     * @function
     * @public
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object, derived from
     * PullAudioInputStreamCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be returned from
     * the callback's read() method (Required if format is not 16 kHz 16bit mono PCM).
     * @returns {PullAudioInputStream} The audio input stream being created.
     */
    public static createPullStream(callback: PullAudioInputStreamCallback, format?: AudioStreamFormat): PullAudioInputStream {
        return PullAudioInputStream.create(callback, format);
        // throw new Error("Oops");
    }

    /**
     * Explicitly frees any external resource attached to the object
     * @member AudioInputStream.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;
}

/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @class PushAudioInputStream
 */
export abstract class PushAudioInputStream extends AudioInputStream {

    /**
     * Creates a memory backed PushAudioInputStream with the specified audio format.
     * @member PushAudioInputStream.create
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be written to the
     * push audio stream's write() method (Required if format is not 16 kHz 16bit mono PCM).
     * @returns {PushAudioInputStream} The push audio input stream being created.
     */
    public static create(format?: AudioStreamFormat): PushAudioInputStream {
        return new PushAudioInputStreamImpl(format);
    }

    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PushAudioInputStream.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The audio buffer of which this function will make a copy.
     */
    public abstract write(dataBuffer: ArrayBuffer): void;

    /**
     * Closes the stream.
     * @member PushAudioInputStream.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;
}

/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @private
 * @class PushAudioInputStreamImpl
 */
export class PushAudioInputStreamImpl extends PushAudioInputStream implements IAudioSource {

    private privFormat: AudioStreamFormatImpl;
    private privId: string;
    private privEvents: EventSource<AudioSourceEvent>;
    private privStream: Stream<ArrayBuffer>;

    /**
     * Creates and initalizes an instance with the given values.
     * @constructor
     * @param {AudioStreamFormat} format - The audio stream format.
     */
    public constructor(format?: AudioStreamFormat) {
        super();
        if (format === undefined) {
            this.privFormat = AudioStreamFormatImpl.getDefaultInputFormat();
        } else {
            this.privFormat = format as AudioStreamFormatImpl;
        }
        this.privEvents = new EventSource<AudioSourceEvent>();
        this.privId = createNoDashGuid();
        this.privStream = new ChunkedArrayBufferStream(this.privFormat.avgBytesPerSec / 10);
    }

    /**
     * Format information for the audio
     */
    public get format(): Promise<AudioStreamFormatImpl> {
        return Promise.resolve(this.privFormat);
    }

    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PushAudioInputStreamImpl.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The audio buffer of which this function will make a copy.
     */
    public write(dataBuffer: ArrayBuffer): void {
        this.privStream.writeStreamChunk({
            buffer: dataBuffer,
            isEnd: false,
            timeReceived: Date.now()
        });
    }

    /**
     * Closes the stream.
     * @member PushAudioInputStreamImpl.prototype.close
     * @function
     * @public
     */
    public close(): void {
        this.privStream.close();
    }

    public id(): string {
        return this.privId;
    }

    public turnOn(): Promise<void> {
        this.onEvent(new AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new AudioSourceReadyEvent(this.privId));
        return;
    }

    public async attach(audioNodeId: string): Promise<IAudioStreamNode> {
        this.onEvent(new AudioStreamNodeAttachingEvent(this.privId, audioNodeId));

        await this.turnOn();
        const stream = this.privStream;
        this.onEvent(new AudioStreamNodeAttachedEvent(this.privId, audioNodeId));
        return {
            detach: async (): Promise<void> => {
                this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
                return this.turnOff();
            },
            id: (): string => audioNodeId,
            read: (): Promise<IStreamChunk<ArrayBuffer>> => stream.read(),
        };
    }

    public detach(audioNodeId: string): void {
        this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
    }

    public turnOff(): Promise<void> {
        return;
    }

    public get events(): EventSource<AudioSourceEvent> {
        return this.privEvents;
    }

    public get deviceInfo(): Promise<ISpeechConfigAudioDevice> {
        return Promise.resolve({
            bitspersample: this.privFormat.bitsPerSample,
            channelcount: this.privFormat.channels,
            connectivity: connectivity.Unknown,
            manufacturer: "Speech SDK",
            model: "PushStream",
            samplerate: this.privFormat.samplesPerSec,
            type: type.Stream,
        });
    }

    private onEvent(event: AudioSourceEvent): void {
        this.privEvents.onEvent(event);
        Events.instance.onEvent(event);
    }

    private toBuffer(arrayBuffer: ArrayBuffer): Buffer {
        const buf: Buffer = Buffer.alloc(arrayBuffer.byteLength);
        const view: Uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < buf.length; ++i) {
            buf[i] = view[i];
        }
        return buf;
    }
}

/*
 * Represents audio input stream used for custom audio input configurations.
 * @class PullAudioInputStream
 */
export abstract class PullAudioInputStream extends AudioInputStream {
    /**
     * Creates and initializes and instance.
     * @constructor
     */
    protected constructor() {
 super();
}

    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for
     * read() and close() methods, using the default format (16 kHz 16bit mono PCM).
     * @member PullAudioInputStream.create
     * @function
     * @public
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object,
     * derived from PullAudioInputStreamCustomCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     * returned from the callback's read() method (Required if format is not 16 kHz 16bit mono PCM).
     * @returns {PullAudioInputStream} The push audio input stream being created.
     */
    public static create(callback: PullAudioInputStreamCallback, format?: AudioStreamFormat): PullAudioInputStream {
        return new PullAudioInputStreamImpl(callback, format as AudioStreamFormatImpl);
    }

    /**
     * Explicitly frees any external resource attached to the object
     * @member PullAudioInputStream.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;

}

/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class PullAudioInputStreamImpl
 */
export class PullAudioInputStreamImpl extends PullAudioInputStream implements IAudioSource {

    private privCallback: PullAudioInputStreamCallback;
    private privFormat: AudioStreamFormatImpl;
    private privId: string;
    private privEvents: EventSource<AudioSourceEvent>;
    private privIsClosed: boolean;
    private privBufferSize: number;

    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for
     * read() and close() methods, using the default format (16 kHz 16bit mono PCM).
     * @constructor
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object,
     * derived from PullAudioInputStreamCustomCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     * returned from the callback's read() method (Required if format is not 16 kHz 16bit mono PCM).
     */
    public constructor(callback: PullAudioInputStreamCallback, format?: AudioStreamFormatImpl) {
        super();
        if (undefined === format) {
            this.privFormat = AudioStreamFormat.getDefaultInputFormat() as AudioStreamFormatImpl;
        } else {
            this.privFormat = format;
        }
        this.privEvents = new EventSource<AudioSourceEvent>();
        this.privId = createNoDashGuid();
        this.privCallback = callback;
        this.privIsClosed = false;
        this.privBufferSize = this.privFormat.avgBytesPerSec / 10;
    }

    /**
     * Format information for the audio
     */
    public get format(): Promise<AudioStreamFormatImpl> {
        return Promise.resolve(this.privFormat);
    }

    /**
     * Closes the stream.
     * @member PullAudioInputStreamImpl.prototype.close
     * @function
     * @public
     */
    public close(): void {
        this.privIsClosed = true;
        this.privCallback.close();
    }

    public id(): string {
        return this.privId;
    }

    public turnOn(): Promise<void> {
        this.onEvent(new AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new AudioSourceReadyEvent(this.privId));
        return;
    }

    public async attach(audioNodeId: string): Promise<IAudioStreamNode> {
        this.onEvent(new AudioStreamNodeAttachingEvent(this.privId, audioNodeId));

        await this.turnOn();
        this.onEvent(new AudioStreamNodeAttachedEvent(this.privId, audioNodeId));
        return {
            detach: (): Promise<void> => {
                this.privCallback.close();
                this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
                return this.turnOff();
            },
            id: (): string => audioNodeId,
            read: (): Promise<IStreamChunk<ArrayBuffer>> => {
                let totalBytes: number = 0;
                let transmitBuff: ArrayBuffer;
                // Until we have the minimum number of bytes to send in a transmission, keep asking for more.
                while (totalBytes < this.privBufferSize) {
                    // Sizing the read buffer to the delta between the perfect size and what's left means we won't ever get too much
                    // data back.
                    const readBuff: ArrayBuffer = new ArrayBuffer(this.privBufferSize - totalBytes);
                    const pulledBytes: number = this.privCallback.read(readBuff);
                    // If there is no return buffer yet defined, set the return buffer to the that was just populated.
                    // This was, if we have enough data there's no copy penalty, but if we don't we have a buffer that's the
                    // preferred size allocated.
                    if (undefined === transmitBuff) {
                        transmitBuff = readBuff;
                    } else {
                        // Not the first bite at the apple, so fill the return buffer with the data we got back.
                        const intView: Int8Array = new Int8Array(transmitBuff);
                        intView.set(new Int8Array(readBuff), totalBytes);
                    }
                    // If there are no bytes to read, just break out and be done.
                    if (0 === pulledBytes) {
                        break;
                    }
                    totalBytes += pulledBytes;
                }
                return Promise.resolve<IStreamChunk<ArrayBuffer>>({
                    buffer: transmitBuff.slice(0, totalBytes),
                    isEnd: this.privIsClosed || totalBytes === 0,
                    timeReceived: Date.now(),
                });
            },
        };
    }

    public detach(audioNodeId: string): void {
        this.onEvent(new AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
    }

    public turnOff(): Promise<void> {
        return;
    }

    public get events(): EventSource<AudioSourceEvent> {
        return this.privEvents;
    }

    public get deviceInfo(): Promise<ISpeechConfigAudioDevice> {
        return Promise.resolve({
            bitspersample: this.privFormat.bitsPerSample,
            channelcount: this.privFormat.channels,
            connectivity: connectivity.Unknown,
            manufacturer: "Speech SDK",
            model: "PullStream",
            samplerate: this.privFormat.samplesPerSec,
            type: type.Stream,
        });
    }

    private onEvent(event: AudioSourceEvent): void {
        this.privEvents.onEvent(event);
        Events.instance.onEvent(event);
    }
}
