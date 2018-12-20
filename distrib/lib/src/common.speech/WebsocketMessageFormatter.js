"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var CRLF = "\r\n";
var WebsocketMessageFormatter = /** @class */ (function () {
    function WebsocketMessageFormatter() {
        var _this = this;
        this.toConnectionMessage = function (message) {
            var deferral = new Exports_1.Deferred();
            try {
                if (message.messageType === Exports_1.MessageType.Text) {
                    var textMessage = message.textContent;
                    var headers = {};
                    var body = null;
                    if (textMessage) {
                        var headerBodySplit = textMessage.split("\r\n\r\n");
                        if (headerBodySplit && headerBodySplit.length > 0) {
                            headers = _this.parseHeaders(headerBodySplit[0]);
                            if (headerBodySplit.length > 1) {
                                body = headerBodySplit[1];
                            }
                        }
                    }
                    deferral.resolve(new Exports_1.ConnectionMessage(message.messageType, body, headers, message.id));
                }
                else if (message.messageType === Exports_1.MessageType.Binary) {
                    var binaryMessage = message.binaryContent;
                    var headers = {};
                    var body = null;
                    if (!binaryMessage || binaryMessage.byteLength < 2) {
                        throw new Error("Invalid binary message format. Header length missing.");
                    }
                    var dataView = new DataView(binaryMessage);
                    var headerLength = dataView.getInt16(0);
                    if (binaryMessage.byteLength < headerLength + 2) {
                        throw new Error("Invalid binary message format. Header content missing.");
                    }
                    var headersString = "";
                    for (var i = 0; i < headerLength; i++) {
                        headersString += String.fromCharCode((dataView).getInt8(i + 2));
                    }
                    headers = _this.parseHeaders(headersString);
                    if (binaryMessage.byteLength > headerLength + 2) {
                        body = binaryMessage.slice(2 + headerLength);
                    }
                    deferral.resolve(new Exports_1.ConnectionMessage(message.messageType, body, headers, message.id));
                }
            }
            catch (e) {
                deferral.reject("Error formatting the message. Error: " + e);
            }
            return deferral.promise();
        };
        this.fromConnectionMessage = function (message) {
            var deferral = new Exports_1.Deferred();
            try {
                if (message.messageType === Exports_1.MessageType.Text) {
                    var payload = "" + _this.makeHeaders(message) + CRLF + (message.textBody ? message.textBody : "");
                    deferral.resolve(new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Text, payload, message.id));
                }
                else if (message.messageType === Exports_1.MessageType.Binary) {
                    var headersString = _this.makeHeaders(message);
                    var content = message.binaryBody;
                    var headerInt8Array = new Int8Array(_this.stringToArrayBuffer(headersString));
                    var payload = new ArrayBuffer(2 + headerInt8Array.byteLength + (content ? content.byteLength : 0));
                    var dataView = new DataView(payload);
                    dataView.setInt16(0, headerInt8Array.length);
                    for (var i = 0; i < headerInt8Array.byteLength; i++) {
                        dataView.setInt8(2 + i, headerInt8Array[i]);
                    }
                    if (content) {
                        var bodyInt8Array = new Int8Array(content);
                        for (var i = 0; i < bodyInt8Array.byteLength; i++) {
                            dataView.setInt8(2 + headerInt8Array.byteLength + i, bodyInt8Array[i]);
                        }
                    }
                    deferral.resolve(new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Binary, payload, message.id));
                }
            }
            catch (e) {
                deferral.reject("Error formatting the message. " + e);
            }
            return deferral.promise();
        };
        this.makeHeaders = function (message) {
            var headersString = "";
            if (message.headers) {
                for (var header in message.headers) {
                    if (header) {
                        headersString += header + ": " + message.headers[header] + CRLF;
                    }
                }
            }
            return headersString;
        };
        this.parseHeaders = function (headersString) {
            var headers = {};
            if (headersString) {
                var headerMatches = headersString.match(/[^\r\n]+/g);
                if (headers) {
                    for (var _i = 0, headerMatches_1 = headerMatches; _i < headerMatches_1.length; _i++) {
                        var header = headerMatches_1[_i];
                        if (header) {
                            var separatorIndex = header.indexOf(":");
                            var headerName = separatorIndex > 0 ? header.substr(0, separatorIndex).trim().toLowerCase() : header;
                            var headerValue = separatorIndex > 0 && header.length > (separatorIndex + 1) ?
                                header.substr(separatorIndex + 1).trim() :
                                "";
                            headers[headerName] = headerValue;
                        }
                    }
                }
            }
            return headers;
        };
        this.stringToArrayBuffer = function (str) {
            var buffer = new ArrayBuffer(str.length);
            var view = new DataView(buffer);
            for (var i = 0; i < str.length; i++) {
                view.setUint8(i, str.charCodeAt(i));
            }
            return buffer;
        };
    }
    return WebsocketMessageFormatter;
}());
exports.WebsocketMessageFormatter = WebsocketMessageFormatter;

//# sourceMappingURL=WebsocketMessageFormatter.js.map
