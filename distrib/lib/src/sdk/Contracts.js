"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class Contracts
 * @private
 */
var Contracts = /** @class */ (function () {
    function Contracts() {
    }
    Contracts.throwIfNullOrUndefined = function (param, name) {
        if (param === undefined || param === null) {
            throw new Error("throwIfNullOrUndefined:" + name);
        }
    };
    Contracts.throwIfNull = function (param, name) {
        if (param === null) {
            throw new Error("throwIfNull:" + name);
        }
    };
    Contracts.throwIfNullOrWhitespace = function (param, name) {
        Contracts.throwIfNullOrUndefined(param, name);
        if (("" + param).trim().length < 1) {
            throw new Error("throwIfNullOrWhitespace:" + name);
        }
    };
    Contracts.throwIfDisposed = function (isDisposed) {
        if (isDisposed) {
            throw new Error("the object is already disposed");
        }
    };
    Contracts.throwIfArrayEmptyOrWhitespace = function (array, name) {
        Contracts.throwIfNullOrUndefined(array, name);
        if (array.length === 0) {
            throw new Error("throwIfArrayEmptyOrWhitespace:" + name);
        }
        for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
            var item = array_1[_i];
            Contracts.throwIfNullOrWhitespace(item, name);
        }
    };
    Contracts.throwIfFileDoesNotExist = function (param, name) {
        Contracts.throwIfNullOrWhitespace(param, name);
        // TODO check for file existence.
    };
    return Contracts;
}());
exports.Contracts = Contracts;

//# sourceMappingURL=Contracts.js.map
