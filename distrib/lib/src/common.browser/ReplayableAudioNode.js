"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var ReplayableAudioNode = /** @class */ (function () {
    function ReplayableAudioNode(audioSource, format) {
        var _this = this;
        this.privBuffers = [];
        this.privReplayOffset = 0;
        this.privLastShrinkOffset = 0;
        this.privBufferStartOffset = 0;
        this.privBufferSerial = 0;
        this.privBufferedBytes = 0;
        this.privReplay = false;
        this.id = function () {
            return _this.privAudioNode.id();
        };
        this.privAudioNode = audioSource;
        this.privFormat = format;
    }
    // Reads and returns the next chunk of audio buffer.
    // If replay of existing buffers are needed, read() will first seek and replay
    // existing content, and upoin completion it will read new content from the underlying
    // audio node, saving that content into the replayable buffers.
    ReplayableAudioNode.prototype.read = function () {
        var _this = this;
        // if there is a replay request to honor.
        if (!!this.privReplay && this.privBuffers.length !== 0) {
            // Find the start point in the buffers.
            // Offsets are in 100ns increments.
            // So how many bytes do we need to seek to get the right offset?
            var offsetToSeek = this.privReplayOffset - this.privBufferStartOffset;
            var bytesToSeek = Math.round(offsetToSeek * this.privFormat.avgBytesPerSec * 1e-7);
            if (0 !== (bytesToSeek % 2)) {
                bytesToSeek++;
            }
            var i = 0;
            while (i < this.privBuffers.length && bytesToSeek >= this.privBuffers[i].buffer.byteLength) {
                bytesToSeek -= this.privBuffers[i++].buffer.byteLength;
            }
            var retVal = this.privBuffers[i].buffer.slice(bytesToSeek);
            this.privReplayOffset += (retVal.byteLength / this.privFormat.avgBytesPerSec) * 1e+7;
            // If we've reached the end of the buffers, stop replaying.
            if (i === this.privBuffers.length - 1) {
                this.privReplay = false;
            }
            return Exports_1.PromiseHelper.fromResult({
                buffer: retVal,
                isEnd: false,
            });
        }
        return this.privAudioNode.read()
            .onSuccessContinueWith(function (result) {
            if (result.buffer) {
                _this.privBuffers.push(new BufferEntry(result.buffer, _this.privBufferSerial++, _this.privBufferedBytes));
                _this.privBufferedBytes += result.buffer.byteLength;
            }
            return result;
        });
    };
    ReplayableAudioNode.prototype.detach = function () {
        this.privAudioNode.detach();
        this.privBuffers = undefined;
    };
    ReplayableAudioNode.prototype.replay = function () {
        if (0 !== this.privBuffers.length) {
            this.privReplay = true;
            this.privReplayOffset = this.privLastShrinkOffset;
        }
    };
    // Shrinks the existing audio buffers to start at the new offset, or at the
    // beginnign of the buffer closest to the requested offset.
    // A replay request will start from the last shrink point.
    ReplayableAudioNode.prototype.shrinkBuffers = function (offset) {
        this.privLastShrinkOffset = offset;
        // Find the start point in the buffers.
        // Offsets are in 100ns increments.
        // So how many bytes do we need to seek to get the right offset?
        var offsetToSeek = offset - this.privBufferStartOffset;
        var bytesToSeek = Math.round(offsetToSeek * this.privFormat.avgBytesPerSec * 1e-7);
        var i = 0;
        while (i < this.privBuffers.length && bytesToSeek >= this.privBuffers[i].buffer.byteLength) {
            bytesToSeek -= this.privBuffers[i++].buffer.byteLength;
        }
        this.privBufferStartOffset = Math.round(offset - ((bytesToSeek / this.privFormat.avgBytesPerSec) * 1e+7));
        this.privBuffers = this.privBuffers.slice(i);
    };
    return ReplayableAudioNode;
}());
exports.ReplayableAudioNode = ReplayableAudioNode;
// Primary use of this class is to help debugging problems with the replay
// code. If the memory cost of alloc / dealloc gets too much, drop it and just use
// the ArrayBuffer directly.
// tslint:disable-next-line:max-classes-per-file
var BufferEntry = /** @class */ (function () {
    function BufferEntry(buffer, serial, byteOffset) {
        this.buffer = buffer;
        this.serial = serial;
        this.byteOffset = byteOffset;
    }
    return BufferEntry;
}());

//# sourceMappingURL=ReplayableAudioNode.js.map
