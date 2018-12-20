"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var List_1 = require("./List");
var Promise_1 = require("./Promise");
var SubscriberType;
(function (SubscriberType) {
    SubscriberType[SubscriberType["Dequeue"] = 0] = "Dequeue";
    SubscriberType[SubscriberType["Peek"] = 1] = "Peek";
})(SubscriberType || (SubscriberType = {}));
var Queue = /** @class */ (function () {
    function Queue(list) {
        var _this = this;
        this.privPromiseStore = new List_1.List();
        this.privIsDrainInProgress = false;
        this.privIsDisposing = false;
        this.privDisposeReason = null;
        this.enqueue = function (item) {
            _this.throwIfDispose();
            _this.enqueueFromPromise(Promise_1.PromiseHelper.fromResult(item));
        };
        this.enqueueFromPromise = function (promise) {
            _this.throwIfDispose();
            _this.privPromiseStore.add(promise);
            promise.finally(function () {
                while (_this.privPromiseStore.length() > 0) {
                    if (!_this.privPromiseStore.first().result().isCompleted) {
                        break;
                    }
                    else {
                        var p = _this.privPromiseStore.removeFirst();
                        if (!p.result().isError) {
                            _this.privList.add(p.result().result);
                        }
                        else {
                            // TODO: Log as warning.
                        }
                    }
                }
            });
        };
        this.dequeue = function () {
            _this.throwIfDispose();
            var deferredSubscriber = new Promise_1.Deferred();
            if (_this.privSubscribers) {
                _this.privSubscribers.add({ deferral: deferredSubscriber, type: SubscriberType.Dequeue });
                _this.drain();
            }
            return deferredSubscriber.promise();
        };
        this.peek = function () {
            _this.throwIfDispose();
            var deferredSubscriber = new Promise_1.Deferred();
            var subs = _this.privSubscribers;
            if (subs) {
                _this.privSubscribers.add({ deferral: deferredSubscriber, type: SubscriberType.Peek });
                _this.drain();
            }
            return deferredSubscriber.promise();
        };
        this.length = function () {
            _this.throwIfDispose();
            return _this.privList.length();
        };
        this.isDisposed = function () {
            return _this.privSubscribers == null;
        };
        this.drainAndDispose = function (pendingItemProcessor, reason) {
            if (!_this.isDisposed() && !_this.privIsDisposing) {
                _this.privDisposeReason = reason;
                _this.privIsDisposing = true;
                var subs = _this.privSubscribers;
                if (subs) {
                    while (subs.length() > 0) {
                        var subscriber = subs.removeFirst();
                        // TODO: this needs work (Resolve(null) instead?).
                        subscriber.deferral.resolve(undefined);
                        // subscriber.deferral.reject("Disposed");
                    }
                    // note: this block assumes cooperative multitasking, i.e.,
                    // between the if-statement and the assignment there are no
                    // thread switches.
                    // Reason is that between the initial const = this.; and this
                    // point there is the derral.resolve() operation that might have
                    // caused recursive calls to the Queue, especially, calling
                    // Dispose() on the queue alredy (which would reset the var
                    // here to null!).
                    // That should generally hold true for javascript...
                    if (_this.privSubscribers === subs) {
                        _this.privSubscribers = subs;
                    }
                }
                for (var _i = 0, _a = _this.privDetachables; _i < _a.length; _i++) {
                    var detachable = _a[_i];
                    detachable.detach();
                }
                if (_this.privPromiseStore.length() > 0 && pendingItemProcessor) {
                    return Promise_1.PromiseHelper
                        .whenAll(_this.privPromiseStore.toArray())
                        .continueWith(function () {
                        _this.privSubscribers = null;
                        _this.privList.forEach(function (item, index) {
                            pendingItemProcessor(item);
                        });
                        _this.privList = null;
                        return true;
                    });
                }
                else {
                    _this.privSubscribers = null;
                    _this.privList = null;
                }
            }
            return Promise_1.PromiseHelper.fromResult(true);
        };
        this.dispose = function (reason) {
            _this.drainAndDispose(null, reason);
        };
        this.drain = function () {
            if (!_this.privIsDrainInProgress && !_this.privIsDisposing) {
                _this.privIsDrainInProgress = true;
                var subs = _this.privSubscribers;
                var lists = _this.privList;
                if (subs && lists) {
                    while (lists.length() > 0 && subs.length() > 0 && !_this.privIsDisposing) {
                        var subscriber = subs.removeFirst();
                        if (subscriber.type === SubscriberType.Peek) {
                            subscriber.deferral.resolve(lists.first());
                        }
                        else {
                            var dequeuedItem = lists.removeFirst();
                            subscriber.deferral.resolve(dequeuedItem);
                        }
                    }
                    // note: this block assumes cooperative multitasking, i.e.,
                    // between the if-statement and the assignment there are no
                    // thread switches.
                    // Reason is that between the initial const = this.; and this
                    // point there is the derral.resolve() operation that might have
                    // caused recursive calls to the Queue, especially, calling
                    // Dispose() on the queue alredy (which would reset the var
                    // here to null!).
                    // That should generally hold true for javascript...
                    if (_this.privSubscribers === subs) {
                        _this.privSubscribers = subs;
                    }
                    // note: this block assumes cooperative multitasking, i.e.,
                    // between the if-statement and the assignment there are no
                    // thread switches.
                    // Reason is that between the initial const = this.; and this
                    // point there is the derral.resolve() operation that might have
                    // caused recursive calls to the Queue, especially, calling
                    // Dispose() on the queue alredy (which would reset the var
                    // here to null!).
                    // That should generally hold true for javascript...
                    if (_this.privList === lists) {
                        _this.privList = lists;
                    }
                }
                _this.privIsDrainInProgress = false;
            }
        };
        this.throwIfDispose = function () {
            if (_this.isDisposed()) {
                if (_this.privDisposeReason) {
                    throw new Error_1.InvalidOperationError(_this.privDisposeReason);
                }
                throw new Error_1.ObjectDisposedError("Queue");
            }
            else if (_this.privIsDisposing) {
                throw new Error_1.InvalidOperationError("Queue disposing");
            }
        };
        this.privList = list ? list : new List_1.List();
        this.privDetachables = [];
        this.privSubscribers = new List_1.List();
        this.privDetachables.push(this.privList.onAdded(this.drain));
    }
    return Queue;
}());
exports.Queue = Queue;

//# sourceMappingURL=Queue.js.map
