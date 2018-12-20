"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common.speech/Exports");
var Exports_2 = require("./Exports");
/**
 * Contains detailed information about why a result was canceled.
 * @class CancellationDetails
 */
var CancellationDetails = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {CancellationReason} reason - The cancellation reason.
     * @param {string} errorDetails - The error details, if provided.
     */
    function CancellationDetails(reason, errorDetails, errorCode) {
        this.privReason = reason;
        this.privErrorDetails = errorDetails;
        this.privErrorCode = errorCode;
    }
    /**
     * Creates an instance of CancellationDetails object for the canceled RecognitionResult.
     * @member CancellationDetails.fromResult
     * @function
     * @public
     * @param {RecognitionResult} result - The result that was canceled.
     * @returns {CancellationDetails} The cancellation details object being created.
     */
    CancellationDetails.fromResult = function (result) {
        var reason = Exports_2.CancellationReason.Error;
        var errorCode = Exports_2.CancellationErrorCode.NoError;
        if (!!result.json) {
            var simpleSpeech = Exports_1.SimpleSpeechPhrase.fromJSON(result.json);
            reason = Exports_1.EnumTranslation.implTranslateCancelResult(simpleSpeech.RecognitionStatus);
        }
        if (!!result.properties) {
            errorCode = Exports_2.CancellationErrorCode[result.properties.getProperty(Exports_1.CancellationErrorCodePropertyName, Exports_2.CancellationErrorCode[Exports_2.CancellationErrorCode.NoError])];
        }
        return new CancellationDetails(reason, result.errorDetails, errorCode);
    };
    Object.defineProperty(CancellationDetails.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member CancellationDetails.prototype.reason
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
    Object.defineProperty(CancellationDetails.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member CancellationDetails.prototype.errorDetails
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
    Object.defineProperty(CancellationDetails.prototype, "ErrorCode", {
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
    return CancellationDetails;
}());
exports.CancellationDetails = CancellationDetails;

//# sourceMappingURL=CancellationDetails.js.map
