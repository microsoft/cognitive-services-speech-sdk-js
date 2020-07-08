// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InvalidOperationError } from "./Error";
import { createNoDashGuid } from "./Guid";
import { IStringDictionary } from "./IDictionary";
import { Promise } from "./Promise";
import { Queue } from "./Queue";

export interface IStreamChunk<TBuffer> {
    isEnd: boolean;
    buffer: TBuffer;
    timeReceived: number;
}

export class Stream<TBuffer> {
    private privId: string;
    private privIsEnded: boolean = false;
    private privReaderQueue: Queue<IStreamChunk<TBuffer>>;

    public constructor(streamId?: string) {
        this.privId = streamId ? streamId : createNoDashGuid();
        this.privReaderQueue = new Queue<IStreamChunk<TBuffer>>();
    }

    public get isClosed(): boolean {
        return this.privIsEnded;
    }

    public get id(): string {
        return this.privId;
    }

    public getReader = (): StreamReader<TBuffer> => {
        return new StreamReader(
            this.privId,
            this.privReaderQueue,
            () => {
                this.privReaderQueue = new Queue<IStreamChunk<TBuffer>>();
            });
    }

    public close(): void {
        if (!this.privIsEnded) {
            this.writeStreamChunk({
                buffer: null,
                isEnd: true,
                timeReceived: Date.now(),
            });
            this.privIsEnded = true;
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

    private throwIfClosed = (): void => {
        if (this.privIsEnded) {
            throw new InvalidOperationError("Stream closed");
        }
    }
}

// tslint:disable-next-line:max-classes-per-file
export class StreamReader<TBuffer> {
    private privReaderQueue: Queue<IStreamChunk<TBuffer>>;
    private privOnClose: () => void;
    private privIsClosed: boolean = false;
    private privStreamId: string;

    public constructor(streamId: string, readerQueue: Queue<IStreamChunk<TBuffer>>, onClose: () => void) {
        this.privReaderQueue = readerQueue;
        this.privOnClose = onClose;
        this.privStreamId = streamId;
    }

    public get isClosed(): boolean {
        return this.privIsClosed;
    }

    public get streamId(): string {
        return this.privStreamId;
    }

    public read = (): Promise<IStreamChunk<TBuffer>> => {
        if (this.isClosed) {
            throw new InvalidOperationError("StreamReader closed");
        }

        return this.privReaderQueue
            .dequeue()
            .onSuccessContinueWith((streamChunk: IStreamChunk<TBuffer>) => {
                if (streamChunk === undefined || streamChunk.isEnd) {
                    this.privReaderQueue.dispose("End of stream reached");
                }

                return streamChunk;
            });
    }

    public close = (): void => {
        if (!this.privIsClosed) {
            this.privIsClosed = true;
            this.privReaderQueue.dispose("StreamReader closed");
            this.privOnClose();
        }
    }
}
