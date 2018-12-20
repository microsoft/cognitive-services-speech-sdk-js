"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Guid_1 = require("../../../src/common/Guid");
var Exports_1 = require("../../common/Exports");
var Exports_2 = require("../Exports");
var AudioStreamFormat_1 = require("./AudioStreamFormat");
var bufferSize = 4096;
/**
 * Represents audio input stream used for custom audio input configurations.
 * @class AudioInputStream
 */
var AudioInputStream = /** @class */ (function () {
    /**
     * Creates and initializes an instance.
     * @constructor
     */
    function AudioInputStream() {
    }
    /**
     * Creates a memory backed PushAudioInputStream with the specified audio format.
     * @member AudioInputStream.createPushStream
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        written to the push audio stream's write() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PushAudioInputStream} The audio input stream being created.
     */
    AudioInputStream.createPushStream = function (format) {
        return PushAudioInputStream.create(format);
    };
    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for read()
     * and close() methods.
     * @member AudioInputStream.createPullStream
     * @function
     * @public
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object, derived from
     *        PullAudioInputStreamCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be returned from
     *        the callback's read() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PullAudioInputStream} The audio input stream being created.
     */
    AudioInputStream.createPullStream = function (callback, format) {
        return PullAudioInputStream.create(callback, format);
        // throw new Error("Oops");
    };
    return AudioInputStream;
}());
exports.AudioInputStream = AudioInputStream;
/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @class PushAudioInputStream
 */
// tslint:disable-next-line:max-classes-per-file
var PushAudioInputStream = /** @class */ (function (_super) {
    __extends(PushAudioInputStream, _super);
    function PushAudioInputStream() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Creates a memory backed PushAudioInputStream with the specified audio format.
     * @member PushAudioInputStream.create
     * @function
     * @public
     * @param {AudioStreamFormat} format - The audio data format in which audio will be written to the
     *        push audio stream's write() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PushAudioInputStream} The push audio input stream being created.
     */
    PushAudioInputStream.create = function (format) {
        return new PushAudioInputStreamImpl(format);
    };
    return PushAudioInputStream;
}(AudioInputStream));
exports.PushAudioInputStream = PushAudioInputStream;
/**
 * Represents memory backed push audio input stream used for custom audio input configurations.
 * @private
 * @class PushAudioInputStreamImpl
 */
