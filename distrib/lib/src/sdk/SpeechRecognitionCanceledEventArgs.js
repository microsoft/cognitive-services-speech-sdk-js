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
 * Defines content of a RecognitionErrorEvent.
 * @class SpeechRecognitionCanceledEventArgs
 */
var SpeechRecognitionCanceledEventArgs = /** @class */ (function (_super) {
    __extends(SpeechRecognitionCanceledEventArgs, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    function SpeechRecognitionCanceledEventArgs(reason, errorDetails, errorCode, offset, sessionId) {
        var _this = _super.call(this, offset, sessionId) || this;
        _this.privReason = reason;
        _this.privErrorDetails = errorDetails;
        _this.privErrorCode = errorCode;
        return _this;
    }
    Object.defineProperty(SpeechRecognitionCanceledEventArgs.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member SpeechRecognitionCanceledEventArgs.prototype.reason
         * @function
         * @public
         * @returns {CancellationReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognitionCanceledEventArgs.prototype, "errorCode", {
        /**
         * The error code in case of an unsuccessful recognition.
         * Added in version 1.1.0.
         * @return An error code that represents the error reason.
         */
        get: function () {
            return this.privErrorCode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognitionCanceledEventArgs.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member SpeechRecognitionCanceledEventArgs.prototype.errorDetails
         * @function
         * @public
         * @returns {string} A String that represents the error details.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechRecognitionCanceledEventArgs;
}(Exports_1.RecognitionEventArgs));
exports.SpeechRecognitionCanceledEventArgs = SpeechRecognitionCanceledEventArgs;

//# sourceMappingURL=SpeechRecognitionCanceledEventArgs.js.map
