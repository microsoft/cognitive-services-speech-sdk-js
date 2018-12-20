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
var Exports_1 = require("./Exports");
/**
 * Translation Synthesis event arguments
 * @class TranslationSynthesisEventArgs
 */
var TranslationSynthesisEventArgs = /** @class */ (function (_super) {
    __extends(TranslationSynthesisEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {TranslationSynthesisResult} result - The translation synthesis result.
     * @param {string} sessionId - The session id.
     */
    function TranslationSynthesisEventArgs(result, sessionId) {
        var _this = _super.call(this, sessionId) || this;
        _this.privResult = result;
        return _this;
    }
    Object.defineProperty(TranslationSynthesisEventArgs.prototype, "result", {
        /**
         * Specifies the translation synthesis result.
         * @member TranslationSynthesisEventArgs.prototype.result
         * @function
         * @public
         * @returns {TranslationSynthesisResult} Specifies the translation synthesis result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationSynthesisEventArgs;
}(Exports_1.SessionEventArgs));
exports.TranslationSynthesisEventArgs = TranslationSynthesisEventArgs;

//# sourceMappingURL=TranslationSynthesisEventArgs.js.map
