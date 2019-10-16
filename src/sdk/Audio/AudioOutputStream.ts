// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createNoDashGuid } from "../../../src/common/Guid";
import {
    ChunkedArrayBufferStream,
    IStreamChunk,
    Promise,
    PromiseHelper,
    Stream,
    StreamReader,
} from "../../common/Exports";
import { AudioStreamFormat, PushAudioOutputStreamCallback } from "../Exports";
import { AudioStreamFormatImpl } from "./AudioStreamFormat";

export const bufferSize: number = 4096;

/**
 * Represents audio input stream used for custom audio input configurations.
 * @class AudioInputStream
 */
export abstract class AudioOutputStream {

    /**
     * Creates and initializes an instance.
     * @constructor
     */
    protected constructor() { }

    /**
     * Creates a memory backed PullAudioOutputStream with the specified audio format.
     * @member AudioInputStream.createPushStream
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        written to the push audio stream's write() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PullAudioOutputStream} The audio input stream being created.
     */
    public static createPushStream(format?: AudioStreamFormat): PullAudioOutputStream {
        return PullAudioOutputStream.create(format);
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
 * @class PullAudioOutputStream
 */
// tslint:disable-next-line:max-classes-per-file
export abstract class PullAudioOutputStream extends AudioOutputStream {

    /**
     * Creates a memory backed PullAudioOutputStream with the specified audio format.
     * @member PullAudioOutputStream.create
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be written to the
     *        push audio stream's write() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PullAudioOutputStream} The push audio input stream being created.
     */
    public static create(format?: AudioStreamFormat): PullAudioOutputStream {
        return new PullAudioOutputStreamImpl(bufferSize, format);
    }

    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PullAudioOutputStream.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The audio buffer of which this function will make a copy.
     */
    public abstract write(dataBuffer: ArrayBuffer): void;

    /**
     * Closes the stream.
     * @member PullAudioOutputStream.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;
}

/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @private
 * @class PullAudioOutputStreamImpl
 */
// tslint:disable-next-line:max-classes-per-file
export class PullAudioOutputStreamImpl extends PullAudioOutputStream {

    private privFormat: AudioStreamFormatImpl;
    private privId: string;
    private privStream: Stream<ArrayBuffer>;
    private streamReader: StreamReader<ArrayBuffer>;

    /**
     * Creates and initalizes an instance with the given values.
     * @constructor
     * @param {AudioStreamFormat} format - The audio stream format.
     */
    public constructor(chunkSize: number, format?: AudioStreamFormat) {
        super();
        if (format === undefined) {
            this.privFormat = AudioStreamFormatImpl.getDefaultInputFormat();
        } else {
            this.privFormat = format as AudioStreamFormatImpl;
        }

        this.privId = createNoDashGuid();
        this.privStream = new ChunkedArrayBufferStream(chunkSize);
        this.streamReader = this.privStream.getReader();
    }

    /**
     * Format information for the audio
     */
    public get format(): AudioStreamFormat {
        return this.privFormat;
    }

    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PullAudioOutputStreamImpl.prototype.write
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
     * @member PullAudioOutputStreamImpl.prototype.close
     * @function
     * @public
     */
    public close(): void {
        this.privStream.close();
    }

    public id(): string {
        return this.privId;
    }

    public read(): Promise<ArrayBuffer> {
        return this.streamReader.read()
            .onSuccessContinueWithPromise<ArrayBuffer>((chunk: IStreamChunk<ArrayBuffer>) => {
                return PromiseHelper.fromResult(chunk.buffer);
            });
    }
}
