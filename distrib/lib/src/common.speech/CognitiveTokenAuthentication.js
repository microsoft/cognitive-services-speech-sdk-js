"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var IAuthentication_1 = require("./IAuthentication");
var AuthHeader = "Authorization";
var CognitiveTokenAuthentication = /** @class */ (function () {
    function CognitiveTokenAuthentication(fetchCallback, fetchOnExpiryCallback) {
        var _this = this;
        this.fetch = function (authFetchEventId) {
            return _this.privFetchCallback(authFetchEventId).onSuccessContinueWith(function (token) { return new IAuthentication_1.AuthInfo(AuthHeader, token); });
        };
        this.fetchOnExpiry = function (authFetchEventId) {
            return _this.privFetchOnExpiryCallback(authFetchEventId).onSuccessContinueWith(function (token) { return new IAuthentication_1.AuthInfo(AuthHeader, token); });
        };
        if (!fetchCallback) {
            throw new Exports_1.ArgumentNullError("fetchCallback");
        }
        if (!fetchOnExpiryCallback) {
            throw new Exports_1.ArgumentNullError("fetchOnExpiryCallback");
        }
        this.privFetchCallback = fetchCallback;
        this.privFetchOnExpiryCallback = fetchOnExpiryCallback;
    }
    return CognitiveTokenAuthentication;
}());
exports.CognitiveTokenAuthentication = CognitiveTokenAuthentication;

//# sourceMappingURL=CognitiveTokenAuthentication.js.map
