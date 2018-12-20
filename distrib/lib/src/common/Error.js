"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The error that is thrown when an argument passed in is null.
 *
 * @export
 * @class ArgumentNullError
 * @extends {Error}
 */
var ArgumentNullError = /** @class */ (function (_super) {
    __extends(ArgumentNullError, _super);
    /**
     * Creates an instance of ArgumentNullError.
     *
     * @param {string} argumentName - Name of the argument that is null
     *
     * @memberOf ArgumentNullError
     */
    function ArgumentNullError(argumentName) {
        var _this = _super.call(this, argumentName) || this;
        _this.name = "ArgumentNull";
        _this.message = argumentName;
        return _this;
    }
    return ArgumentNullError;
}(Error));
exports.ArgumentNullError = ArgumentNullError;
/**
 * The error that is thrown when an invalid operation is performed in the code.
 *
 * @export
 * @class InvalidOperationError
 * @extends {Error}
 */
// tslint:disable-next-line:max-classes-per-file
var InvalidOperationError = /** @class */ (function (_super) {
    __extends(InvalidOperationError, _super);
    /**
     * Creates an instance of InvalidOperationError.
     *
     * @param {string} error - The error
     *
     * @memberOf InvalidOperationError
     */
    function InvalidOperationError(error) {
        var _this = _super.call(this, error) || this;
        _this.name = "InvalidOperation";
        _this.message = error;
        return _this;
    }
    return InvalidOperationError;
}(Error));
exports.InvalidOperationError = InvalidOperationError;
/**
 * The error that is thrown when an object is disposed.
 *
 * @export
 * @class ObjectDisposedError
 * @extends {Error}
 */
// tslint:disable-next-line:max-classes-per-file
var ObjectDisposedError = /** @class */ (function (_super) {
    __extends(ObjectDisposedError, _super);
    /**
     * Creates an instance of ObjectDisposedError.
     *
     * @param {string} objectName - The object that is disposed
     * @param {string} error - The error
     *
     * @memberOf ObjectDisposedError
     */
    function ObjectDisposedError(objectName, error) {
        var _this = _super.call(this, error) || this;
        _this.name = objectName + "ObjectDisposed";
        _this.message = error;
        return _this;
    }
    return ObjectDisposedError;
}(Error));
exports.ObjectDisposedError = ObjectDisposedError;

//# sourceMappingURL=Error.js.map
