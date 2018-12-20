"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var EventSource_1 = require("./EventSource");
var Events = /** @class */ (function () {
    function Events() {
    }
    Object.defineProperty(Events, "instance", {
        get: function () {
            return Events.privInstance;
        },
        enumerable: true,
        configurable: true
    });
    Events.privInstance = new EventSource_1.EventSource();
    Events.setEventSource = function (eventSource) {
        if (!eventSource) {
            throw new Error_1.ArgumentNullError("eventSource");
        }
        Events.privInstance = eventSource;
    };
    return Events;
}());
exports.Events = Events;

//# sourceMappingURL=Events.js.map
