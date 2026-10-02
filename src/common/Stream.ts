// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InvalidOperationError } from "./Error.js";
import { createNoDashGuid } from "./Guid.js";
import { Queue } from "./Queue.js";

// Inline commit: a request for a segmentation boundary, queued in a push stream
// between the audio written before and after it.
export interface ICommitMarker {
    token: number;
    // Undefined means all channels.
    channelId?: number;
    // Set when end of audio is signalled before the marker was read.
    discarded?: boolean;
    // Set when a recognition session has taken the marker over.
    delivered?: boolean;
}

export interface IStreamChunk<TBuffer> {
    isEnd: boolean;
    buffer: TBuffer;
    timeReceived: number;
    // Inline commit: set on a marker chunk, which carries no audio (buffer is null).
    // A marker chunk is not end of stream.
    commit?: ICommitMarker;
}

export class Stream<TBuffer> {
    private privId: string;
    private privIsWriteEnded: boolean = false;
    private privIsReadEnded: boolean = false;
    private privReaderQueue: Queue<IStreamChunk<TBuffer>>;

    public constructor(streamId?: string) {
        this.privId = streamId ? streamId : createNoDashGuid();
        this.privReaderQueue = new Queue<IStreamChunk<TBuffer>>();
    }

    public get isClosed(): boolean {
        return this.privIsWriteEnded;
    }

    public get isReadEnded(): boolean {
        return this.privIsReadEnded;
    }

    public get id(): string {
        return this.privId;
    }

    public close(): void {
        if (!this.privIsWriteEnded) {
            this.writeStreamChunk({
                buffer: null,
                isEnd: true,
                timeReceived: Date.now(),
            });
            this.privIsWriteEnded = true;
        }
    }

    public writeStreamChunk(streamChunk: IStreamChunk<TBuffer>): void {
        this.throwIfClosed();
        if (!this.privReaderQueue.isDisposed()) {
            try {
                this.privReaderQueue.enqueue(streamChunk);
            } catch (e) {
                // Do nothing
            }
        }
    }

    public read(): Promise<IStreamChunk<TBuffer>> {
        if (this.privIsReadEnded) {
            throw new InvalidOperationError("Stream read has already finished");
        }

        return this.privReaderQueue
            .dequeue()
            .then(async (streamChunk: IStreamChunk<TBuffer>): Promise<IStreamChunk<TBuffer>> => {
                if (streamChunk === undefined || streamChunk.isEnd) {
                    await this.privReaderQueue.dispose("End of stream reached");
                }

                return streamChunk;
            });
    }
    public readEnded(): void {
        if (!this.privIsReadEnded) {
            this.privIsReadEnded = true;
            this.privReaderQueue = new Queue<IStreamChunk<TBuffer>>();
        }
    }

    // Cancels reads that are waiting for data: data written later goes to the next reader.
    // The cancelled reads never complete. This is safe: nothing references them afterwards,
    // so they are garbage collected. They are deliberately not resolved with an end-of-stream
    // chunk, because read() disposes the reader queue on end of stream, which would end the
    // stream for the next reader as well (see Queue.cancelPendingDequeues).
    public cancelPendingReads(): void {
        this.privReaderQueue.cancelPendingDequeues();
    }

    private throwIfClosed(): void {
        if (this.privIsWriteEnded) {
            throw new InvalidOperationError("Stream closed");
        }
    }
}
