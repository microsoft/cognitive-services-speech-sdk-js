// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Stream } from "./Exports";

export class ChunkedArrayBufferStream extends Stream<ArrayBuffer> {
    private privTargetChunkSize: number;
    private privNextBufferToWrite: ArrayBuffer;
    private privNextBufferReadyBytes: number;

    constructor(targetChunkSize: number, streamId?: string) {
        super(streamId);
        this.privTargetChunkSize = targetChunkSize;
        this.privNextBufferReadyBytes = 0;
    }

    public write(buffer: ArrayBuffer): void {
        // No pending write, and the buffer is the right size so write it.
        if (0 === this.privNextBufferReadyBytes &&
            buffer.byteLength === this.privTargetChunkSize) {
            super.write(buffer);
        }

        let bytesCopiedFromBuffer: number = 0;

        while (bytesCopiedFromBuffer < buffer.byteLength) {
            // Fill the next buffer.
            if (undefined === this.privNextBufferToWrite) {
                this.privNextBufferToWrite = new ArrayBuffer(this.privTargetChunkSize);
            }

            // Find out how many bytes we can copy into the read buffer.
            const bytesToCopy: number = Math.min(buffer.byteLength - bytesCopiedFromBuffer, this.privTargetChunkSize - this.privNextBufferReadyBytes);
            const targetView: Uint8Array = new Uint8Array(this.privNextBufferToWrite);
            const sourceView: Uint8Array = new Uint8Array(buffer.slice(bytesCopiedFromBuffer, bytesToCopy + bytesCopiedFromBuffer));

            targetView.set(sourceView, this.privNextBufferReadyBytes);
            this.privNextBufferReadyBytes += bytesToCopy;
            bytesCopiedFromBuffer += bytesToCopy;

            // Are we ready to write?
            if (this.privNextBufferReadyBytes === this.privTargetChunkSize) {
                super.write(this.privNextBufferToWrite);
                this.privNextBufferToWrite = new ArrayBuffer(this.privTargetChunkSize);
                this.privNextBufferReadyBytes = 0;
            }
        }
    }

    public close(): void {
        // Send whatever is pending, then close the base class.
        if (0 !== this.privNextBufferReadyBytes && !this.isClosed) {
            super.write(this.privNextBufferToWrite.slice(0, this.privNextBufferReadyBytes));
        }

        super.close();
    }
}
