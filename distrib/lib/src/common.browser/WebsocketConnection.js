"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var WebsocketMessageAdapter_1 = require("./WebsocketMessageAdapter");
var WebsocketConnection = /** @class */ (function () {
    function WebsocketConnection(uri, queryParameters, headers, messageFormatter, connectionId) {
        var _this = this;
        this.privIsDisposed = false;
        this.dispose = function () {
            _this.privIsDisposed = true;
            if (_this.privConnectionMessageAdapter) {
                _this.privConnectionMessageAdapter.close();
            }
        };
        this.isDisposed = function () {
            return _this.privIsDisposed;
        };
        this.state = function () {
            return _this.privConnectionMessageAdapter.state;
        };
        this.open = function () {
            return _this.privConnectionMessageAdapter.open();
        };
        this.send = function (message) {
            return _this.privConnectionMessageAdapter.send(message);
        };
        this.read = function () {
            return _this.privConnectionMessageAdapter.read();
        };
        if (!uri) {
            throw new Exports_1.ArgumentNullError("uri");
        }
        if (!messageFormatter) {
            throw new Exports_1.ArgumentNullError("messageFormatter");
        }
        this.privMessageFormatter = messageFormatter;
        var queryParams = "";
        var i = 0;
        if (queryParameters) {
            for (var paramName in queryParameters) {
                if (paramName) {
                    queryParams += ((i === 0) && (uri.indexOf("?") === -1)) ? "?" : "&";
                    var val = encodeURIComponent(queryParameters[paramName]);
                    queryParams += paramName + "=" + val;
                    i++;
                }
            }
        }
        if (headers) {
            for (var headerName in headers) {
                if (headerName) {
                    queryParams += i === 0 ? "?" : "&";
                    var val = encodeURIComponent(headers[headerName]);
                    queryParams += headerName + "=" + val;
                    i++;
                }
            }
        }
        this.privUri = uri + queryParams;
        this.privId = connectionId ? connectionId : Exports_1.createNoDashGuid();
        this.privConnectionMessageAdapter = new WebsocketMessageAdapter_1.WebsocketMessageAdapter(this.privUri, this.id, this.privMessageFormatter);
    }
    Object.defineProperty(WebsocketConnection.prototype, "id", {
        get: function () {
            return this.privId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebsocketConnection.prototype, "events", {
        get: function () {
            return this.privConnectionMessageAdapter.events;
        },
        enumerable: true,
        configurable: true
    });
    return WebsocketConnection;
}());
exports.WebsocketConnection = WebsocketConnection;

//# sourceMappingURL=WebsocketConnection.js.map
