"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionMessage_1 = require("./ConnectionMessage");
var Error_1 = require("./Error");
var Guid_1 = require("./Guid");
var RawWebsocketMessage = /** @class */ (function () {
    function RawWebsocketMessage(messageType, payload, id) {
        this.privPayload = null;
        if (!payload) {
            throw new Error_1.ArgumentNullError("payload");
        }
        if (messageType === ConnectionMessage_1.MessageType.Binary && !(payload instanceof ArrayBuffer)) {
            throw new Error_1.InvalidOperationError("Payload must be ArrayBuffer");
        }
        if (messageType === ConnectionMessage_1.MessageType.Text && !(typeof (payload) === "string")) {
            throw new Error_1.InvalidOperationError("Payload must be a string");
        }
        this.privMessageType = messageType;
        this.privPayload = payload;
        this.privId = id ? id : Guid_1.createNoDashGuid();
    }
    Object.defineProperty(RawWebsocketMessage.prototype, "messageType", {
        get: function () {
            return this.privMessageType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "payload", {
        get: function () {
            return this.privPayload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "textContent", {
        get: function () {
            if (this.privMessageType === ConnectionMessage_1.MessageType.Binary) {
                throw new Error_1.InvalidOperationError("Not supported for binary message");
            }
            return this.privPayload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "binaryContent", {
        get: function () {
            if (this.privMessageType === ConnectionMessage_1.MessageType.Text) {
                throw new Error_1.InvalidOperationError("Not supported for text message");
            }
            return this.privPayload;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RawWebsocketMessage.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    return RawWebsocketMessage;
}());
exports.RawWebsocketMessage = RawWebsocketMessage;

//# sourceMappingURL=RawWebsocketMessage.js.map
