"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var Guid_1 = require("./Guid");
var Queue_1 = require("./Queue");
var Stream = /** @class */ (function () {
    function Stream(streamId) {
        var _this = this;
        this.privReaderIdCounter = 1;
        this.privIsEnded = false;
        this.write = function (buffer2) {
            _this.throwIfClosed();
            _this.writeStreamChunk({
                buffer: buffer2,
                isEnd: false,
            });
        };
        this.getReader = function () {
            var readerId = _this.privReaderIdCounter;
            _this.privReaderIdCounter++;
            var readerQueue = new Queue_1.Queue();
            var currentLength = _this.privStreambuffer.length;
            _this.privReaderQueues[readerId] = readerQueue;
            for (var i = 0; i < currentLength; i++) {
                readerQueue.enqueue(_this.privStreambuffer[i]);
            }
            return new StreamReader(_this.privId, readerQueue, function () {
                delete _this.privReaderQueues[readerId];
            });
        };
        this.close = function () {
            if (!_this.privIsEnded) {
                _this.writeStreamChunk({
                    buffer: null,
                    isEnd: true,
                });
                _this.privIsEnded = true;
            }
        };
        this.writeStreamChunk = function (streamChunk) {
            _this.throwIfClosed();
            _this.privStreambuffer.push(streamChunk);
            for (var readerId in _this.privReaderQueues) {
                if (!_this.privReaderQueues[readerId].isDisposed()) {
                    try {
                        _this.privReaderQueues[readerId].enqueue(streamChunk);
                    }
                    catch (e) {
                        // Do nothing
                    }
                }
            }
        };
        this.throwIfClosed = function () {
            if (_this.privIsEnded) {
                throw new Error_1.InvalidOperationError("Stream closed");
            }
        };
        this.privId = streamId ? streamId : Guid_1.createNoDashGuid();
        this.privStreambuffer = [];
        this.privReaderQueues = {};
    }
    Object.defineProperty(Stream.prototype, "isClosed", {
        get: function () {
            return this.privIsEnded;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Stream.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    return Stream;
}());
exports.Stream = Stream;
// tslint:disable-next-line:max-classes-per-file
var StreamReader = /** @class */ (function () {
    function StreamReader(streamId, readerQueue, onClose) {
        var _this = this;
        this.privIsClosed = false;
        this.read = function () {
            if (_this.isClosed) {
                throw new Error_1.InvalidOperationError("StreamReader closed");
            }
            return _this.privReaderQueue
                .dequeue()
                .onSuccessContinueWith(function (streamChunk) {
                if (streamChunk.isEnd) {
                    _this.privReaderQueue.dispose("End of stream reached");
                }
                return streamChunk;
            });
        };
        this.close = function () {
            if (!_this.privIsClosed) {
                _this.privIsClosed = true;
                _this.privReaderQueue.dispose("StreamReader closed");
                _this.privOnClose();
            }
        };
        this.privReaderQueue = readerQueue;
        this.privOnClose = onClose;
        this.privStreamId = streamId;
    }
    Object.defineProperty(StreamReader.prototype, "isClosed", {
        get: function () {
            return this.privIsClosed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(StreamReader.prototype, "streamId", {
        get: function () {
            return this.privStreamId;
        },
        enumerable: true,
        configurable: true
    });
    return StreamReader;
}());
exports.StreamReader = StreamReader;

//# sourceMappingURL=Stream.js.map
