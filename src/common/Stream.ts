// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InvalidOperationError } from "./Error.js";
import { createNoDashGuid } from "./Guid.js";
import { Queue } from "./Queue.js";

export interface IStreamChunk<TBuffer> {
    isEnd: boolean;
    buffer: TBuffer;
    timeReceived: number;
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

    private throwIfClosed(): void {
        if (this.privIsWriteEnded) {
            throw new InvalidOperationError("Stream closed");
        }
    }
}
