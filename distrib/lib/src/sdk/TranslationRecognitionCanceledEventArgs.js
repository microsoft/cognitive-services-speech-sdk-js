"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Define payload of speech recognition canceled result events.
 * @class TranslationRecognitionCanceledEventArgs
 */
var TranslationRecognitionCanceledEventArgs = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} sessionid - The session id.
     * @param {CancellationReason} cancellationReason - The cancellation reason.
     * @param {string} errorDetails - Error details, if provided.
     * @param {TranslationRecognitionResult} result - The result.
     */
    function TranslationRecognitionCanceledEventArgs(sessionid, cancellationReason, errorDetails, errorCode, result) {
        this.privCancelReason = cancellationReason;
        this.privErrorDetails = errorDetails;
        this.privResult = result;
        this.privSessionId = sessionid;
        this.privErrorCode = errorCode;
    }
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "result", {
        /**
         * Specifies the recognition result.
         * @member TranslationRecognitionCanceledEventArgs.prototype.result
         * @function
         * @public
         * @returns {TranslationRecognitionResult} the recognition result.
         */
        get: function () {
            return this.privResult;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "sessionId", {
        /**
         * Specifies the session identifier.
         * @member TranslationRecognitionCanceledEventArgs.prototype.sessionId
         * @function
         * @public
         * @returns {string} the session identifier.
         */
        get: function () {
            return this.privSessionId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member TranslationRecognitionCanceledEventArgs.prototype.reason
         * @function
         * @public
         * @returns {CancellationReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privCancelReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "errorCode", {
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
    Object.defineProperty(TranslationRecognitionCanceledEventArgs.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member TranslationRecognitionCanceledEventArgs.prototype.errorDetails
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
    return TranslationRecognitionCanceledEventArgs;
}());
exports.TranslationRecognitionCanceledEventArgs = TranslationRecognitionCanceledEventArgs;

//# sourceMappingURL=TranslationRecognitionCanceledEventArgs.js.map
