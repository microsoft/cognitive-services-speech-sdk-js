"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AudioStreamFormat_1 = require("../../src/sdk/Audio/AudioStreamFormat");
var Exports_1 = require("../common/Exports");
var FileAudioSource = /** @class */ (function () {
    function FileAudioSource(file, audioSourceId) {
        var _this = this;
        this.privStreams = {};
        this.turnOn = function () {
            if (typeof FileReader === "undefined") {
                var errorMsg = "Browser does not support FileReader.";
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, "")); // initialization error - no streamid at this point
                return Exports_1.PromiseHelper.fromError(errorMsg);
            }
            else if (_this.privFile.name.lastIndexOf(".wav") !== _this.privFile.name.length - 4) {
                var errorMsg = _this.privFile.name + " is not supported. Only WAVE files are allowed at the moment.";
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, ""));
                return Exports_1.PromiseHelper.fromError(errorMsg);
            }
            else if (_this.privFile.size > FileAudioSource.MAX_SIZE) {
                var errorMsg = _this.privFile.name + " exceeds the maximum allowed file size (" + FileAudioSource.MAX_SIZE + ").";
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, ""));
                return Exports_1.PromiseHelper.fromError(errorMsg);
            }
            _this.onEvent(new Exports_1.AudioSourceInitializingEvent(_this.privId)); // no stream id
            _this.onEvent(new Exports_1.AudioSourceReadyEvent(_this.privId));
            return Exports_1.PromiseHelper.fromResult(true);
        };
        this.id = function () {
            return _this.privId;
        };
        this.attach = function (audioNodeId) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(_this.privId, audioNodeId));
            return _this.upload(audioNodeId).onSuccessContinueWith(function (streamReader) {
                _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
                return {
                    detach: function () {
                        streamReader.close();
                        delete _this.privStreams[audioNodeId];
                        _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
                        _this.turnOff();
                    },
                    id: function () {
                        return audioNodeId;
                    },
                    read: function () {
                        return streamReader.read();
                    },
                };
            });
        };
        this.detach = function (audioNodeId) {
            if (audioNodeId && _this.privStreams[audioNodeId]) {
                _this.privStreams[audioNodeId].close();
                delete _this.privStreams[audioNodeId];
                _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
            }
        };
        this.turnOff = function () {
            for (var streamId in _this.privStreams) {
                if (streamId) {
                    var stream = _this.privStreams[streamId];
                    if (stream && !stream.isClosed) {
                        stream.close();
                    }
                }
            }
            _this.onEvent(new Exports_1.AudioSourceOffEvent(_this.privId)); // no stream now
            return Exports_1.PromiseHelper.fromResult(true);
        };
        this.upload = function (audioNodeId) {
            return _this.turnOn()
                .onSuccessContinueWith(function (_) {
                var stream = new Exports_1.Stream(audioNodeId);
                _this.privStreams[audioNodeId] = stream;
                var reader = new FileReader();
                var startOffset = 0;
                var endOffset = FileAudioSource.CHUNK_SIZE;
                var processNextChunk = function (event) {
                    if (stream.isClosed) {
                        return; // output stream was closed (somebody called TurnOff). We're done here.
                    }
                    stream.write(reader.result);
                    if (endOffset < _this.privFile.size) {
                        startOffset = endOffset;
                        endOffset = Math.min(endOffset + FileAudioSource.CHUNK_SIZE, _this.privFile.size);
                        var chunk_1 = _this.privFile.slice(startOffset, endOffset);
                        reader.readAsArrayBuffer(chunk_1);
                    }
                    else {
                        // we've written the entire file to the output stream, can close it now.
                        stream.close();
                    }
                };
                reader.onload = processNextChunk;
                reader.onerror = function (event) {
                    var errorMsg = "Error occurred while processing '" + _this.privFile.name + "'. " + event;
                    _this.onEvent(new Exports_1.AudioStreamNodeErrorEvent(_this.privId, audioNodeId, errorMsg));
                    throw new Error(errorMsg);
                };
                var chunk = _this.privFile.slice(startOffset, endOffset);
                reader.readAsArrayBuffer(chunk);
                return stream.getReader();
            });
        };
        this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        this.privId = audioSourceId ? audioSourceId : Exports_1.createNoDashGuid();
        this.privEvents = new Exports_1.EventSource();
        this.privFile = file;
    }
    Object.defineProperty(FileAudioSource.prototype, "format", {
        get: function () {
            return FileAudioSource.FILEFORMAT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FileAudioSource.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    // Recommended sample rate (bytes/second).
    FileAudioSource.SAMPLE_RATE = 16000 * 2; // 16 kHz * 16 bits
    // We should stream audio at no faster than 2x real-time (i.e., send five chunks
    // per second, with the chunk size == sample rate in bytes per second * 2 / 5).
    FileAudioSource.CHUNK_SIZE = FileAudioSource.SAMPLE_RATE * 2 / 5;
    FileAudioSource.UPLOAD_INTERVAL = 200; // milliseconds
    // 10 seconds of audio in bytes =
    // sample rate (bytes/second) * 600 (seconds) + 44 (size of the wave header).
    FileAudioSource.MAX_SIZE = FileAudioSource.SAMPLE_RATE * 600 + 44;
    FileAudioSource.FILEFORMAT = AudioStreamFormat_1.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
    return FileAudioSource;
}());
exports.FileAudioSource = FileAudioSource;

//# sourceMappingURL=FileAudioSource.js.map
