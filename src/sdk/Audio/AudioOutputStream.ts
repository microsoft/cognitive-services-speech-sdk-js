// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    createNoDashGuid,
    IAudioDestination,
    IStreamChunk,
    Stream,
    StreamReader,
} from "../../common/Exports";
import {Contracts} from "../Contracts";
import {
    AudioInputStream,
    AudioStreamFormat,
    PullAudioInputStreamCallback,
    PushAudioOutputStreamCallback
} from "../Exports";
import {AudioOutputFormatImpl} from "./AudioOutputFormat";

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

    public abstract set format(format: AudioStreamFormat);

    /**
     * Creates a memory backed PullAudioOutputStream with the specified audio format.
     * @member AudioInputStream.createPullStream
     * @function
     * @public
     * @returns {PullAudioOutputStream} The audio input stream being created.
     */
    public static createPullStream(): PullAudioOutputStream {
        return PullAudioOutputStream.create();
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
     * @returns {PullAudioOutputStream} The push audio input stream being created.
     */
    public static create(): PullAudioOutputStream {
        return new PullAudioOutputStreamImpl();
    }

    /**
     * Reads audio data from the internal buffer.
     * @member PullAudioOutputStream.prototype.read
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - An ArrayBuffer to store the read data.
     * @returns {number} Audio buffer length has been read.
     */
    public abstract read(dataBuffer: ArrayBuffer): number;

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
export class PullAudioOutputStreamImpl extends PullAudioOutputStream implements IAudioDestination {
    private privFormat: AudioOutputFormatImpl;
    private privId: string;
    private privStream: Stream<ArrayBuffer>;
    private streamReader: StreamReader<ArrayBuffer>;
    private privLastChunkView: Int8Array;

    /**
     * Creates and initializes an instance with the given values.
     * @constructor
     */
    public constructor() {
        super();
        this.privId = createNoDashGuid();
        this.privStream = new Stream<ArrayBuffer>();
        this.streamReader = this.privStream.getReader();
    }

    /**
     * Sets the format information to the stream. For internal use only.
     * @param {AudioStreamFormat} format - the format to be set.
     */
    public set format(format: AudioStreamFormat) {
        if (format === undefined || format === null) {
            this.privFormat = AudioOutputFormatImpl.getDefaultOutputFormat();
        }
        this.privFormat = format as AudioOutputFormatImpl;
    }

    /**
     * Format information for the audio
     */
    public get format(): AudioStreamFormat {
        return this.privFormat;
    }

    /**
     * Checks if the stream is closed
     * @member PullAudioOutputStreamImpl.prototype.isClosed
     * @property
     * @public
     */
    public get isClosed(): boolean {
        return this.privStream.isClosed;
    }

    /**
     * Gets the id of the stream
     * @member PullAudioOutputStreamImpl.prototype.id
     * @property
     * @public
     */
    public id(): string {
        return this.privId;
    }

    /**
     * Reads audio data from the internal buffer.
     * @member PullAudioOutputStreamImpl.prototype.read
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - An ArrayBuffer to store the read data.
     * @returns {number} - Audio buffer length has been read.
     */
    public read(dataBuffer: ArrayBuffer): number {
        const intView: Int8Array = new Int8Array(dataBuffer);
        let totalBytes: number = 0;

        if (this.privLastChunkView !== undefined) {
            if (this.privLastChunkView.length > dataBuffer.byteLength) {
                intView.set(this.privLastChunkView.slice(0, dataBuffer.byteLength));
                this.privLastChunkView = this.privLastChunkView.slice(dataBuffer.byteLength);
                return dataBuffer.byteLength;
            }
            intView.set(this.privLastChunkView);
            totalBytes = this.privLastChunkView.length;
            this.privLastChunkView = undefined;
        }

        let isEnded = false;
        // Until we have the minimum number of bytes to send in a transmission, keep asking for more.
        while (totalBytes < dataBuffer.byteLength && !isEnded) {
            this.streamReader.read()
                .onSuccessContinueWith((chunk: IStreamChunk<ArrayBuffer>) => {
                    if (chunk === undefined || chunk.isEnd) {
                        isEnded = true;
                    } else {
                        let tmpBuffer: ArrayBuffer;
                        if (chunk.buffer.byteLength > dataBuffer.byteLength - totalBytes) {
                            tmpBuffer = chunk.buffer.slice(0, dataBuffer.byteLength - totalBytes);
                            this.privLastChunkView = new Int8Array(chunk.buffer.slice(dataBuffer.byteLength - totalBytes));
                        } else {
                            tmpBuffer = chunk.buffer;
                        }
                        intView.set(new Int8Array(tmpBuffer), totalBytes);
                        totalBytes += tmpBuffer.byteLength;
                    }
                });
        }

        return totalBytes;
    }

    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PullAudioOutputStreamImpl.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The audio buffer of which this function will make a copy.
     */
    public write(dataBuffer: ArrayBuffer): void {
        Contracts.throwIfNullOrUndefined(this.privStream, "must set format before writing");
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
}

/*
 * Represents audio input stream used for custom audio input configurations.
 * @class PullAudioInputStream
 */
// tslint:disable-next-line:max-classes-per-file
export abstract class PushAudioOutputStream extends AudioOutputStream {
    /**
     * Creates and initializes and instance.
     * @constructor
     */
    protected constructor() { super(); }

    /**
     * Creates a PushAudioOutputStream that delegates to the specified callback interface for
     * write() and close() methods.
     * @member PushAudioOutputStream.create
     * @function
     * @public
     * @param {PushAudioOutputStreamCallback} callback - The custom audio output object,
     *        derived from PushAudioOutputStreamCallback
     * @returns {PushAudioOutputStream} The push audio output stream being created.
     */
    public static create(callback: PushAudioOutputStreamCallback): PushAudioOutputStream {
        return new PushAudioOutputStreamImpl(callback);
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
 * Represents audio output stream used for custom audio output configurations.
 * @private
 * @class PushAudioOutputStreamImpl
 */
// tslint:disable-next-line:max-classes-per-file
export class PushAudioOutputStreamImpl extends PushAudioOutputStream implements IAudioDestination {
    private readonly privId: string;
    private privCallback: PushAudioOutputStreamCallback;

    /**
     * Creates a PushAudioOutputStream that delegates to the specified callback interface for
     * read() and close() methods.
     * @constructor
     * @param {PushAudioOutputStreamCallback} callback - The custom audio output object,
     *        derived from PushAudioOutputStreamCallback
     */
    public constructor(callback: PushAudioOutputStreamCallback) {
        super();
        this.privId = createNoDashGuid();
        this.privCallback = callback;
    }

    // tslint:disable-next-line:no-empty
    public set format(format: AudioStreamFormat) {}

    public write(buffer: ArrayBuffer): void {
        if (!!this.privCallback.write) {
            this.privCallback.write(buffer);
        }
    }

    public close(): void {
        if (!!this.privCallback.close) {
            this.privCallback.close();
        }
    }

    public id(): string {
        return this.privId;
    }
}
