"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var ConnectionOpenResponse = /** @class */ (function () {
    function ConnectionOpenResponse(statusCode, reason) {
        this.privStatusCode = statusCode;
        this.privReason = reason;
    }
    Object.defineProperty(ConnectionOpenResponse.prototype, "statusCode", {
        get: function () {
            return this.privStatusCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ConnectionOpenResponse.prototype, "reason", {
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    return ConnectionOpenResponse;
}());
exports.ConnectionOpenResponse = ConnectionOpenResponse;

//# sourceMappingURL=ConnectionOpenResponse.js.map
