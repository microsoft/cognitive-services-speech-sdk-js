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
 * Intent recognition result.
 * @class
 */
var IntentRecognitionResult = /** @class */ (function (_super) {
    __extends(IntentRecognitionResult, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param intentId - The intent id.
     * @param resultId - The result id.
     * @param reason - The reason.
     * @param text - The recognized text.
     * @param duration - The duration.
     * @param offset - The offset into the stream.
     * @param errorDetails - Error details, if provided.
     * @param json - Additional Json, if provided.
     * @param properties - Additional properties, if provided.
     */
    function IntentRecognitionResult(intentId, resultId, reason, text, duration, offset, errorDetails, json, properties) {
        var _this = _super.call(this, resultId, reason, text, duration, offset, errorDetails, json, properties) || this;
        _this.privIntentId = intentId;
        return _this;
    }
    Object.defineProperty(IntentRecognitionResult.prototype, "intentId", {
        /**
         * A String that represents the intent identifier being recognized.
         * @member IntentRecognitionResult.prototype.intentId
         * @function
         * @public
         * @returns {string} A String that represents the intent identifier being recognized.
         */
        get: function () {
            return this.privIntentId;
        },
        enumerable: true,
        configurable: true
    });
    return IntentRecognitionResult;
}(Exports_1.SpeechRecognitionResult));
exports.IntentRecognitionResult = IntentRecognitionResult;

//# sourceMappingURL=IntentRecognitionResult.js.map
