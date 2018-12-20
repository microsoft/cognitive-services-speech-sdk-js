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
var Exports_1 = require("../common/Exports");
var SpeechRecognitionEvent = /** @class */ (function (_super) {
    __extends(SpeechRecognitionEvent, _super);
    function SpeechRecognitionEvent(eventName, requestId, sessionId, eventType) {
        if (eventType === void 0) { eventType = Exports_1.EventType.Info; }
        var _this = _super.call(this, eventName, eventType) || this;
        _this.privRequestId = requestId;
        _this.privSessionId = sessionId;
        return _this;
    }
    Object.defineProperty(SpeechRecognitionEvent.prototype, "requestId", {
        get: function () {
            return this.privRequestId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognitionEvent.prototype, "sessionId", {
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechRecognitionEvent;
}(Exports_1.PlatformEvent));
exports.SpeechRecognitionEvent = SpeechRecognitionEvent;
// tslint:disable-next-line:max-classes-per-file
var RecognitionTriggeredEvent = /** @class */ (function (_super) {
    __extends(RecognitionTriggeredEvent, _super);
    function RecognitionTriggeredEvent(requestId, sessionId, audioSourceId, audioNodeId) {
        var _this = _super.call(this, "RecognitionTriggeredEvent", requestId, sessionId) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        return _this;
    }
    Object.defineProperty(RecognitionTriggeredEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionTriggeredEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionTriggeredEvent;
}(SpeechRecognitionEvent));
exports.RecognitionTriggeredEvent = RecognitionTriggeredEvent;
// tslint:disable-next-line:max-classes-per-file
var ListeningStartedEvent = /** @class */ (function (_super) {
    __extends(ListeningStartedEvent, _super);
    function ListeningStartedEvent(requestId, sessionId, audioSourceId, audioNodeId) {
        var _this = _super.call(this, "ListeningStartedEvent", requestId, sessionId) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        return _this;
    }
    Object.defineProperty(ListeningStartedEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ListeningStartedEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    return ListeningStartedEvent;
}(SpeechRecognitionEvent));
exports.ListeningStartedEvent = ListeningStartedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectingToServiceEvent = /** @class */ (function (_super) {
    __extends(ConnectingToServiceEvent, _super);
    function ConnectingToServiceEvent(requestId, authFetchEventid, sessionId) {
        var _this = _super.call(this, "ConnectingToServiceEvent", requestId, sessionId) || this;
        _this.privAuthFetchEventid = authFetchEventid;
        return _this;
    }
    Object.defineProperty(ConnectingToServiceEvent.prototype, "authFetchEventid", {
        get: function () {
            return this.privAuthFetchEventid;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectingToServiceEvent;
}(SpeechRecognitionEvent));
exports.ConnectingToServiceEvent = ConnectingToServiceEvent;
// tslint:disable-next-line:max-classes-per-file
var RecognitionStartedEvent = /** @class */ (function (_super) {
    __extends(RecognitionStartedEvent, _super);
    function RecognitionStartedEvent(requestId, audioSourceId, audioNodeId, authFetchEventId, sessionId) {
        var _this = _super.call(this, "RecognitionStartedEvent", requestId, sessionId) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        _this.privAuthFetchEventId = authFetchEventId;
        return _this;
    }
    Object.defineProperty(RecognitionStartedEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionStartedEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionStartedEvent.prototype, "authFetchEventId", {
        get: function () {
            return this.privAuthFetchEventId;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionStartedEvent;
}(SpeechRecognitionEvent));
exports.RecognitionStartedEvent = RecognitionStartedEvent;
var RecognitionCompletionStatus;
(function (RecognitionCompletionStatus) {
    RecognitionCompletionStatus[RecognitionCompletionStatus["Success"] = 0] = "Success";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AudioSourceError"] = 1] = "AudioSourceError";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AudioSourceTimeout"] = 2] = "AudioSourceTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AuthTokenFetchError"] = 3] = "AuthTokenFetchError";
    RecognitionCompletionStatus[RecognitionCompletionStatus["AuthTokenFetchTimeout"] = 4] = "AuthTokenFetchTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["UnAuthorized"] = 5] = "UnAuthorized";
    RecognitionCompletionStatus[RecognitionCompletionStatus["ConnectTimeout"] = 6] = "ConnectTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["ConnectError"] = 7] = "ConnectError";
    RecognitionCompletionStatus[RecognitionCompletionStatus["ClientRecognitionActivityTimeout"] = 8] = "ClientRecognitionActivityTimeout";
    RecognitionCompletionStatus[RecognitionCompletionStatus["UnknownError"] = 9] = "UnknownError";
})(RecognitionCompletionStatus = exports.RecognitionCompletionStatus || (exports.RecognitionCompletionStatus = {}));
// tslint:disable-next-line:max-classes-per-file
var RecognitionEndedEvent = /** @class */ (function (_super) {
    __extends(RecognitionEndedEvent, _super);
    function RecognitionEndedEvent(requestId, audioSourceId, audioNodeId, authFetchEventId, sessionId, serviceTag, status, error) {
        var _this = _super.call(this, "RecognitionEndedEvent", requestId, sessionId, status === RecognitionCompletionStatus.Success ? Exports_1.EventType.Info : Exports_1.EventType.Error) || this;
        _this.privAudioSourceId = audioSourceId;
        _this.privAudioNodeId = audioNodeId;
        _this.privAuthFetchEventId = authFetchEventId;
        _this.privStatus = status;
        _this.privError = error;
        _this.privServiceTag = serviceTag;
        return _this;
    }
    Object.defineProperty(RecognitionEndedEvent.prototype, "audioSourceId", {
        get: function () {
            return this.privAudioSourceId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "audioNodeId", {
        get: function () {
            return this.privAudioNodeId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "authFetchEventId", {
        get: function () {
            return this.privAuthFetchEventId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "serviceTag", {
        get: function () {
            return this.privServiceTag;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "status", {
        get: function () {
            return this.privStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionEndedEvent.prototype, "error", {
        get: function () {
            return this.privError;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionEndedEvent;
}(SpeechRecognitionEvent));
exports.RecognitionEndedEvent = RecognitionEndedEvent;

//# sourceMappingURL=RecognitionEvents.js.map
