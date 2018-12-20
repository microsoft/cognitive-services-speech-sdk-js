"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AudioStreamFormat_1 = require("../../src/sdk/Audio/AudioStreamFormat");
var Exports_1 = require("../common/Exports");
var MicAudioSource = /** @class */ (function () {
    function MicAudioSource(privRecorder, constraints, audioSourceId) {
        var _this = this;
        this.privRecorder = privRecorder;
        this.privStreams = {};
        this.turnOn = function () {
            if (_this.privInitializeDeferral) {
                return _this.privInitializeDeferral.promise();
            }
            _this.privInitializeDeferral = new Exports_1.Deferred();
            _this.createAudioContext();
            var nav = window.navigator;
            var getUserMedia = (nav.getUserMedia ||
                nav.webkitGetUserMedia ||
                nav.mozGetUserMedia ||
                nav.msGetUserMedia);
            if (!!nav.mediaDevices) {
                getUserMedia = function (constraints, successCallback, errorCallback) {
                    nav.mediaDevices
                        .getUserMedia(constraints)
                        .then(successCallback)
                        .catch(errorCallback);
                };
            }
            if (!getUserMedia) {
                var errorMsg = "Browser does not support getUserMedia.";
                _this.privInitializeDeferral.reject(errorMsg);
                _this.onEvent(new Exports_1.AudioSourceErrorEvent(errorMsg, "")); // mic initialized error - no streamid at this point
            }
            else {
                var next = function () {
                    _this.onEvent(new Exports_1.AudioSourceInitializingEvent(_this.privId)); // no stream id
                    getUserMedia(_this.privConstraints, function (mediaStream) {
                        _this.privMediaStream = mediaStream;
                        _this.onEvent(new Exports_1.AudioSourceReadyEvent(_this.privId));
                        _this.privInitializeDeferral.resolve(true);
                    }, function (error) {
                        var errorMsg = "Error occurred during microphone initialization: " + error;
                        var tmp = _this.privInitializeDeferral;
                        // HACK: this should be handled through onError callbacks of all promises up the stack.
                        // Unfortunately, the current implementation does not provide an easy way to reject promises
                        // without a lot of code replication.
                        // TODO: fix promise implementation, allow for a graceful reject chaining.
                        _this.privInitializeDeferral = null;
                        tmp.reject(errorMsg); // this will bubble up through the whole chain of promises,
                        // with each new level adding extra "Unhandled callback error" prefix to the error message.
                        // The following line is not guaranteed to be executed.
                        _this.onEvent(new Exports_1.AudioSourceErrorEvent(_this.privId, errorMsg));
                    });
                };
                if (_this.privContext.state === "suspended") {
                    // NOTE: On iOS, the Web Audio API requires sounds to be triggered from an explicit user action.
                    // https://github.com/WebAudio/web-audio-api/issues/790
                    _this.privContext.resume().then(next, function (reason) {
                        _this.privInitializeDeferral.reject("Failed to initialize audio context: " + reason);
                    });
                }
                else {
                    next();
                }
            }
            return _this.privInitializeDeferral.promise();
        };
        this.id = function () {
            return _this.privId;
        };
        this.attach = function (audioNodeId) {
            _this.onEvent(new Exports_1.AudioStreamNodeAttachingEvent(_this.privId, audioNodeId));
            return _this.listen(audioNodeId).onSuccessContinueWith(function (streamReader) {
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
                    if (stream) {
                        stream.close();
                    }
                }
            }
            _this.onEvent(new Exports_1.AudioSourceOffEvent(_this.privId)); // no stream now
            _this.privInitializeDeferral = null;
            _this.destroyAudioContext();
            return Exports_1.PromiseHelper.fromResult(true);
        };
        this.listen = function (audioNodeId) {
            return _this.turnOn()
                .onSuccessContinueWith(function (_) {
                var stream = new Exports_1.Stream(audioNodeId);
                _this.privStreams[audioNodeId] = stream;
                try {
                    _this.privRecorder.record(_this.privContext, _this.privMediaStream, stream);
                }
                catch (error) {
                    _this.onEvent(new Exports_1.AudioStreamNodeErrorEvent(_this.privId, audioNodeId, error));
                    throw error;
                }
                return stream.getReader();
            });
        };
        this.onEvent = function (event) {
            _this.privEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        this.createAudioContext = function () {
            if (!!_this.privContext) {
                return;
            }
            // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
            var AudioContext = (window.AudioContext)
                || (window.webkitAudioContext)
                || false;
            if (!AudioContext) {
                throw new Error("Browser does not support Web Audio API (AudioContext is not available).");
            }
            _this.privContext = new AudioContext();
        };
        this.destroyAudioContext = function () {
            if (!_this.privContext) {
                return;
            }
            _this.privRecorder.releaseMediaResources(_this.privContext);
            // This pattern brought to you by a bug in the TypeScript compiler where it
            // confuses the ("close" in this.privContext) with this.privContext always being null as the alternate.
            // https://github.com/Microsoft/TypeScript/issues/11498
            var hasClose = false;
            if ("close" in _this.privContext) {
                hasClose = true;
            }
            if (hasClose) {
                _this.privContext.close();
                _this.privContext = null;
            }
            else if (null !== _this.privContext && _this.privContext.state === "running") {
                // Suspend actually takes a callback, but analogous to the
                // resume method, it'll be only fired if suspend is called
                // in a direct response to a user action. The later is not always
                // the case, as TurnOff is also called, when we receive an
                // end-of-speech message from the service. So, doing a best effort
                // fire-and-forget here.
                _this.privContext.suspend();
            }
        };
        this.privId = audioSourceId ? audioSourceId : Exports_1.createNoDashGuid();
        this.privEvents = new Exports_1.EventSource();
        this.privConstraints = constraints || { audio: true, video: false };
    }
    Object.defineProperty(MicAudioSource.prototype, "format", {
        get: function () {
            return MicAudioSource.AUDIOFORMAT;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MicAudioSource.prototype, "events", {
        get: function () {
            return this.privEvents;
        },
        enumerable: true,
        configurable: true
    });
    MicAudioSource.AUDIOFORMAT = AudioStreamFormat_1.AudioStreamFormat.getDefaultInputFormat();
    return MicAudioSource;
}());
exports.MicAudioSource = MicAudioSource;

//# sourceMappingURL=MicAudioSource.js.map
