"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var TranslationStatus_1 = require("../TranslationStatus");
var TranslationHypothesis = /** @class */ (function () {
    function TranslationHypothesis(json) {
        this.privTranslationHypothesis = JSON.parse(json);
        this.privTranslationHypothesis.Translation.TranslationStatus = TranslationStatus_1.TranslationStatus[this.privTranslationHypothesis.Translation.TranslationStatus];
    }
    TranslationHypothesis.fromJSON = function (json) {
        return new TranslationHypothesis(json);
    };
    Object.defineProperty(TranslationHypothesis.prototype, "Duration", {
        get: function () {
            return this.privTranslationHypothesis.Duration;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationHypothesis.prototype, "Offset", {
        get: function () {
            return this.privTranslationHypothesis.Offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationHypothesis.prototype, "Text", {
        get: function () {
            return this.privTranslationHypothesis.Text;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationHypothesis.prototype, "Translation", {
        get: function () {
            return this.privTranslationHypothesis.Translation;
        },
        enumerable: true,
        configurable: true
    });
    return TranslationHypothesis;
}());
exports.TranslationHypothesis = TranslationHypothesis;

//# sourceMappingURL=TranslationHypothesis.js.map
