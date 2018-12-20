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
var Exports_1 = require("../../common.browser/Exports");
var Exports_2 = require("../Exports");
var AudioInputStream_1 = require("./AudioInputStream");
/**
 * Represents audio input configuration used for specifying what type of input to use (microphone, file, stream).
 * @class AudioConfig
 */
var AudioConfig = /** @class */ (function () {
    function AudioConfig() {
    }
    /**
     * Creates an AudioConfig object representing the default microphone on the system.
     * @member AudioConfig.fromDefaultMicrophoneInput
     * @function
     * @public
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromDefaultMicrophoneInput = function () {
        var pcmRecorder = new Exports_1.PcmRecorder();
        return new AudioConfigImpl(new Exports_1.MicAudioSource(pcmRecorder));
    };
    /**
     * Creates an AudioConfig object representing a microphone on the system based on the specified constraints.
     * @member AudioConfig.fromMicrophoneInput
     * @function
     * @public
     * @param {MediaStreamConstraints} constraints A MediaStreamConstraints object specifying the requirements for microphone media device.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromMicrophoneInput = function (constraints) {
        var pcmRecorder = new Exports_1.PcmRecorder();
        return new AudioConfigImpl(new Exports_1.MicAudioSource(pcmRecorder, constraints));
    };
    /**
     * Creates an AudioConfig object representing the specified file.
     * @member AudioConfig.fromWavFileInput
     * @function
     * @public
     * @param {File} fileName - Specifies the audio input file. Currently, only WAV / PCM with 16-bit
     *        samples, 16 kHz sample rate, and a single channel (Mono) is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromWavFileInput = function (file) {
        return new AudioConfigImpl(new Exports_1.FileAudioSource(file));
    };
    /**
     * Creates an AudioConfig object representing the specified stream.
     * @member AudioConfig.fromStreamInput
     * @function
     * @public
     * @param {AudioInputStream | PullAudioInputStreamCallback} audioStream - Specifies the custom audio input
     *        stream. Currently, only WAV / PCM with 16-bit samples, 16 kHz sample rate, and a single channel
     *        (Mono) is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    AudioConfig.fromStreamInput = function (audioStream) {
        if (audioStream instanceof Exports_2.PullAudioInputStreamCallback) {
            return new AudioConfigImpl(new AudioInputStream_1.PullAudioInputStreamImpl(audioStream));
        }
        if (audioStream instanceof Exports_2.AudioInputStream) {
            return new AudioConfigImpl(audioStream);
        }
        throw new Error("Not Supported Type");
    };
    return AudioConfig;
}());
exports.AudioConfig = AudioConfig;
/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class AudioConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
var AudioConfigImpl = /** @class */ (function (_super) {
    __extends(AudioConfigImpl, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {IAudioSource} source - An audio source.
     */
    function AudioConfigImpl(source) {
        var _this = _super.call(this) || this;
        _this.privSource = source;
        return _this;
    }
    Object.defineProperty(AudioConfigImpl.prototype, "format", {
        /**
         * Format information for the audio
         */
        get: function () {
            return this.privSource.format;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @member AudioConfigImpl.prototype.close
     * @function
     * @public
     */
    AudioConfigImpl.prototype.close = function () {
        this.privSource.turnOff();
    };
    /**
     * @member AudioConfigImpl.prototype.id
     * @function
     * @public
     */
    AudioConfigImpl.prototype.id = function () {
        return this.privSource.id();
    };
    /**
     * @member AudioConfigImpl.prototype.turnOn
     * @function
     * @public
     * @returns {Promise<boolean>} A promise.
     */
    AudioConfigImpl.prototype.turnOn = function () {
        return this.privSource.turnOn();
    };
    /**
     * @member AudioConfigImpl.prototype.attach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     * @returns {Promise<IAudioStreamNode>} A promise.
     */
    AudioConfigImpl.prototype.attach = function (audioNodeId) {
        return this.privSource.attach(audioNodeId);
    };
    /**
     * @member AudioConfigImpl.prototype.detach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     */
    AudioConfigImpl.prototype.detach = function (audioNodeId) {
        return this.detach(audioNodeId);
    };
    /**
     * @member AudioConfigImpl.prototype.turnOff
     * @function
     * @public
     * @returns {Promise<boolean>} A promise.
     */
    AudioConfigImpl.prototype.turnOff = function () {
        return this.privSource.turnOff();
    };
    Object.defineProperty(AudioConfigImpl.prototype, "events", {
        /**
         * @member AudioConfigImpl.prototype.events
         * @function
         * @public
         * @returns {EventSource<AudioSourceEvent>} An event source for audio events.
         */
        get: function () {
            return this.privSource.events;
        },
        enumerable: true,
        configurable: true
    });
    return AudioConfigImpl;
}(AudioConfig));
exports.AudioConfigImpl = AudioConfigImpl;

//# sourceMappingURL=AudioConfig.js.map
