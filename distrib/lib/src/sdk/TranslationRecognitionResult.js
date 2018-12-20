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
 * Translation text result.
 * @class TranslationRecognitionResult
 */
var TranslationRecognitionResult = /** @class */ (function (_super) {
    __extends(TranslationRecognitionResult, _super);
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {Translations} translations - The translations.
     * @param {string} resultId - The result id.
     * @param {ResultReason} reason - The reason.
     * @param {string} text - The recognized text.
     * @param {number} duration - The duration.
     * @param {number} offset - The offset into the stream.
     * @param {string} errorDetails - Error details, if provided.
     * @param {string} json - Additional Json, if provided.
     * @param {PropertyCollection} properties - Additional properties, if provided.
     */
    function TranslationRecognitionResult(translations, resultId, reason, text, duration, offset, errorDetails, json, properties) {
        var _this = _super.call(this, resultId, reason, text, duration, offset, errorDetails, json, properties) || this;
        _this.privTranslations = translations;
        return _this;
    }
    Object.defineProperty(TranslationRecognitionResult.prototype, "translations", {
        /**
         * Presents the translation results. Each item in the dictionary represents
         * a translation result in one of target languages, where the key is the name
         * of the target language, in BCP-47 format, and the value is the translation
         * text in the specified language.
         * @member TranslationRecognitionResult.prototype.translations
         * @function
         * @public
         * @returns {Translations} the current translation map that holds all translations requested.
         */
        get: function () {
            return this.privTranslations;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationRecognitionResult;
}(Exports_1.SpeechRecognitionResult));
exports.TranslationRecognitionResult = TranslationRecognitionResult;

//# sourceMappingURL=TranslationRecognitionResult.js.map
