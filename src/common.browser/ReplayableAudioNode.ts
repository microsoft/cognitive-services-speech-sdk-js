// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// eslint-disable-next-line max-classes-per-file
import {
    IAudioStreamNode,
    IStreamChunk,
} from "../common/Exports.js";

export class ReplayableAudioNode implements IAudioStreamNode {
    private privAudioNode: IAudioStreamNode;
    private privBytesPerSecond: number;
    private privBuffers: BufferEntry[] = [];
    private privReplayOffset: number = 0;
    private privLastShrinkOffset: number = 0;
    private privBufferStartOffset: number = 0;
    private privBufferSerial: number = 0;
    private privBufferedBytes: number = 0;
    private privReplay: boolean = false;
    private privLastChunkAcquiredTime: number = 0;
    // Inline commit: byte positions in this node's domain (bytes read through the node since
    // it was created) used to place commits relative to the audio sent.
    private privLastReadEndBytes: number = 0;
    private privReplayStartBytes: number = 0;
    private privReplaySerial: number = 0;
    // A chunk without audio (commit marker or end of stream) read while a replay was
    // requested, returned once the replay is complete.
    private privHeldChunk: IStreamChunk<ArrayBuffer> = undefined;
    private privHasHeldChunk: boolean = false;

    public constructor(audioSource: IAudioStreamNode, bytesPerSecond: number) {
        this.privAudioNode = audioSource;
        this.privBytesPerSecond = bytesPerSecond;
    }

    public id(): string {
        return this.privAudioNode.id();
    }

    // Reads and returns the next chunk of audio buffer.
    // If replay of existing buffers are needed, read() will first seek and replay
    // existing content, and upoin completion it will read new content from the underlying
    // audio node, saving that content into the replayable buffers.
    public read(): Promise<IStreamChunk<ArrayBuffer>> {
        // if there is a replay request to honor.
        if (!!this.privReplay && this.privBuffers.length !== 0) {
            const { index: i, bytesIntoBuffer: bytesToSeek } = this.seekReplayPosition();

            if (i < this.privBuffers.length) {
                const retVal: ArrayBuffer = this.privBuffers[i].chunk.buffer.slice(bytesToSeek);
                this.privLastReadEndBytes = this.privBuffers[i].byteOffset + bytesToSeek + retVal.byteLength;

                this.privReplayOffset += (retVal.byteLength / this.privBytesPerSecond) * 1e+7;

                // If we've reached the end of the buffers, stop replaying.
                if (i === this.privBuffers.length - 1) {
                    this.privReplay = false;
                }

                return Promise.resolve<IStreamChunk<ArrayBuffer>>({
                    buffer: retVal,
                    isEnd: false,
                    timeReceived: this.privBuffers[i].chunk.timeReceived,
                });
            }
        }

        if (this.privHasHeldChunk) {
            const held: IStreamChunk<ArrayBuffer> = this.privHeldChunk;
            this.privHeldChunk = undefined;
            this.privHasHeldChunk = false;
            return Promise.resolve(held);
        }

        return this.privAudioNode.read()
            .then((result: IStreamChunk<ArrayBuffer>): IStreamChunk<ArrayBuffer> | Promise<IStreamChunk<ArrayBuffer>> => {
                if (result && result.buffer && this.privBuffers) {
                    this.privBuffers.push(new BufferEntry(result, this.privBufferSerial++, this.privBufferedBytes));
                    this.privBufferedBytes += result.buffer.byteLength;
                }

                // A replay was requested while this read was waiting for data. The replayed
                // audio comes first: new audio has been added to the replay buffers above and is
                // returned once, in order, at the end of the replay. A chunk without audio (a
                // commit marker or end of stream) is held until the replay is complete, since it
                // follows all the audio read before it.
                if (this.isReplayPending()) {
                    if (!result || !result.buffer) {
                        this.privHeldChunk = result;
                        this.privHasHeldChunk = true;
                    }
                    return this.read();
                }

                if (result && result.buffer) {
                    this.privLastReadEndBytes = this.privBufferedBytes;
                }
                return result;
            });
    }

    // Whether read() would return replayed audio.
    private isReplayPending(): boolean {
        return !!this.privReplay && this.privBuffers !== undefined && this.privBuffers.length !== 0 &&
            this.seekReplayPosition().index < this.privBuffers.length;
    }

    // Inline commit: total bytes of new (not replayed) audio read through this node. When a
    // commit marker is read, this is the position of the commit.
    public get bufferedBytes(): number {
        return this.privBufferedBytes;
    }

    // Inline commit: the position just after the audio returned by the latest read.
    public get lastReadEndBytes(): number {
        return this.privLastReadEndBytes;
    }

