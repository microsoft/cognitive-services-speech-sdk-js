import { Promise } from "./Promise";
import { Queue } from "./Queue";
import { IStreamChunk } from "./Stream";
export interface IStreamChunk<TBuffer> {
    isEnd: boolean;
    buffer: TBuffer;
}
export declare class Stream<TBuffer> {
    private privId;
    private privReaderIdCounter;
    private privStreambuffer;
    private privIsEnded;
    private privReaderQueues;
    constructor(streamId?: string);
    readonly isClosed: boolean;
    readonly id: string;
    write: (buffer2: TBuffer) => void;
    getReader: () => StreamReader<TBuffer>;
    close: () => void;
    private writeStreamChunk;
    private throwIfClosed;
}
export declare class StreamReader<TBuffer> {
    private privReaderQueue;
    private privOnClose;
    private privIsClosed;
    private privStreamId;
    constructor(streamId: string, readerQueue: Queue<IStreamChunk<TBuffer>>, onClose: () => void);
    readonly isClosed: boolean;
    readonly streamId: string;
    read: () => Promise<IStreamChunk<TBuffer>>;
    close: () => void;
}
