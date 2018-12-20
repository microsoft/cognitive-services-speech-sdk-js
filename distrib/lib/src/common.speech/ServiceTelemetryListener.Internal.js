"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var RecognitionEvents_1 = require("./RecognitionEvents");
// tslint:disable-next-line:max-classes-per-file
var ServiceTelemetryListener = /** @class */ (function () {
    function ServiceTelemetryListener(requestId, audioSourceId, audioNodeId) {
        var _this = this;
        this.privIsDisposed = false;
        this.privListeningTriggerMetric = null;
        this.privMicMetric = null;
        this.privConnectionEstablishMetric = null;
        this.onEvent = function (e) {
            if (_this.privIsDisposed) {
                return;
            }
            if (e instanceof RecognitionEvents_1.RecognitionTriggeredEvent && e.requestId === _this.privRequestId) {
                _this.privListeningTriggerMetric = {
                    End: e.eventTime,
                    Name: "ListeningTrigger",
                    Start: e.eventTime,
                };
            }
            if (e instanceof Exports_1.AudioStreamNodeAttachingEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                _this.privMicStartTime = e.eventTime;
            }
            if (e instanceof Exports_1.AudioStreamNodeAttachedEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                _this.privMicStartTime = e.eventTime;
            }
            if (e instanceof Exports_1.AudioSourceErrorEvent && e.audioSourceId === _this.privAudioSourceId) {
                if (!_this.privMicMetric) {
                    _this.privMicMetric = {
                        End: e.eventTime,
                        Error: e.error,
                        Name: "Microphone",
                        Start: _this.privMicStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.AudioStreamNodeErrorEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                if (!_this.privMicMetric) {
                    _this.privMicMetric = {
                        End: e.eventTime,
                        Error: e.error,
                        Name: "Microphone",
                        Start: _this.privMicStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.AudioStreamNodeDetachedEvent && e.audioSourceId === _this.privAudioSourceId && e.audioNodeId === _this.privAudioNodeId) {
                if (!_this.privMicMetric) {
                    _this.privMicMetric = {
                        End: e.eventTime,
                        Name: "Microphone",
                        Start: _this.privMicStartTime,
                    };
                }
            }
            if (e instanceof RecognitionEvents_1.ConnectingToServiceEvent && e.requestId === _this.privRequestId) {
                _this.privConnectionId = e.sessionId;
            }
            if (e instanceof Exports_1.ConnectionStartEvent && e.connectionId === _this.privConnectionId) {
                _this.privConnectionStartTime = e.eventTime;
            }
            if (e instanceof Exports_1.ConnectionEstablishedEvent && e.connectionId === _this.privConnectionId) {
                if (!_this.privConnectionEstablishMetric) {
                    _this.privConnectionEstablishMetric = {
                        End: e.eventTime,
                        Id: _this.privConnectionId,
                        Name: "Connection",
                        Start: _this.privConnectionStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.ConnectionEstablishErrorEvent && e.connectionId === _this.privConnectionId) {
                if (!_this.privConnectionEstablishMetric) {
                    _this.privConnectionEstablishMetric = {
                        End: e.eventTime,
                        Error: _this.getConnectionError(e.statusCode),
                        Id: _this.privConnectionId,
                        Name: "Connection",
                        Start: _this.privConnectionStartTime,
                    };
                }
            }
            if (e instanceof Exports_1.ConnectionMessageReceivedEvent && e.connectionId === _this.privConnectionId) {
                if (e.message && e.message.headers && e.message.headers.path) {
                    if (!_this.privReceivedMessages[e.message.headers.path]) {
                        _this.privReceivedMessages[e.message.headers.path] = new Array();
                    }
                    _this.privReceivedMessages[e.message.headers.path].push(e.networkReceivedTime);
                }
            }
        };
        this.getTelemetry = function () {
            var metrics = new Array();
            if (_this.privListeningTriggerMetric) {
                metrics.push(_this.privListeningTriggerMetric);
            }
            if (_this.privMicMetric) {
                metrics.push(_this.privMicMetric);
            }
            if (_this.privConnectionEstablishMetric) {
                metrics.push(_this.privConnectionEstablishMetric);
            }
            var telemetry = {
                Metrics: metrics,
                ReceivedMessages: _this.privReceivedMessages,
            };
            var json = JSON.stringify(telemetry);
            // We dont want to send the same telemetry again. So clean those out.
            _this.privReceivedMessages = {};
            _this.privListeningTriggerMetric = null;
            _this.privMicMetric = null;
            _this.privConnectionEstablishMetric = null;
            return json;
        };
        this.dispose = function () {
            _this.privIsDisposed = true;
        };
        this.getConnectionError = function (statusCode) {
            /*
            -- Websocket status codes --
            NormalClosure = 1000,
            EndpointUnavailable = 1001,
            ProtocolError = 1002,
            InvalidMessageType = 1003,
            Empty = 1005,
            InvalidPayloadData = 1007,
            PolicyViolation = 1008,
            MessageTooBig = 1009,
            MandatoryExtension = 1010,
            InternalServerError = 1011
            */
            switch (statusCode) {
                case 400:
                case 1002:
                case 1003:
                case 1005:
                case 1007:
                case 1008:
                case 1009: return "BadRequest";
                case 401: return "Unauthorized";
                case 403: return "Forbidden";
                case 503:
                case 1001: return "ServerUnavailable";
                case 500:
                case 1011: return "ServerError";
                case 408:
                case 504: return "Timeout";
                default: return "statuscode:" + statusCode.toString();
            }
        };
        this.privRequestId = requestId;
        this.privAudioSourceId = audioSourceId;
        this.privAudioNodeId = audioNodeId;
        this.privReceivedMessages = {};
    }
    return ServiceTelemetryListener;
}());
exports.ServiceTelemetryListener = ServiceTelemetryListener;

//# sourceMappingURL=ServiceTelemetryListener.Internal.js.map
