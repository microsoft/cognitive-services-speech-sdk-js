"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines result of speech recognition.
 * @class RecognitionResult
 */
var RecognitionResult = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    function RecognitionResult(resultId, reason, text, duration, offset, errorDetails, json, properties) {
        this.privResultId = resultId;
        this.privReason = reason;
        this.privText = text;
        this.privDuration = duration;
        this.privOffset = offset;
        this.privErrorDetails = errorDetails;
        this.privJson = json;
        this.privProperties = properties;
    }
    Object.defineProperty(RecognitionResult.prototype, "resultId", {
        /**
         * Specifies the result identifier.
         * @member RecognitionResult.prototype.resultId
         * @function
         * @public
         * @returns {string} Specifies the result identifier.
         */
        get: function () {
            return this.privResultId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "reason", {
        /**
         * Specifies status of the result.
         * @member RecognitionResult.prototype.reason
         * @function
         * @public
         * @returns {ResultReason} Specifies status of the result.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "text", {
        /**
         * Presents the recognized text in the result.
         * @member RecognitionResult.prototype.text
         * @function
         * @public
         * @returns {string} Presents the recognized text in the result.
         */
        get: function () {
            return this.privText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "duration", {
        /**
         * Duration of recognized speech in 100 nano second incements.
         * @member RecognitionResult.prototype.duration
         * @function
         * @public
         * @returns {number} Duration of recognized speech in 100 nano second incements.
         */
        get: function () {
            return this.privDuration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "offset", {
        /**
         * Offset of recognized speech in 100 nano second incements.
         * @member RecognitionResult.prototype.offset
         * @function
         * @public
         * @returns {number} Offset of recognized speech in 100 nano second incements.
         */
        get: function () {
            return this.privOffset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "errorDetails", {
        /**
         * In case of an unsuccessful recognition, provides details of the occurred error.
         * @member RecognitionResult.prototype.errorDetails
         * @function
         * @public
         * @returns {string} a brief description of an error.
         */
        get: function () {
            return this.privErrorDetails;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "json", {
        /**
         * A string containing Json serialized recognition result as it was received from the service.
         * @member RecognitionResult.prototype.json
         * @function
         * @private
         * @returns {string} Json serialized representation of the result.
         */
        get: function () {
            return this.privJson;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognitionResult.prototype, "properties", {
        /**
         *  The set of properties exposed in the result.
         * @member RecognitionResult.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The set of properties exposed in the result.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    return RecognitionResult;
}());
exports.RecognitionResult = RecognitionResult;

//# sourceMappingURL=RecognitionResult.js.map
