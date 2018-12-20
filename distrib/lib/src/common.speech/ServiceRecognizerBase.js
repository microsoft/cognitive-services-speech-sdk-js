"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common.browser/Exports");
var Exports_2 = require("../common/Exports");
var Exports_3 = require("../sdk/Exports");
var Exports_4 = require("./Exports");
var SpeechConnectionMessage_Internal_1 = require("./SpeechConnectionMessage.Internal");
var ServiceRecognizerBase = /** @class */ (function () {
    function ServiceRecognizerBase(authentication, connectionFactory, audioSource, recognizerConfig, recognizer) {
        var _this = this;
        this.sendTelemetryData = function (requestSession, telemetryData) {
            if (ServiceRecognizerBase.telemetryDataEnabled !== true ||
                _this.privIsDisposed) {
                return Exports_2.PromiseHelper.fromResult(true);
            }
            if (!!ServiceRecognizerBase.telemetryData) {
                try {
                    ServiceRecognizerBase.telemetryData(telemetryData);
                    /* tslint:disable:no-empty */
                }
                catch (_a) { }
            }
            return _this.fetchConnection(requestSession).onSuccessContinueWithPromise(function (connection) {
                return connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Text, "telemetry", requestSession.requestId, "application/json", telemetryData));
            });
        };
        this.fetchConnection = function (requestSession) {
            return _this.configureConnection(requestSession);
        };
        this.configureConnection = function (requestSession, isUnAuthorized) {
            if (isUnAuthorized === void 0) { isUnAuthorized = false; }
            if (_this.privConnectionConfigurationPromise) {
                if (_this.privConnectionConfigurationPromise.result().isCompleted &&
                    (_this.privConnectionConfigurationPromise.result().isError
                        || _this.privConnectionConfigurationPromise.result().result.state() === Exports_2.ConnectionState.Disconnected)) {
                    _this.privConnectionId = null;
                    _this.privConnectionConfigurationPromise = null;
                    return _this.configureConnection(requestSession);
                }
                else {
                    // requestSession.onConnectionEstablishCompleted(200);
                    return _this.privConnectionConfigurationPromise;
                }
            }
            _this.privAuthFetchEventId = Exports_2.createNoDashGuid();
            _this.privConnectionId = Exports_2.createNoDashGuid();
            requestSession.onPreConnectionStart(_this.privAuthFetchEventId, _this.privConnectionId);
            var authPromise = isUnAuthorized ? _this.privAuthentication.fetchOnExpiry(_this.privAuthFetchEventId) : _this.privAuthentication.fetch(_this.privAuthFetchEventId);
            _this.privConnectionConfigurationPromise = authPromise
                .continueWithPromise(function (result) {
                if (result.isError) {
                    requestSession.onAuthCompleted(true, result.error);
                    throw new Error(result.error);
                }
                else {
                    requestSession.onAuthCompleted(false);
                }
                var connection = _this.privConnectionFactory.create(_this.privRecognizerConfig, result.result, _this.privConnectionId);
                requestSession.listenForServiceTelemetry(connection.events);
                return connection.open().onSuccessContinueWithPromise(function (response) {
                    if (response.statusCode === 200) {
                        requestSession.onPreConnectionStart(_this.privAuthFetchEventId, _this.privConnectionId);
                        requestSession.onConnectionEstablishCompleted(response.statusCode);
                        //  requestSession.listenForServiceTelemetry(this.privConnectionFetchPromise.result().result.events);
                        return _this.sendSpeechConfig(connection, requestSession, _this.privRecognizerConfig.platformConfig.serialize())
                            .onSuccessContinueWithPromise(function (_) {
                            return _this.sendSpeechContext(connection, requestSession, requestSession.contextJson).onSuccessContinueWith(function (_) {
                                return connection;
                            });
                        });
                    }
                    else if (response.statusCode === 403 && !isUnAuthorized) {
                        return _this.configureConnection(requestSession, true);
                    }
                    else {
                        requestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                        return Exports_2.PromiseHelper.fromError("Unable to contact server. StatusCode: " + response.statusCode + ", " + _this.privRecognizerConfig.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Endpoint) + " Reason: " + response.reason);
                    }
                });
            });
            return _this.privConnectionConfigurationPromise;
        };
        this.receiveMessage = function (requestSession, successCallback, errorCallBack) {
            return _this.fetchConnection(requestSession).onSuccessContinueWithPromise(function (connection) {
                return connection.read()
                    .onSuccessContinueWithPromise(function (message) {
                    if (_this.privIsDisposed) {
                        // We're done.
                        return Exports_2.PromiseHelper.fromResult(true);
                    }
                    // indicates we are draining the queue and it came with no message;
                    if (!message) {
                        if (requestSession.isCompleted) {
                            return Exports_2.PromiseHelper.fromResult(true);
                        }
                        else {
                            return _this.receiveMessage(requestSession, successCallback, errorCallBack);
                        }
                    }
                    var connectionMessage = SpeechConnectionMessage_Internal_1.SpeechConnectionMessage.fromConnectionMessage(message);
                    if (connectionMessage.requestId.toLowerCase() === requestSession.requestId.toLowerCase()) {
                        switch (connectionMessage.path.toLowerCase()) {
                            case "turn.start":
                                _this.privMustReportEndOfStream = true;
                                break;
                            case "speech.startdetected":
                                var speechStartDetected = Exports_4.SpeechDetected.fromJSON(connectionMessage.textBody);
                                var speechStartEventArgs = new Exports_3.RecognitionEventArgs(speechStartDetected.Offset, requestSession.sessionId);
                                if (!!_this.privRecognizer.speechStartDetected) {
                                    _this.privRecognizer.speechStartDetected(_this.privRecognizer, speechStartEventArgs);
                                }
                                break;
                            case "speech.enddetected":
                                var json = void 0;
                                if (connectionMessage.textBody.length > 0) {
                                    json = connectionMessage.textBody;
                                }
                                else {
                                    // If the request was empty, the JSON returned is empty.
                                    json = "{ Offset: 0 }";
                                }
                                var speechStopDetected = Exports_4.SpeechDetected.fromJSON(json);
                                requestSession.onServiceRecognized(speechStopDetected.Offset + requestSession.currentTurnAudioOffset);
                                var speechStopEventArgs = new Exports_3.RecognitionEventArgs(speechStopDetected.Offset + requestSession.currentTurnAudioOffset, requestSession.sessionId);
                                if (!!_this.privRecognizer.speechEndDetected) {
                                    _this.privRecognizer.speechEndDetected(_this.privRecognizer, speechStopEventArgs);
                                }
                                break;
                            case "turn.end":
                                if (requestSession.isSpeechEnded && _this.privMustReportEndOfStream) {
                                    _this.privMustReportEndOfStream = false;
                                    _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.EndOfStream, Exports_3.CancellationErrorCode.NoError, undefined, successCallback);
                                }
                                var sessionStopEventArgs = new Exports_3.SessionEventArgs(requestSession.sessionId);
                                requestSession.onServiceTurnEndResponse(_this.privRecognizerConfig.isContinuousRecognition);
                                if (!_this.privRecognizerConfig.isContinuousRecognition || requestSession.isSpeechEnded) {
                                    if (!!_this.privRecognizer.sessionStopped) {
                                        _this.privRecognizer.sessionStopped(_this.privRecognizer, sessionStopEventArgs);
                                    }
                                    return Exports_2.PromiseHelper.fromResult(true);
                                }
                                else {
                                    _this.fetchConnection(requestSession).onSuccessContinueWith(function (connection) {
                                        _this.sendSpeechContext(connection, requestSession, requestSession.contextJson);
                                    });
                                }
                            default:
                                _this.processTypeSpecificMessages(connectionMessage, requestSession, connection, successCallback, errorCallBack);
                        }
                    }
                    return _this.receiveMessage(requestSession, successCallback, errorCallBack);
                });
            });
        };
        this.sendSpeechConfig = function (connection, requestSession, speechConfigJson) {
            // filter out anything that is not required for the service to work.
            if (ServiceRecognizerBase.telemetryDataEnabled !== true) {
                var withTelemetry = JSON.parse(speechConfigJson);
                var replacement = {
                    context: {
                        system: withTelemetry.context.system,
                    },
                };
                speechConfigJson = JSON.stringify(replacement);
            }
            if (speechConfigJson && _this.privConnectionId !== _this.privSpeechConfigConnectionId) {
                _this.privSpeechConfigConnectionId = _this.privConnectionId;
                return connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Text, "speech.config", requestSession.requestId, "application/json", speechConfigJson));
            }
            return Exports_2.PromiseHelper.fromResult(true);
        };
        this.sendSpeechContext = function (connection, requestSession, speechContextJson) {
            if (speechContextJson) {
                return connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Text, "speech.context", requestSession.requestId, "application/json", speechContextJson));
            }
            return Exports_2.PromiseHelper.fromResult(true);
        };
        this.sendAudio = function (audioStreamNode, requestSession) {
            // NOTE: Home-baked promises crash ios safari during the invocation
            // of the error callback chain (looks like the recursion is way too deep, and
            // it blows up the stack). The following construct is a stop-gap that does not
            // bubble the error up the callback chain and hence circumvents this problem.
            // TODO: rewrite with ES6 promises.
            var deferred = new Exports_2.Deferred();
            // The time we last sent data to the service.
            var lastSendTime = Date.now();
            var audioFormat = _this.privAudioSource.format;
            var readAndUploadCycle = function (_) {
                // If speech is done, stop sending audio.
                if (!_this.privIsDisposed && !requestSession.isSpeechEnded && !requestSession.isCompleted) {
                    _this.fetchConnection(requestSession).onSuccessContinueWith(function (connection) {
                        audioStreamNode.read().on(function (audioStreamChunk) {
                            // we have a new audio chunk to upload.
                            if (requestSession.isSpeechEnded) {
                                // If service already recognized audio end then dont send any more audio
                                deferred.resolve(true);
                                return;
                            }
                            var payload = (audioStreamChunk.isEnd) ? null : audioStreamChunk.buffer;
                            var uploaded = connection.send(new SpeechConnectionMessage_Internal_1.SpeechConnectionMessage(Exports_2.MessageType.Binary, "audio", requestSession.requestId, null, payload));
                            if (!audioStreamChunk.isEnd) {
                                // Caculate any delay to the audio stream needed. /2 to allow 2x real time transmit rate max.
                                var minSendTime = ((payload.byteLength / audioFormat.avgBytesPerSec) / 2) * 1000;
                                var delay_1 = Math.max(0, (lastSendTime - Date.now() + minSendTime));
                                uploaded.onSuccessContinueWith(function (result) {
                                    setTimeout(function () {
                                        lastSendTime = Date.now();
                                        readAndUploadCycle(result);
                                    }, delay_1);
                                });
                            }
                            else {
                                // the audio stream has been closed, no need to schedule next
                                // read-upload cycle.
                                requestSession.onSpeechEnded();
                                deferred.resolve(true);
                            }
                        }, function (error) {
                            if (requestSession.isSpeechEnded) {
                                // For whatever reason, Reject is used to remove queue subscribers inside
                                // the Queue.DrainAndDispose invoked from DetachAudioNode down below, which
                                // means that sometimes things can be rejected in normal circumstances, without
                                // any errors.
                                deferred.resolve(true); // TODO: remove the argument, it's is completely meaningless.
                            }
                            else {
                                // Only reject, if there was a proper error.
                                deferred.reject(error);
                            }
                        });
                    });
                }
            };
            readAndUploadCycle(true);
            return deferred.promise();
        };
        if (!authentication) {
            throw new Exports_2.ArgumentNullError("authentication");
        }
        if (!connectionFactory) {
            throw new Exports_2.ArgumentNullError("connectionFactory");
        }
        if (!audioSource) {
            throw new Exports_2.ArgumentNullError("audioSource");
        }
        if (!recognizerConfig) {
            throw new Exports_2.ArgumentNullError("recognizerConfig");
        }
        this.privMustReportEndOfStream = false;
        this.privAuthentication = authentication;
        this.privConnectionFactory = connectionFactory;
        this.privAudioSource = audioSource;
        this.privRecognizerConfig = recognizerConfig;
        this.privIsDisposed = false;
        this.privRecognizer = recognizer;
    }
    Object.defineProperty(ServiceRecognizerBase.prototype, "audioSource", {
        get: function () {
            return this.privAudioSource;
        },
        enumerable: true,
        configurable: true
    });
    ServiceRecognizerBase.prototype.isDisposed = function () {
        return this.privIsDisposed;
    };
    ServiceRecognizerBase.prototype.dispose = function (reason) {
        this.privIsDisposed = true;
        if (this.privConnectionConfigurationPromise) {
            this.privConnectionConfigurationPromise.onSuccessContinueWith(function (connection) {
                connection.dispose(reason);
            });
        }
    };
    ServiceRecognizerBase.prototype.recognize = function (speechContextJson, successCallback, errorCallBack) {
        var _this = this;
        var requestSession = new Exports_4.RequestSession(this.privAudioSource.id(), speechContextJson);
        requestSession.listenForServiceTelemetry(this.privAudioSource.events);
        return this.audioSource
            .attach(requestSession.audioNodeId)
            .continueWithPromise(function (result) {
            var audioNode;
            if (result.isError) {
                _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.ConnectionFailure, result.error, successCallback);
                return Exports_2.PromiseHelper.fromError(result.error);
            }
            else {
                audioNode = new Exports_1.ReplayableAudioNode(result.result, _this.audioSource.format);
                requestSession.onAudioSourceAttachCompleted(audioNode, false);
            }
            return _this.configureConnection(requestSession)
                .on(function (_) {
                var sessionStartEventArgs = new Exports_3.SessionEventArgs(requestSession.sessionId);
                if (!!_this.privRecognizer.sessionStarted) {
                    _this.privRecognizer.sessionStarted(_this.privRecognizer, sessionStartEventArgs);
                }
                var messageRetrievalPromise = _this.receiveMessage(requestSession, successCallback, errorCallBack);
                var audioSendPromise = _this.sendAudio(audioNode, requestSession);
                /* tslint:disable:no-empty */
                audioSendPromise.on(function (_) { }, function (error) {
                    _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.RuntimeError, error, successCallback);
                });
                var completionPromise = Exports_2.PromiseHelper.whenAll([messageRetrievalPromise, audioSendPromise]);
                return completionPromise.on(function (r) {
                    requestSession.dispose();
                    _this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                }, function (error) {
                    requestSession.dispose(error);
                    _this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                    _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.RuntimeError, error, successCallback);
                });
            }, function (error) {
                _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.ConnectionFailure, error, successCallback);
            }).on(function () {
                return requestSession.completionPromise;
            }, function (error) {
                _this.cancelRecognitionLocal(requestSession, Exports_3.CancellationReason.Error, Exports_3.CancellationErrorCode.RuntimeError, error, successCallback);
            }).onSuccessContinueWithPromise(function (_) {
                return Exports_2.PromiseHelper.fromResult(true);
            });
        });
    };
    // Cancels recognition.
    ServiceRecognizerBase.prototype.cancelRecognitionLocal = function (requestSession, cancellationReason, errorCode, error, cancelRecoCallback) {
        if (!requestSession.isCanceled) {
            requestSession.onCancelled();
            this.cancelRecognition(requestSession.sessionId, requestSession.requestId, cancellationReason, errorCode, error, cancelRecoCallback);
        }
    };
    ServiceRecognizerBase.telemetryDataEnabled = true;
    return ServiceRecognizerBase;
}());
exports.ServiceRecognizerBase = ServiceRecognizerBase;

//# sourceMappingURL=ServiceRecognizerBase.js.map
