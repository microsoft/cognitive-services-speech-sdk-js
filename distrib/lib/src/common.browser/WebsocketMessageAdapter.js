"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var Exports_1 = require("../common/Exports");
var ws = require("ws");
var WebsocketMessageAdapter = /** @class */ (function () {
    function WebsocketMessageAdapter(uri, connectionId, messageFormatter) {
        var _this = this;
        this.open = function () {
            if (_this.privConnectionState === Exports_1.ConnectionState.Disconnected) {
                return Exports_1.PromiseHelper.fromError("Cannot open a connection that is in " + _this.privConnectionState + " state");
            }
            if (_this.privConnectionEstablishDeferral) {
                return _this.privConnectionEstablishDeferral.promise();
            }
            _this.privConnectionEstablishDeferral = new Exports_1.Deferred();
            _this.privConnectionState = Exports_1.ConnectionState.Connecting;
            try {
                if (typeof WebSocket !== "undefined" && !WebsocketMessageAdapter.forceNpmWebSocket) {
                    _this.privWebsocketClient = new WebSocket(_this.privUri);
                }
                else {
                    _this.privWebsocketClient = new ws(_this.privUri);
                }
                _this.privWebsocketClient.binaryType = "arraybuffer";
                _this.privReceivingMessageQueue = new Exports_1.Queue();
                _this.privDisconnectDeferral = new Exports_1.Deferred();
                _this.privSendMessageQueue = new Exports_1.Queue();
                _this.processSendQueue();
            }
            catch (error) {
                _this.privConnectionEstablishDeferral.resolve(new Exports_1.ConnectionOpenResponse(500, error));
                return _this.privConnectionEstablishDeferral.promise();
            }
            _this.onEvent(new Exports_1.ConnectionStartEvent(_this.privConnectionId, _this.privUri));
            _this.privWebsocketClient.onopen = function (e) {
                _this.privConnectionState = Exports_1.ConnectionState.Connected;
                _this.onEvent(new Exports_1.ConnectionEstablishedEvent(_this.privConnectionId));
                _this.privConnectionEstablishDeferral.resolve(new Exports_1.ConnectionOpenResponse(200, ""));
            };
            _this.privWebsocketClient.onerror = function (e) {
                // TODO: Understand what this is error is. Will we still get onClose ?
                if (_this.privConnectionState !== Exports_1.ConnectionState.Connecting) {
                    // TODO: Is this required ?
                    // this.onEvent(new ConnectionErrorEvent(errorMsg, connectionId));
                }
            };
            _this.privWebsocketClient.onclose = function (e) {
                if (_this.privConnectionState === Exports_1.ConnectionState.Connecting) {
                    _this.privConnectionState = Exports_1.ConnectionState.Disconnected;
                    // this.onEvent(new ConnectionEstablishErrorEvent(this.connectionId, e.code, e.reason));
                    _this.privConnectionEstablishDeferral.resolve(new Exports_1.ConnectionOpenResponse(e.code, e.reason));
                }
                else {
                    _this.onEvent(new Exports_1.ConnectionClosedEvent(_this.privConnectionId, e.code, e.reason));
                }
                _this.onClose(e.code, e.reason);
            };
            _this.privWebsocketClient.onmessage = function (e) {
                var networkReceivedTime = new Date().toISOString();
                if (_this.privConnectionState === Exports_1.ConnectionState.Connected) {
                    var deferred_1 = new Exports_1.Deferred();
                    // let id = ++this.idCounter;
                    _this.privReceivingMessageQueue.enqueueFromPromise(deferred_1.promise());
                    if (e.data instanceof ArrayBuffer) {
                        var rawMessage = new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Binary, e.data);
                        _this.privMessageFormatter
                            .toConnectionMessage(rawMessage)
                            .on(function (connectionMessage) {
                            _this.onEvent(new Exports_1.ConnectionMessageReceivedEvent(_this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred_1.resolve(connectionMessage);
                        }, function (error) {
                            // TODO: Events for these ?
                            deferred_1.reject("Invalid binary message format. Error: " + error);
                        });
                    }
                    else {
                        var rawMessage = new Exports_1.RawWebsocketMessage(Exports_1.MessageType.Text, e.data);
                        _this.privMessageFormatter
                            .toConnectionMessage(rawMessage)
                            .on(function (connectionMessage) {
                            _this.onEvent(new Exports_1.ConnectionMessageReceivedEvent(_this.privConnectionId, networkReceivedTime, connectionMessage));
                            deferred_1.resolve(connectionMessage);
                        }, function (error) {
                            // TODO: Events for these ?
                            deferred_1.reject("Invalid text message format. Error: " + error);
                        });
                    }
                }
            };
            return _this.privConnectionEstablishDeferral.promise();
        };
        this.send = function (message) {
            if (_this.privConnectionState !== Exports_1.ConnectionState.Connected) {
                return Exports_1.PromiseHelper.fromError("Cannot send on connection that is in " + _this.privConnectionState + " state");
            }
            var messageSendStatusDeferral = new Exports_1.Deferred();
            var messageSendDeferral = new Exports_1.Deferred();
            _this.privSendMessageQueue.enqueueFromPromise(messageSendDeferral.promise());
            _this.privMessageFormatter
                .fromConnectionMessage(message)
                .on(function (rawMessage) {
                messageSendDeferral.resolve({
                    Message: message,
                    RawWebsocketMessage: rawMessage,
                    sendStatusDeferral: messageSendStatusDeferral,
                });
            }, function (error) {
                messageSendDeferral.reject("Error formatting the message. " + error);
            });
            return messageSendStatusDeferral.promise();
        };
        this.read = function () {
            if (_this.privConnectionState !== Exports_1.ConnectionState.Connected) {
                return Exports_1.PromiseHelper.fromError("Cannot read on connection that is in " + _this.privConnectionState + " state");
            }
            return _this.privReceivingMessageQueue.dequeue();
        };
        this.close = function (reason) {
            if (_this.privWebsocketClient) {
                if (_this.privConnectionState !== Exports_1.ConnectionState.Disconnected) {
                    _this.privWebsocketClient.close(1000, reason ? reason : "Normal closure by client");
                }
            }
            else {
                var deferral = new Exports_1.Deferred();
                deferral.resolve(true);
                return deferral.promise();
            }
            return _this.privDisconnectDeferral.promise();
        };
        this.sendRawMessage = function (sendItem) {
            try {
                // indicates we are draining the queue and it came with no message;
                if (!sendItem) {
                    return Exports_1.PromiseHelper.fromResult(true);
                }
                _this.onEvent(new Exports_1.ConnectionMessageSentEvent(_this.privConnectionId, new Date().toISOString(), sendItem.Message));
                _this.privWebsocketClient.send(sendItem.RawWebsocketMessage.payload);
                return Exports_1.PromiseHelper.fromResult(true);
            }
            catch (e) {
                return Exports_1.PromiseHelper.fromError("websocket send error: " + e);
            }
        };
        this.onClose = function (code, reason) {
            var closeReason = "Connection closed. " + code + ": " + reason;
            _this.privConnectionState = Exports_1.ConnectionState.Disconnected;
            _this.privDisconnectDeferral.resolve(true);
            _this.privReceivingMessageQueue.dispose(reason);
            _this.privReceivingMessageQueue.drainAndDispose(function (pendingReceiveItem) {
                // TODO: Events for these ?
                // Logger.instance.onEvent(new LoggingEvent(LogType.Warning, null, `Failed to process received message. Reason: ${closeReason}, Message: ${JSON.stringify(pendingReceiveItem)}`));
            }, closeReason);
            _this.privSendMessageQueue.drainAndDispose(function (pendingSendItem) {
                pendingSendItem.sendStatusDeferral.reject(closeReason);
            }, closeReason);
        };
        this.processSendQueue = function () {
            _this.privSendMessageQueue
                .dequeue()
                .on(function (sendItem) {
                // indicates we are draining the queue and it came with no message;
                if (!sendItem) {
                    return;
                }
                _this.sendRawMessage(sendItem)
                    .on(function (result) {
                    sendItem.sendStatusDeferral.resolve(result);
                    _this.processSendQueue();
                }, function (sendError) {
                    sendItem.sendStatusDeferral.reject(sendError);
                    _this.processSendQueue();
                });
            }, function (error) {
                // do nothing
            });
        };
        this.onEvent = function (event) {
            _this.privConnectionEvents.onEvent(event);
            Exports_1.Events.instance.onEvent(event);
        };
        if (!uri) {
            throw new Exports_1.ArgumentNullError("uri");
        }
        if (!messageFormatter) {
            throw new Exports_1.ArgumentNullError("messageFormatter");
        }
        this.privConnectionEvents = new Exports_1.EventSource();
        this.privConnectionId = connectionId;
        this.privMessageFormatter = messageFormatter;
        this.privConnectionState = Exports_1.ConnectionState.None;
        this.privUri = uri;
    }
    Object.defineProperty(WebsocketMessageAdapter.prototype, "state", {
        get: function () {
            return this.privConnectionState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WebsocketMessageAdapter.prototype, "events", {
        get: function () {
            return this.privConnectionEvents;
        },
        enumerable: true,
        configurable: true
    });
    WebsocketMessageAdapter.forceNpmWebSocket = false;
    return WebsocketMessageAdapter;
}());
exports.WebsocketMessageAdapter = WebsocketMessageAdapter;

//# sourceMappingURL=WebsocketMessageAdapter.js.map
