"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var PromiseState;
(function (PromiseState) {
    PromiseState[PromiseState["None"] = 0] = "None";
    PromiseState[PromiseState["Resolved"] = 1] = "Resolved";
    PromiseState[PromiseState["Rejected"] = 2] = "Rejected";
})(PromiseState = exports.PromiseState || (exports.PromiseState = {}));
var PromiseResult = /** @class */ (function () {
    function PromiseResult(promiseResultEventSource) {
        var _this = this;
        this.throwIfError = function () {
            if (_this.isError) {
                throw _this.error;
            }
        };
        promiseResultEventSource.on(function (result) {
            if (!_this.privIsCompleted) {
                _this.privIsCompleted = true;
                _this.privIsError = false;
                _this.privResult = result;
            }
        }, function (error) {
            if (!_this.privIsCompleted) {
                _this.privIsCompleted = true;
                _this.privIsError = true;
                _this.privError = error;
            }
        });
    }
    Object.defineProperty(PromiseResult.prototype, "isCompleted", {
        get: function () {
            return this.privIsCompleted;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseResult.prototype, "isError", {
        get: function () {
            return this.privIsError;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseResult.prototype, "error", {
        get: function () {
            return this.privError;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseResult.prototype, "result", {
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return PromiseResult;
}());
exports.PromiseResult = PromiseResult;
// tslint:disable-next-line:max-classes-per-file
var PromiseResultEventSource = /** @class */ (function () {
    function PromiseResultEventSource() {
        var _this = this;
        this.setResult = function (result) {
            _this.privOnSetResult(result);
        };
        this.setError = function (error) {
            _this.privOnSetError(error);
        };
        this.on = function (onSetResult, onSetError) {
            _this.privOnSetResult = onSetResult;
            _this.privOnSetError = onSetError;
        };
    }
    return PromiseResultEventSource;
}());
exports.PromiseResultEventSource = PromiseResultEventSource;
// tslint:disable-next-line:max-classes-per-file
var PromiseHelper = /** @class */ (function () {
    function PromiseHelper() {
    }
    PromiseHelper.whenAll = function (promises) {
        if (!promises || promises.length === 0) {
            throw new Error_1.ArgumentNullError("promises");
        }
        var deferred = new Deferred();
        var errors = [];
        var completedPromises = 0;
        var checkForCompletion = function () {
            completedPromises++;
            if (completedPromises === promises.length) {
                if (errors.length === 0) {
                    deferred.resolve(true);
                }
                else {
                    deferred.reject(errors.join(", "));
                }
            }
        };
        for (var _i = 0, promises_1 = promises; _i < promises_1.length; _i++) {
            var promise = promises_1[_i];
            promise.on(function (r) {
                checkForCompletion();
            }, function (e) {
                errors.push(e);
                checkForCompletion();
            });
        }
        return deferred.promise();
    };
    PromiseHelper.fromResult = function (result) {
        var deferred = new Deferred();
        deferred.resolve(result);
        return deferred.promise();
    };
    PromiseHelper.fromError = function (error) {
        var deferred = new Deferred();
        deferred.reject(error);
        return deferred.promise();
    };
    return PromiseHelper;
}());
exports.PromiseHelper = PromiseHelper;
// TODO: replace with ES6 promises
// tslint:disable-next-line:max-classes-per-file
var Promise = /** @class */ (function () {
    function Promise(sink) {
        var _this = this;
        this.result = function () {
            return _this.privSink.result;
        };
        this.continueWith = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationResult = continuationCallback(_this.privSink.result);
                    continuationDeferral.resolve(continuationResult);
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                try {
                    var continuationResult = continuationCallback(_this.privSink.result);
                    continuationDeferral.resolve(continuationResult);
                }
                catch (e) {
                    continuationDeferral.reject("'Error handler for error " + error + " threw error " + e + "'");
                }
            });
            return continuationDeferral.promise();
        };
        this.onSuccessContinueWith = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationResult = continuationCallback(r);
                    continuationDeferral.resolve(continuationResult);
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                continuationDeferral.reject(error);
            });
            return continuationDeferral.promise();
        };
        this.continueWithPromise = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationPromise = continuationCallback(_this.privSink.result);
                    if (!continuationPromise) {
                        throw new Error("'Continuation callback did not return promise'");
                    }
                    continuationPromise.on(function (continuationResult) {
                        continuationDeferral.resolve(continuationResult);
                    }, function (e) {
                        continuationDeferral.reject(e);
                    });
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                try {
                    var continuationPromise = continuationCallback(_this.privSink.result);
                    if (!continuationPromise) {
                        throw new Error("Continuation callback did not return promise");
                    }
                    continuationPromise.on(function (continuationResult) {
                        continuationDeferral.resolve(continuationResult);
                    }, function (e) {
                        continuationDeferral.reject(e);
                    });
                }
                catch (e) {
                    continuationDeferral.reject("'Error handler for error " + error + " threw error " + e + "'");
                }
            });
            return continuationDeferral.promise();
        };
        this.onSuccessContinueWithPromise = function (continuationCallback) {
            if (!continuationCallback) {
                throw new Error_1.ArgumentNullError("continuationCallback");
            }
            var continuationDeferral = new Deferred();
            _this.privSink.on(function (r) {
                try {
                    var continuationPromise = continuationCallback(r);
                    if (!continuationPromise) {
                        throw new Error("Continuation callback did not return promise");
                    }
                    continuationPromise.on(function (continuationResult) {
                        continuationDeferral.resolve(continuationResult);
                    }, function (e) {
                        continuationDeferral.reject(e);
                    });
                }
                catch (e) {
                    continuationDeferral.reject(e);
                }
            }, function (error) {
                continuationDeferral.reject(error);
            });
            return continuationDeferral.promise();
        };
        this.on = function (successCallback, errorCallback) {
            if (!successCallback) {
                throw new Error_1.ArgumentNullError("successCallback");
            }
            if (!errorCallback) {
                throw new Error_1.ArgumentNullError("errorCallback");
            }
            _this.privSink.on(successCallback, errorCallback);
            return _this;
        };
        this.finally = function (callback) {
            if (!callback) {
                throw new Error_1.ArgumentNullError("callback");
            }
            var callbackWrapper = function (_) {
                callback();
            };
            return _this.on(callbackWrapper, callbackWrapper);
        };
        this.privSink = sink;
    }
    return Promise;
}());
exports.Promise = Promise;
// tslint:disable-next-line:max-classes-per-file
var Deferred = /** @class */ (function () {
    function Deferred() {
        var _this = this;
        this.state = function () {
            return _this.privSink.state;
        };
        this.promise = function () {
            return _this.privPromise;
        };
        this.resolve = function (result) {
            _this.privSink.resolve(result);
            return _this;
        };
        this.reject = function (error) {
            _this.privSink.reject(error);
            return _this;
        };
        this.privSink = new Sink();
        this.privPromise = new Promise(this.privSink);
    }
    return Deferred;
}());
exports.Deferred = Deferred;
// tslint:disable-next-line:max-classes-per-file
var Sink = /** @class */ (function () {
    function Sink() {
        var _this = this;
        this.privState = PromiseState.None;
        this.privPromiseResult = null;
        this.privPromiseResultEvents = null;
        this.privSuccessHandlers = [];
        this.privErrorHandlers = [];
        this.resolve = function (result) {
            if (_this.privState !== PromiseState.None) {
                throw new Error("'Cannot resolve a completed promise'");
            }
            _this.privState = PromiseState.Resolved;
            _this.privPromiseResultEvents.setResult(result);
            for (var i = 0; i < _this.privSuccessHandlers.length; i++) {
                _this.executeSuccessCallback(result, _this.privSuccessHandlers[i], _this.privErrorHandlers[i]);
            }
            _this.detachHandlers();
        };
        this.reject = function (error) {
            if (_this.privState !== PromiseState.None) {
                throw new Error("'Cannot reject a completed promise'");
            }
            _this.privState = PromiseState.Rejected;
            _this.privPromiseResultEvents.setError(error);
            for (var _i = 0, _a = _this.privErrorHandlers; _i < _a.length; _i++) {
                var errorHandler = _a[_i];
                _this.executeErrorCallback(error, errorHandler);
            }
            _this.detachHandlers();
        };
        this.on = function (successCallback, errorCallback) {
            if (successCallback == null) {
                successCallback = function (r) { return; };
            }
            if (_this.privState === PromiseState.None) {
                _this.privSuccessHandlers.push(successCallback);
                _this.privErrorHandlers.push(errorCallback);
            }
            else {
                if (_this.privState === PromiseState.Resolved) {
                    _this.executeSuccessCallback(_this.privPromiseResult.result, successCallback, errorCallback);
                }
                else if (_this.privState === PromiseState.Rejected) {
                    _this.executeErrorCallback(_this.privPromiseResult.error, errorCallback);
                }
                _this.detachHandlers();
            }
        };
        this.executeSuccessCallback = function (result, successCallback, errorCallback) {
            try {
                successCallback(result);
            }
            catch (e) {
                _this.executeErrorCallback("'Unhandled callback error: " + e + "'", errorCallback);
            }
        };
        this.executeErrorCallback = function (error, errorCallback) {
            if (errorCallback) {
                try {
                    errorCallback(error);
                }
                catch (e) {
                    throw new Error("'Unhandled callback error: " + e + ". InnerError: " + error + "'");
                }
            }
            else {
                throw new Error("'Unhandled error: " + error + "'");
            }
        };
        this.detachHandlers = function () {
            _this.privErrorHandlers = [];
            _this.privSuccessHandlers = [];
        };
        this.privPromiseResultEvents = new PromiseResultEventSource();
        this.privPromiseResult = new PromiseResult(this.privPromiseResultEvents);
    }
    Object.defineProperty(Sink.prototype, "state", {
        get: function () {
            return this.privState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Sink.prototype, "result", {
        get: function () {
            return this.privPromiseResult;
        },
        enumerable: true,
        configurable: true
    });
    return Sink;
}());
exports.Sink = Sink;

//# sourceMappingURL=Promise.js.map
