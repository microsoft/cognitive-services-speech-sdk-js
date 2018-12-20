"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common/Exports");
var LocalStorage = /** @class */ (function () {
    function LocalStorage() {
        this.get = function (key) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            return localStorage.getItem(key);
        };
        this.getOrAdd = function (key, valueToAdd) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            var value = localStorage.getItem(key);
            if (value === null || value === undefined) {
                localStorage.setItem(key, valueToAdd);
            }
            return localStorage.getItem(key);
        };
        this.set = function (key, value) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            localStorage.setItem(key, value);
        };
        this.remove = function (key) {
            if (!key) {
                throw new Exports_1.ArgumentNullError("key");
            }
            localStorage.removeItem(key);
        };
    }
    return LocalStorage;
}());
exports.LocalStorage = LocalStorage;

//# sourceMappingURL=LocalStorage.js.map