// tslint:disable-next-line:max-classes-per-file
var PushAudioInputStreamImpl = /** @class */ (function (_super) {
    __extends(PushAudioInputStreamImpl, _super);
    /**
     * Creates and initalizes an instance with the given values.
     * @constructor
     * @param {AudioStreamFormat} format - The audio stream format.
     */
    function PushAudioInputStreamImpl(format) {
        var _this = _super.call(this) || this;
        _this.privStream = new Exports_1.Stream();
        _this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        if (format === undefined) {
            _this.privFormat = AudioStreamFormat_1.AudioStreamFormatImpl.getDefaultInputFormat();
        }
        else {
            _this.privFormat = format;
        }
        _this.privEvents = new Exports_1.EventSource();
        _this.privId = Guid_1.createNoDashGuid();
        return _this;
    }
    Object.defineProperty(PushAudioInputStreamImpl.prototype, "format", {
        /**
         * Format information for the audio
         */
        get: function () {
            return this.privFormat;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Writes the audio data specified by making an internal copy of the data.
     * @member PushAudioInputStreamImpl.prototype.write
     * @function
     * @public
     * @param {ArrayBuffer} dataBuffer - The audio buffer of which this function will make a copy.
     */
    PushAudioInputStreamImpl.prototype.write = function (dataBuffer) {
        // Break the data up into smaller chunks if needed.
        var i;
        for (i = bufferSize - 1; i < dataBuffer.byteLength; i += bufferSize) {
            this.privStream.write(dataBuffer.slice(i - (bufferSize - 1), i + 1));
        }
        if ((i - (bufferSize - 1)) !== dataBuffer.byteLength) {
            this.privStream.write(dataBuffer.slice(i - (bufferSize - 1), dataBuffer.byteLength));
        }
    };
    /**
     * Closes the stream.
     * @member PushAudioInputStreamImpl.prototype.close
     * @function
     * @public
     */
    PushAudioInputStreamImpl.prototype.close = function () {
        this.privStream.close();
    };
    PushAudioInputStreamImpl.prototype.id = function () {
        return this.privId;
    };
    PushAudioInputStreamImpl.prototype.turnOn = function () {
        this.onEvent(new Exports_1.AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new Exports_1.AudioSourceReadyEvent(this.privId));
        return Exports_1.PromiseHelper.fromResult(true);
    };
    PushAudioInputStreamImpl.prototype.attach = function (audioNodeId) {
        var _this = this;
        this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(this.privId, audioNodeId));
        return this.turnOn()
            .onSuccessContinueWith(function (_) {
            // For now we support a single parallel reader of the pushed stream.
            // So we can simiply hand the stream to the recognizer and let it recognize.
            return _this.privStream.getReader();
        })
            .onSuccessContinueWith(function (streamReader) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
            return {
                detach: function () {
                    streamReader.close();
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
    PushAudioInputStreamImpl.prototype.detach = function (audioNodeId) {
        this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
    };
    PushAudioInputStreamImpl.prototype.turnOff = function () {
        return Exports_1.PromiseHelper.fromResult(false);
    };
    Object.defineProperty(PushAudioInputStreamImpl.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    return PushAudioInputStreamImpl;
}(PushAudioInputStream));
exports.PushAudioInputStreamImpl = PushAudioInputStreamImpl;
/*
 * Represents audio input stream used for custom audio input configurations.
 * @class PullAudioInputStream
 */
// tslint:disable-next-line:max-classes-per-file
var PullAudioInputStream = /** @class */ (function (_super) {
    __extends(PullAudioInputStream, _super);
    /**
     * Creates and initializes and instance.
     * @constructor
     */
    function PullAudioInputStream() {
        return _super.call(this) || this;
    }
    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for
     * read() and close() methods, using the default format (16 kHz 16bit mono PCM).
     * @member PullAudioInputStream.create
     * @function
     * @public
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object,
     *        derived from PullAudioInputStreamCustomCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        returned from the callback's read() method (currently only support 16 kHz 16bit mono PCM).
     * @returns {PullAudioInputStream} The push audio input stream being created.
     */
    PullAudioInputStream.create = function (callback, format) {
        return new PullAudioInputStreamImpl(callback, format);
    };
    return PullAudioInputStream;
}(AudioInputStream));
exports.PullAudioInputStream = PullAudioInputStream;
/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class PullAudioInputStreamImpl
 */
// tslint:disable-next-line:max-classes-per-file
var PullAudioInputStreamImpl = /** @class */ (function (_super) {
    __extends(PullAudioInputStreamImpl, _super);
    /**
     * Creates a PullAudioInputStream that delegates to the specified callback interface for
     * read() and close() methods, using the default format (16 kHz 16bit mono PCM).
     * @constructor
     * @param {PullAudioInputStreamCallback} callback - The custom audio input object,
     *        derived from PullAudioInputStreamCustomCallback
     * @param {AudioStreamFormat} format - The audio data format in which audio will be
     *        returned from the callback's read() method (currently only support 16 kHz 16bit mono PCM).
     */
    function PullAudioInputStreamImpl(callback, format) {
        var _this = _super.call(this) || this;
        _this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        if (undefined === format) {
            _this.privFormat = Exports_2.AudioStreamFormat.getDefaultInputFormat();
        }
        else {
            _this.privFormat = format;
        }
        _this.privEvents = new Exports_1.EventSource();
        _this.privId = Guid_1.createNoDashGuid();
        _this.privCallback = callback;
        _this.privIsClosed = false;
        return _this;
    }
    Object.defineProperty(PullAudioInputStreamImpl.prototype, "format", {
        /**
         * Format information for the audio
         */
        get: function () {
            return this.privFormat;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Closes the stream.
     * @member PullAudioInputStreamImpl.prototype.close
     * @function
     * @public
     */
    PullAudioInputStreamImpl.prototype.close = function () {
        this.privIsClosed = true;
        this.privCallback.close();
    };
    PullAudioInputStreamImpl.prototype.id = function () {
        return this.privId;
    };
    PullAudioInputStreamImpl.prototype.turnOn = function () {
        this.onEvent(new Exports_1.AudioSourceInitializingEvent(this.privId)); // no stream id
        this.onEvent(new Exports_1.AudioSourceReadyEvent(this.privId));
        return Exports_1.PromiseHelper.fromResult(true);
    };
    PullAudioInputStreamImpl.prototype.attach = function (audioNodeId) {
        var _this = this;
        this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(this.privId, audioNodeId));
        return this.turnOn()
            .onSuccessContinueWith(function (result) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachedEvent(_this.privId, audioNodeId));
            return {
                detach: function () {
                    _this.privCallback.close();
                    _this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(_this.privId, audioNodeId));
                    _this.turnOff();
                },
                id: function () {
                    return audioNodeId;
                },
                read: function () {
                    var readBuff = new ArrayBuffer(bufferSize);
                    var pulledBytes = _this.privCallback.read(readBuff);
                    return Exports_1.PromiseHelper.fromResult({
                        buffer: readBuff.slice(0, pulledBytes),
                        isEnd: _this.privIsClosed,
                    });
                },
            };
        });
    };
    PullAudioInputStreamImpl.prototype.detach = function (audioNodeId) {
        this.onEvent(new Exports_1.AudioStreamNodeDetachedEvent(this.privId, audioNodeId));
    };
    PullAudioInputStreamImpl.prototype.turnOff = function () {
        return Exports_1.PromiseHelper.fromResult(false);
    };
    Object.defineProperty(PullAudioInputStreamImpl.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    return PullAudioInputStreamImpl;
}(PullAudioInputStream));
exports.PullAudioInputStreamImpl = PullAudioInputStreamImpl;

//# sourceMappingURL=AudioInputStream.js.map
