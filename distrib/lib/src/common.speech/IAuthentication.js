"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var AuthInfo = /** @class */ (function () {
    function AuthInfo(headerName, token) {
        this.privHeaderName = headerName;
        this.privToken = token;
    }
    Object.defineProperty(AuthInfo.prototype, "headerName", {
        get: function () {
            return this.privHeaderName;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AuthInfo.prototype, "token", {
        get: function () {
            return this.privToken;
        },
        enumerable: true,
        configurable: true
    });
    return AuthInfo;
}());
exports.AuthInfo = AuthInfo;

//# sourceMappingURL=IAuthentication.js.map
