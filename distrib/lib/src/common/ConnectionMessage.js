"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var Guid_1 = require("./Guid");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["Text"] = 0] = "Text";
    MessageType[MessageType["Binary"] = 1] = "Binary";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var ConnectionMessage = /** @class */ (function () {
    function ConnectionMessage(messageType, body, headers, id) {
        this.privBody = null;
        if (messageType === MessageType.Text && body && !(typeof (body) === "string")) {
            throw new Error_1.InvalidOperationError("Payload must be a string");
        }
        if (messageType === MessageType.Binary && body && !(body instanceof ArrayBuffer)) {
            throw new Error_1.InvalidOperationError("Payload must be ArrayBuffer");
        }
        this.privMessageType = messageType;
        this.privBody = body;
        this.privHeaders = headers ? headers : {};
        this.privId = id ? id : Guid_1.createNoDashGuid();
    }
    Object.defineProperty(ConnectionMessage.prototype, "messageType", {
        get: function () {
            return this.privMessageType;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "headers", {
        get: function () {
            return this.privHeaders;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "body", {
        get: function () {
            return this.privBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "textBody", {
        get: function () {
            if (this.privMessageType === MessageType.Binary) {
                throw new Error_1.InvalidOperationError("Not supported for binary message");
            }
            return this.privBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "binaryBody", {
        get: function () {
            if (this.privMessageType === MessageType.Text) {
                throw new Error_1.InvalidOperationError("Not supported for text message");
            }
            return this.privBody;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionMessage.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionMessage;
}());
exports.ConnectionMessage = ConnectionMessage;

//# sourceMappingURL=ConnectionMessage.js.map
