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
 * Intent recognition result event arguments.
 * @class
 */
var IntentRecognitionEventArgs = /** @class */ (function (_super) {
    __extends(IntentRecognitionEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param result - The result of the intent recognition.
     * @param offset - The offset.
     * @param sessionId - The session id.
     */
    function IntentRecognitionEventArgs(result, offset, sessionId) {
        var _this = _super.call(this, offset, sessionId) || this;
        _this.privResult = result;
        return _this;
    }
    Object.defineProperty(IntentRecognitionEventArgs.prototype, "result", {
        /**
         * Represents the intent recognition result.
         * @member IntentRecognitionEventArgs.prototype.result
         * @function
         * @public
         * @returns {IntentRecognitionResult} Represents the intent recognition result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    return IntentRecognitionEventArgs;
}(Exports_1.RecognitionEventArgs));
exports.IntentRecognitionEventArgs = IntentRecognitionEventArgs;

//# sourceMappingURL=IntentRecognitionEventArgs.js.map
