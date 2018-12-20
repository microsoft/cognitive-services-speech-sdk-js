"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Error_1 = require("./Error");
var InMemoryStorage_1 = require("./InMemoryStorage");
var Storage = /** @class */ (function () {
    function Storage() {
    }
    Object.defineProperty(Storage, "session", {
        get: function () {
            return Storage.privSessionStorage;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Storage, "local", {
        get: function () {
            return Storage.privLocalStorage;
        },
        enumerable: true,
        configurable: true
    });
    Storage.privSessionStorage = new InMemoryStorage_1.InMemoryStorage();
    Storage.privLocalStorage = new InMemoryStorage_1.InMemoryStorage();
    Storage.setSessionStorage = function (sessionStorage) {
        if (!sessionStorage) {
            throw new Error_1.ArgumentNullError("sessionStorage");
        }
        Storage.privSessionStorage = sessionStorage;
    };
    Storage.setLocalStorage = function (localStorage) {
        if (!localStorage) {
            throw new Error_1.ArgumentNullError("localStorage");
        }
        Storage.privLocalStorage = localStorage;
    };
    return Storage;
}());
exports.Storage = Storage;

//# sourceMappingURL=Storage.js.map
