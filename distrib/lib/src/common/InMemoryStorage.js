"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var InMemoryStorage = /** @class */ (function () {
    function InMemoryStorage() {
        var _this = this;
        this.privStore = {};
        this.get = function (key) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            return _this.privStore[key];
        };
        this.getOrAdd = function (key, valueToAdd) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            if (_this.privStore[key] === undefined) {
                _this.privStore[key] = valueToAdd;
            }
            return _this.privStore[key];
        };
        this.set = function (key, value) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            _this.privStore[key] = value;
        };
        this.remove = function (key) {
            if (!key) {
                throw new Error_1.ArgumentNullError("key");
            }
            if (_this.privStore[key] !== undefined) {
                delete _this.privStore[key];
            }
        };
    }
    return InMemoryStorage;
}());
exports.InMemoryStorage = InMemoryStorage;

//# sourceMappingURL=InMemoryStorage.js.map
