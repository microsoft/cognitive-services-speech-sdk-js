"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Guid_1 = require("./Guid");
var EventType;
(function (EventType) {
    EventType[EventType["Debug"] = 0] = "Debug";
    EventType[EventType["Info"] = 1] = "Info";
    EventType[EventType["Warning"] = 2] = "Warning";
    EventType[EventType["Error"] = 3] = "Error";
})(EventType = exports.EventType || (exports.EventType = {}));
var PlatformEvent = /** @class */ (function () {
    function PlatformEvent(eventName, eventType) {
        this.privName = eventName;
        this.privEventId = Guid_1.createNoDashGuid();
        this.privEventTime = new Date().toISOString();
        this.privEventType = eventType;
        this.privMetadata = {};
    }
    Object.defineProperty(PlatformEvent.prototype, "name", {
        get: function () {
            return this.privName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "eventId", {
        get: function () {
            return this.privEventId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "eventTime", {
        get: function () {
            return this.privEventTime;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "eventType", {
        get: function () {
            return this.privEventType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PlatformEvent.prototype, "metadata", {
        get: function () {
            return this.privMetadata;
        },
        enumerable: true,
        configurable: true
    });
    return PlatformEvent;
}());
exports.PlatformEvent = PlatformEvent;

//# sourceMappingURL=PlatformEvent.js.map
