"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var PcmRecorder = /** @class */ (function () {
    function PcmRecorder() {
        var _this = this;
        this.record = function (context, mediaStream, outputStream) {
            var desiredSampleRate = 16000;
            var scriptNode = (function () {
                var bufferSize = 0;
                try {
                    return context.createScriptProcessor(bufferSize, 1, 1);
                }
                catch (error) {
                    // Webkit (<= version 31) requires a valid bufferSize.
                    bufferSize = 2048;
                    var audioSampleRate = context.sampleRate;
                    while (bufferSize < 16384 && audioSampleRate >= (2 * desiredSampleRate)) {
                        bufferSize <<= 1;
                        audioSampleRate >>= 1;
                    }
                    return context.createScriptProcessor(bufferSize, 1, 1);
                }
            })();
            var waveStreamEncoder = new Exports_1.RiffPcmEncoder(context.sampleRate, desiredSampleRate);
            var needHeader = true;
            var that = _this;
            scriptNode.onaudioprocess = function (event) {
                var inputFrame = event.inputBuffer.getChannelData(0);
                if (outputStream && !outputStream.isClosed) {
                    var waveFrame = waveStreamEncoder.encode(needHeader, inputFrame);
                    if (!!waveFrame) {
                        outputStream.write(waveFrame);
                        needHeader = false;
                    }
                }
            };
            var micInput = context.createMediaStreamSource(mediaStream);
            _this.privMediaResources = {
                scriptProcessorNode: scriptNode,
                source: micInput,
                stream: mediaStream,
            };
            micInput.connect(scriptNode);
            scriptNode.connect(context.destination);
        };
        this.releaseMediaResources = function (context) {
            if (_this.privMediaResources) {
                if (_this.privMediaResources.scriptProcessorNode) {
                    _this.privMediaResources.scriptProcessorNode.disconnect(context.destination);
                    _this.privMediaResources.scriptProcessorNode = null;
                }
                if (_this.privMediaResources.source) {
                    _this.privMediaResources.source.disconnect();
                    _this.privMediaResources.stream.getTracks().forEach(function (track) { return track.stop(); });
                    _this.privMediaResources.source = null;
                }
            }
        };
    }
    return PcmRecorder;
}());
exports.PcmRecorder = PcmRecorder;

//# sourceMappingURL=PCMRecorder.js.map
