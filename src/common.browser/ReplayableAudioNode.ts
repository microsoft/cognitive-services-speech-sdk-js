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
            // Find the start point in the buffers.
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

            if (i < this.privBuffers.length) {
                const retVal: ArrayBuffer = this.privBuffers[i].chunk.buffer.slice(bytesToSeek);

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

        return this.privAudioNode.read()
            .then((result: IStreamChunk<ArrayBuffer>): IStreamChunk<ArrayBuffer> => {
                if (result && result.buffer) {
                    this.privBuffers.push(new BufferEntry(result, this.privBufferSerial++, this.privBufferedBytes));
                    this.privBufferedBytes += result.buffer.byteLength;
                }
                return result;
            });
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
    }

    // Shrinks the existing audio buffers to start at the new offset, or at the
    // beginning of the buffer closest to the requested offset.
    // A replay request will start from the last shrink point.
    public shrinkBuffers(offset: number): void {
        if (this.privBuffers === undefined || this.privBuffers.length === 0) {
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
