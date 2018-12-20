"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var List = /** @class */ (function () {
    function List(list) {
        var _this = this;
        this.privSubscriptionIdCounter = 0;
        this.privAddSubscriptions = {};
        this.privRemoveSubscriptions = {};
        this.privDisposedSubscriptions = {};
        this.privDisposeReason = null;
        this.get = function (itemIndex) {
            _this.throwIfDisposed();
            return _this.privList[itemIndex];
        };
        this.first = function () {
            return _this.get(0);
        };
        this.last = function () {
            return _this.get(_this.length() - 1);
        };
        this.add = function (item) {
            _this.throwIfDisposed();
            _this.insertAt(_this.privList.length, item);
        };
        this.insertAt = function (index, item) {
            _this.throwIfDisposed();
            if (index === 0) {
                _this.privList.unshift(item);
            }
            else if (index === _this.privList.length) {
                _this.privList.push(item);
            }
            else {
                _this.privList.splice(index, 0, item);
            }
            _this.triggerSubscriptions(_this.privAddSubscriptions);
        };
        this.removeFirst = function () {
            _this.throwIfDisposed();
            return _this.removeAt(0);
        };
        this.removeLast = function () {
            _this.throwIfDisposed();
            return _this.removeAt(_this.length() - 1);
        };
        this.removeAt = function (index) {
            _this.throwIfDisposed();
            return _this.remove(index, 1)[0];
        };
        this.remove = function (index, count) {
            _this.throwIfDisposed();
            var removedElements = _this.privList.splice(index, count);
            _this.triggerSubscriptions(_this.privRemoveSubscriptions);
            return removedElements;
        };
        this.clear = function () {
            _this.throwIfDisposed();
            _this.remove(0, _this.length());
        };
        this.length = function () {
            _this.throwIfDisposed();
            return _this.privList.length;
        };
        this.onAdded = function (addedCallback) {
            _this.throwIfDisposed();
            var subscriptionId = _this.privSubscriptionIdCounter++;
            _this.privAddSubscriptions[subscriptionId] = addedCallback;
            return {
                detach: function () {
                    delete _this.privAddSubscriptions[subscriptionId];
                },
            };
        };
        this.onRemoved = function (removedCallback) {
            _this.throwIfDisposed();
            var subscriptionId = _this.privSubscriptionIdCounter++;
            _this.privRemoveSubscriptions[subscriptionId] = removedCallback;
            return {
                detach: function () {
                    delete _this.privRemoveSubscriptions[subscriptionId];
                },
            };
        };
        this.onDisposed = function (disposedCallback) {
            _this.throwIfDisposed();
            var subscriptionId = _this.privSubscriptionIdCounter++;
            _this.privDisposedSubscriptions[subscriptionId] = disposedCallback;
            return {
                detach: function () {
                    delete _this.privDisposedSubscriptions[subscriptionId];
                },
            };
        };
        this.join = function (seperator) {
            _this.throwIfDisposed();
            return _this.privList.join(seperator);
        };
        this.toArray = function () {
            var cloneCopy = Array();
            _this.privList.forEach(function (val) {
                cloneCopy.push(val);
            });
            return cloneCopy;
        };
        this.any = function (callback) {
            _this.throwIfDisposed();
            if (callback) {
                return _this.where(callback).length() > 0;
            }
            else {
                return _this.length() > 0;
            }
        };
        this.all = function (callback) {
            _this.throwIfDisposed();
            return _this.where(callback).length() === _this.length();
        };
        this.forEach = function (callback) {
            _this.throwIfDisposed();
            for (var i = 0; i < _this.length(); i++) {
                callback(_this.privList[i], i);
            }
        };
        this.select = function (callback) {
            _this.throwIfDisposed();
            var selectList = [];
            for (var i = 0; i < _this.privList.length; i++) {
                selectList.push(callback(_this.privList[i], i));
            }
            return new List(selectList);
        };
        this.where = function (callback) {
            _this.throwIfDisposed();
            var filteredList = new List();
            for (var i = 0; i < _this.privList.length; i++) {
                if (callback(_this.privList[i], i)) {
                    filteredList.add(_this.privList[i]);
                }
            }
            return filteredList;
        };
        this.orderBy = function (compareFn) {
            _this.throwIfDisposed();
            var clonedArray = _this.toArray();
            var orderedArray = clonedArray.sort(compareFn);
            return new List(orderedArray);
        };
        this.orderByDesc = function (compareFn) {
            _this.throwIfDisposed();
            return _this.orderBy(function (a, b) { return compareFn(b, a); });
        };
        this.clone = function () {
            _this.throwIfDisposed();
            return new List(_this.toArray());
        };
        this.concat = function (list) {
            _this.throwIfDisposed();
            return new List(_this.privList.concat(list.toArray()));
        };
        this.concatArray = function (array) {
            _this.throwIfDisposed();
            return new List(_this.privList.concat(array));
        };
        this.isDisposed = function () {
            return _this.privList == null;
        };
        this.dispose = function (reason) {
            if (!_this.isDisposed()) {
                _this.privDisposeReason = reason;
                _this.privList = null;
                _this.privAddSubscriptions = null;
                _this.privRemoveSubscriptions = null;
                _this.triggerSubscriptions(_this.privDisposedSubscriptions);
            }
        };
        this.throwIfDisposed = function () {
            if (_this.isDisposed()) {
                throw new Error_1.ObjectDisposedError("List", _this.privDisposeReason);
            }
        };
        this.triggerSubscriptions = function (subscriptions) {
            if (subscriptions) {
                for (var subscriptionId in subscriptions) {
                    if (subscriptionId) {
                        subscriptions[subscriptionId]();
                    }
                }
            }
        };
        this.privList = [];
        // copy the list rather than taking as is.
        if (list) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var item = list_1[_i];
                this.privList.push(item);
            }
        }
    }
    return List;
}());
exports.List = List;

//# sourceMappingURL=List.js.map
