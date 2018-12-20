"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var Guid_1 = require("./Guid");
var EventSource = /** @class */ (function () {
    function EventSource(metadata) {
        var _this = this;
        this.privEventListeners = {};
        this.privIsDisposed = false;
        this.onEvent = function (event) {
            if (_this.isDisposed()) {
                throw (new Error_1.ObjectDisposedError("EventSource"));
            }
            if (_this.metadata) {
                for (var paramName in _this.metadata) {
                    if (paramName) {
                        if (event.metadata) {
                            if (!event.metadata[paramName]) {
                                event.metadata[paramName] = _this.metadata[paramName];
                            }
                        }
                    }
                }
            }
            for (var eventId in _this.privEventListeners) {
                if (eventId && _this.privEventListeners[eventId]) {
                    _this.privEventListeners[eventId](event);
                }
            }
        };
        this.attach = function (onEventCallback) {
            var id = Guid_1.createNoDashGuid();
            _this.privEventListeners[id] = onEventCallback;
            return {
                detach: function () {
                    delete _this.privEventListeners[id];
                },
            };
        };
        this.attachListener = function (listener) {
            return _this.attach(listener.onEvent);
        };
        this.isDisposed = function () {
            return _this.privIsDisposed;
        };
        this.dispose = function () {
            _this.privEventListeners = null;
            _this.privIsDisposed = true;
        };
        this.privMetadata = metadata;
    }
    Object.defineProperty(EventSource.prototype, "metadata", {
        get: function () {
            return this.privMetadata;
        },
        enumerable: true,
        configurable: true
    });
    return EventSource;
}());
exports.EventSource = EventSource;

//# sourceMappingURL=EventSource.js.map
