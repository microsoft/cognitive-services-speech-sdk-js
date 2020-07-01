// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/**
 * An abstract base class that defines callback methods (write() and close()) for
 * custom audio output streams).
 * @class PushAudioOutputStreamCallback
 */
export abstract class PushAudioOutputStreamCallback {

    /**
     * Writes audio data into the data buffer.
     * @member PushAudioOutputStreamCallback.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The byte array that stores the audio data to write.
     */
    public abstract write(dataBuffer: ArrayBuffer): void;

    /**
     * Closes the audio output stream.
     * @member PushAudioOutputStreamCallback.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;
}
