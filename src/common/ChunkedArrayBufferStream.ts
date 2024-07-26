// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IStreamChunk, Stream } from "./Exports.js";

export class ChunkedArrayBufferStream extends Stream<ArrayBuffer> {
    private privTargetChunkSize: number;
    private privNextBufferToWrite: ArrayBuffer;
    private privNextBufferStartTime: number;
    private privNextBufferReadyBytes: number;

    public constructor(targetChunkSize: number, streamId?: string) {
        super(streamId);
        this.privTargetChunkSize = Math.round(targetChunkSize);
        this.privNextBufferReadyBytes = 0;
    }

    public writeStreamChunk(chunk: IStreamChunk<ArrayBuffer>): void {
        // No pending write, and the buffer is the right size so write it.
        if (chunk.isEnd ||
            (0 === this.privNextBufferReadyBytes && chunk.buffer.byteLength === this.privTargetChunkSize)) {
            super.writeStreamChunk(chunk);
            return;
        }

        let bytesCopiedFromBuffer: number = 0;

        while (bytesCopiedFromBuffer < chunk.buffer.byteLength) {
            // Fill the next buffer.
            if (undefined === this.privNextBufferToWrite) {
                this.privNextBufferToWrite = new ArrayBuffer(this.privTargetChunkSize);
                this.privNextBufferStartTime = chunk.timeReceived;
            }

            // Find out how many bytes we can copy into the read buffer.
            const bytesToCopy: number = Math.min(chunk.buffer.byteLength - bytesCopiedFromBuffer, this.privTargetChunkSize - this.privNextBufferReadyBytes);
            const targetView: Uint8Array = new Uint8Array(this.privNextBufferToWrite);
            const sourceView: Uint8Array = new Uint8Array(chunk.buffer.slice(bytesCopiedFromBuffer, bytesToCopy + bytesCopiedFromBuffer));

            targetView.set(sourceView, this.privNextBufferReadyBytes);
            this.privNextBufferReadyBytes += bytesToCopy;
            bytesCopiedFromBuffer += bytesToCopy;

            // Are we ready to write?
            if (this.privNextBufferReadyBytes === this.privTargetChunkSize) {
                super.writeStreamChunk({
                    buffer: this.privNextBufferToWrite,
                    isEnd: false,
                    timeReceived: this.privNextBufferStartTime,
                });
                this.privNextBufferReadyBytes = 0;
                this.privNextBufferToWrite = undefined;
            }
        }
    }

    public close(): void {
        // Send whatever is pending, then close the base class.
        if (0 !== this.privNextBufferReadyBytes && !this.isClosed) {
            super.writeStreamChunk({
                buffer: this.privNextBufferToWrite.slice(0, this.privNextBufferReadyBytes),
                isEnd: false,
                timeReceived: this.privNextBufferStartTime,
            });
        }

        super.close();
    }
}
