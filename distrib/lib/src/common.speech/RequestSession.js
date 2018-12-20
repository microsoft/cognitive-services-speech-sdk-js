"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var RecognitionEvents_1 = require("./RecognitionEvents");
var ServiceTelemetryListener_Internal_1 = require("./ServiceTelemetryListener.Internal");
var RequestSession = /** @class */ (function () {
    function RequestSession(audioSourceId, contextJson) {
        var _this = this;
        this.privIsDisposed = false;
        this.privDetachables = new Array();
        this.privIsAudioNodeDetached = false;
        this.privIsCompleted = false;
        this.privIsSpeechEnded = false;
        this.privIsCanceled = false;
        this.privTurnStartAudioOffset = 0;
        this.privLastRecoOffset = 0;
        this.onAudioSourceAttachCompleted = function (audioNode, isError, error) {
            _this.privAudioNode = audioNode;
            if (isError) {
                _this.onComplete();
            }
            else {
                _this.onEvent(new RecognitionEvents_1.ListeningStartedEvent(_this.privRequestId, _this.privSessionId, _this.privAudioSourceId, _this.privAudioNodeId));
            }
        };
        this.onPreConnectionStart = function (authFetchEventId, connectionId) {
            _this.privAuthFetchEventId = authFetchEventId;
            _this.privSessionId = connectionId;
            _this.onEvent(new RecognitionEvents_1.ConnectingToServiceEvent(_this.privRequestId, _this.privAuthFetchEventId, _this.privSessionId));
        };
        this.onAuthCompleted = function (isError, error) {
            if (isError) {
                _this.onComplete();
            }
        };
        this.onConnectionEstablishCompleted = function (statusCode, reason) {
            if (statusCode === 200) {
                _this.onEvent(new RecognitionEvents_1.RecognitionStartedEvent(_this.requestId, _this.privAudioSourceId, _this.privAudioNodeId, _this.privAuthFetchEventId, _this.privSessionId));
                _this.privAudioNode.replay();
                _this.privTurnStartAudioOffset = _this.privLastRecoOffset;
                return;
            }
            else if (statusCode === 403) {
                _this.onComplete();
            }
            else {
                _this.onComplete();
            }
        };
        this.onServiceTurnEndResponse = function (continuousRecognition) {
            if (!continuousRecognition || _this.isSpeechEnded) {
                _this.onComplete();
            }
            else {
                // Start a new request set.
                _this.privTurnStartAudioOffset = _this.privLastRecoOffset;
                _this.privRequestId = Exports_1.createNoDashGuid();
                _this.privAudioNode.replay();
            }
        };
        this.dispose = function (error) {
            if (!_this.privIsDisposed) {
                // we should have completed by now. If we did not its an unknown error.
                _this.privIsDisposed = true;
                for (var _i = 0, _a = _this.privDetachables; _i < _a.length; _i++) {
                    var detachable = _a[_i];
                    detachable.detach();
                }
                _this.privServiceTelemetryListener.dispose();
            }
        };
        this.getTelemetry = function () {
            return _this.privServiceTelemetryListener.getTelemetry();
        };
        this.onEvent = function (event) {
            _this.privServiceTelemetryListener.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        this.onComplete = function () {
            if (!_this.privIsCompleted) {
                _this.privIsCompleted = true;
                _this.detachAudioNode();
            }
        };
        this.detachAudioNode = function () {
            if (!_this.privIsAudioNodeDetached) {
                _this.privIsAudioNodeDetached = true;
                if (_this.privAudioNode) {
                    _this.privAudioNode.detach();
                }
            }
        };
        this.privAudioSourceId = audioSourceId;
        this.privRequestId = Exports_1.createNoDashGuid();
        this.privAudioNodeId = Exports_1.createNoDashGuid();
        this.privRequestCompletionDeferral = new Exports_1.Deferred();
        this.privContextJson = contextJson;
        this.privServiceTelemetryListener = new ServiceTelemetryListener_Internal_1.ServiceTelemetryListener(this.privRequestId, this.privAudioSourceId, this.privAudioNodeId);
        this.onEvent(new RecognitionEvents_1.RecognitionTriggeredEvent(this.requestId, this.privSessionId, this.privAudioSourceId, this.privAudioNodeId));
    }
    Object.defineProperty(RequestSession.prototype, "contextJson", {
        get: function () {
            return this.privContextJson;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "sessionId", {
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "requestId", {
        get: function () {
            return this.privRequestId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "completionPromise", {
        get: function () {
            return this.privRequestCompletionDeferral.promise();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "isSpeechEnded", {
        get: function () {
            return this.privIsSpeechEnded;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "isCompleted", {
        get: function () {
            return this.privIsCompleted;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "isCanceled", {
        get: function () {
            return this.privIsCanceled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RequestSession.prototype, "currentTurnAudioOffset", {
        get: function () {
            return this.privTurnStartAudioOffset;
        },
        enumerable: true,
        configurable: true
    });
    RequestSession.prototype.listenForServiceTelemetry = function (eventSource) {
        this.privDetachables.push(eventSource.attachListener(this.privServiceTelemetryListener));
    };
    RequestSession.prototype.onServiceRecognized = function (offset) {
        this.privLastRecoOffset = offset;
        this.privAudioNode.shrinkBuffers(offset);
    };
    RequestSession.prototype.onCancelled = function () {
        this.privIsCanceled = true;
    };
    // Should be called with the audioNode for this session has indicated that it is out of speech.
    RequestSession.prototype.onSpeechEnded = function () {
        this.privIsSpeechEnded = true;
    };
    return RequestSession;
}());
exports.RequestSession = RequestSession;

//# sourceMappingURL=RequestSession.js.map
