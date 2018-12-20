"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines translation synthesis result, i.e. the voice output of the translated
 * text in the target language.
 * @class TranslationSynthesisResult
 */
var TranslationSynthesisResult = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {ResultReason} reason - The synthesis reason.
     * @param {ArrayBuffer} audio - The audio data.
     */
    function TranslationSynthesisResult(reason, audio) {
        this.privReason = reason;
        this.privAudio = audio;
    }
    Object.defineProperty(TranslationSynthesisResult.prototype, "audio", {
        /**
         * Translated text in the target language.
         * @member TranslationSynthesisResult.prototype.audio
         * @function
         * @public
         * @returns {ArrayBuffer} Translated audio in the target language.
         */
        get: function () {
            return this.privAudio;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationSynthesisResult.prototype, "reason", {
        /**
         * The synthesis status.
         * @member TranslationSynthesisResult.prototype.reason
         * @function
         * @public
         * @returns {ResultReason} The synthesis status.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationSynthesisResult;
}());
exports.TranslationSynthesisResult = TranslationSynthesisResult;

//# sourceMappingURL=TranslationSynthesisResult.js.map