    // Inline commit: the position where the latest replay request starts (equal to
    // bufferedBytes if there is nothing to replay), and a counter of replay requests.
    public get replayStartBytes(): number {
        return this.privReplayStartBytes;
    }

    public get replaySerial(): number {
        return this.privReplaySerial;
    }

    public detach(): Promise<void> {
        this.privBuffers = undefined;
        return this.privAudioNode.detach();
    }

    public replay(): void {
        if (this.privBuffers && 0 !== this.privBuffers.length) {
            this.privReplay = true;
            this.privReplayOffset = this.privLastShrinkOffset;
        }
        this.privReplayStartBytes = this.findReplayStartBytes();
        this.privReplaySerial++;
    }

    // Same seek as in read(), expressed as a byte position.
    private findReplayStartBytes(): number {
        if (!this.privReplay || this.privBuffers === undefined || this.privBuffers.length === 0) {
            return this.privBufferedBytes;
        }

        const { index: i, bytesIntoBuffer: bytesToSeek } = this.seekReplayPosition();
        return i < this.privBuffers.length ? this.privBuffers[i].byteOffset + bytesToSeek : this.privBufferedBytes;
    }

    // Finds where the replay continues: the buffer index and the byte position within that
    // buffer that correspond to the current replay offset. An index equal to the number of
    // buffers means that there is nothing left to replay. Shared by read() and
    // findReplayStartBytes() so that commits are placed exactly where the replayed audio
    // starts. Requires privBuffers to be defined.
    private seekReplayPosition(): { index: number; bytesIntoBuffer: number } {
        // Offsets are in 100ns increments.
        // So how many bytes do we need to seek to get the right offset?
        const offsetToSeek: number = this.privReplayOffset - this.privBufferStartOffset;

        let bytesToSeek: number = Math.round(offsetToSeek * this.privBytesPerSecond * 1e-7);
        if (0 !== (bytesToSeek % 2)) {
            bytesToSeek++;
        }

        let i: number = 0;
        while (i < this.privBuffers.length && bytesToSeek >= this.privBuffers[i].chunk.buffer.byteLength) {
            bytesToSeek -= this.privBuffers[i++].chunk.buffer.byteLength;
        }

        return { bytesIntoBuffer: bytesToSeek, index: i };
    }

    // Shrinks the existing audio buffers to start at the new offset, or at the
    // beginning of the buffer closest to the requested offset.
    // A replay request will start from the last shrink point.
    public shrinkBuffers(offset: number): void {
        if (this.privBuffers === undefined || this.privBuffers.length === 0) {
            return;
        }

        // The shrink point must only ever advance; ignore a stale/duplicate offset so the
        // resume point never moves backwards.
        if (offset <= this.privLastShrinkOffset) {
            return;
        }

        this.privLastShrinkOffset = offset;

        // Find the start point in the buffers.
        // Offsets are in 100ns increments.
        // So how many bytes do we need to seek to get the right offset?
        const offsetToSeek: number = offset - this.privBufferStartOffset;

        let bytesToSeek: number = Math.round(offsetToSeek * this.privBytesPerSecond * 1e-7);

        let i: number = 0;

        while (i < this.privBuffers.length && bytesToSeek >= this.privBuffers[i].chunk.buffer.byteLength) {
            bytesToSeek -= this.privBuffers[i++].chunk.buffer.byteLength;
        }
        this.privBufferStartOffset = Math.round(offset - ((bytesToSeek / this.privBytesPerSecond) * 1e+7));
        this.privBuffers = this.privBuffers.slice(i);
    }

    // Finds the time a buffer of audio was first seen by offset.
    public findTimeAtOffset(offset: number): number {
        if (offset < this.privBufferStartOffset || this.privBuffers === undefined) {
            return 0;
        }

        for (const value of this.privBuffers) {
            const startOffset: number = (value.byteOffset / this.privBytesPerSecond) * 1e7;
            const endOffset: number = startOffset + ((value.chunk.buffer.byteLength / this.privBytesPerSecond) * 1e7);

            if (offset >= startOffset && offset <= endOffset) {
                return value.chunk.timeReceived;
            }
        }

        return 0;
    }
}

// Primary use of this class is to help debugging problems with the replay
// code. If the memory cost of alloc / dealloc gets too much, drop it and just use
// the ArrayBuffer directly.
class BufferEntry {
    public chunk: IStreamChunk<ArrayBuffer>;
    public serial: number;
    public byteOffset: number;

    public constructor(chunk: IStreamChunk<ArrayBuffer>, serial: number, byteOffset: number) {
        this.chunk = chunk;
        this.serial = serial;
        this.byteOffset = byteOffset;
    }
}
