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
var PlatformEvent_1 = require("./PlatformEvent");
var ConnectionEvent = /** @class */ (function (_super) {
    __extends(ConnectionEvent, _super);
    function ConnectionEvent(eventName, connectionId, eventType) {
        if (eventType === void 0) { eventType = PlatformEvent_1.EventType.Info; }
        var _this = _super.call(this, eventName, eventType) || this;
        _this.privConnectionId = connectionId;
        return _this;
    }
    Object.defineProperty(ConnectionEvent.prototype, "connectionId", {
        get: function () {
            return this.privConnectionId;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionEvent;
}(PlatformEvent_1.PlatformEvent));
exports.ConnectionEvent = ConnectionEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionStartEvent = /** @class */ (function (_super) {
    __extends(ConnectionStartEvent, _super);
    function ConnectionStartEvent(connectionId, uri, headers) {
        var _this = _super.call(this, "ConnectionStartEvent", connectionId) || this;
        _this.privUri = uri;
        _this.privHeaders = headers;
        return _this;
    }
    Object.defineProperty(ConnectionStartEvent.prototype, "uri", {
        get: function () {
            return this.privUri;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionStartEvent.prototype, "headers", {
        get: function () {
            return this.privHeaders;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionStartEvent;
}(ConnectionEvent));
exports.ConnectionStartEvent = ConnectionStartEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionEstablishedEvent = /** @class */ (function (_super) {
    __extends(ConnectionEstablishedEvent, _super);
    function ConnectionEstablishedEvent(connectionId, metadata) {
        return _super.call(this, "ConnectionEstablishedEvent", connectionId) || this;
    }
    return ConnectionEstablishedEvent;
}(ConnectionEvent));
exports.ConnectionEstablishedEvent = ConnectionEstablishedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionClosedEvent = /** @class */ (function (_super) {
    __extends(ConnectionClosedEvent, _super);
    function ConnectionClosedEvent(connectionId, statusCode, reason) {
        var _this = _super.call(this, "ConnectionClosedEvent", connectionId, PlatformEvent_1.EventType.Debug) || this;
        _this.privRreason = reason;
        _this.privStatusCode = statusCode;
        return _this;
    }
    Object.defineProperty(ConnectionClosedEvent.prototype, "reason", {
        get: function () {
            return this.privRreason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionClosedEvent.prototype, "statusCode", {
        get: function () {
            return this.privStatusCode;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionClosedEvent;
}(ConnectionEvent));
exports.ConnectionClosedEvent = ConnectionClosedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionEstablishErrorEvent = /** @class */ (function (_super) {
    __extends(ConnectionEstablishErrorEvent, _super);
    function ConnectionEstablishErrorEvent(connectionId, statuscode, reason) {
        var _this = _super.call(this, "ConnectionEstablishErrorEvent", connectionId, PlatformEvent_1.EventType.Error) || this;
        _this.privStatusCode = statuscode;
        _this.privReason = reason;
        return _this;
    }
    Object.defineProperty(ConnectionEstablishErrorEvent.prototype, "reason", {
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionEstablishErrorEvent.prototype, "statusCode", {
        get: function () {
            return this.privStatusCode;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionEstablishErrorEvent;
}(ConnectionEvent));
exports.ConnectionEstablishErrorEvent = ConnectionEstablishErrorEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionMessageReceivedEvent = /** @class */ (function (_super) {
    __extends(ConnectionMessageReceivedEvent, _super);
    function ConnectionMessageReceivedEvent(connectionId, networkReceivedTimeISO, message) {
        var _this = _super.call(this, "ConnectionMessageReceivedEvent", connectionId) || this;
        _this.privNetworkReceivedTime = networkReceivedTimeISO;
        _this.privMessage = message;
        return _this;
    }
    Object.defineProperty(ConnectionMessageReceivedEvent.prototype, "networkReceivedTime", {
        get: function () {
            return this.privNetworkReceivedTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessageReceivedEvent.prototype, "message", {
        get: function () {
            return this.privMessage;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionMessageReceivedEvent;
}(ConnectionEvent));
exports.ConnectionMessageReceivedEvent = ConnectionMessageReceivedEvent;
// tslint:disable-next-line:max-classes-per-file
var ConnectionMessageSentEvent = /** @class */ (function (_super) {
    __extends(ConnectionMessageSentEvent, _super);
    function ConnectionMessageSentEvent(connectionId, networkSentTimeISO, message) {
        var _this = _super.call(this, "ConnectionMessageSentEvent", connectionId) || this;
        _this.privNetworkSentTime = networkSentTimeISO;
        _this.privMessage = message;
        return _this;
    }
    Object.defineProperty(ConnectionMessageSentEvent.prototype, "networkSentTime", {
        get: function () {
            return this.privNetworkSentTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessageSentEvent.prototype, "message", {
        get: function () {
            return this.privMessage;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionMessageSentEvent;
}(ConnectionEvent));
exports.ConnectionMessageSentEvent = ConnectionMessageSentEvent;

//# sourceMappingURL=ConnectionEvents.js.map
