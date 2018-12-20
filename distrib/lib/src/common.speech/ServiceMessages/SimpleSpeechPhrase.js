"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../Exports");
var SimpleSpeechPhrase = /** @class */ (function () {
    function SimpleSpeechPhrase(json) {
        this.privSimpleSpeechPhrase = JSON.parse(json);
        this.privSimpleSpeechPhrase.RecognitionStatus = Exports_1.RecognitionStatus[this.privSimpleSpeechPhrase.RecognitionStatus];
    }
    SimpleSpeechPhrase.fromJSON = function (json) {
        return new SimpleSpeechPhrase(json);
    };
    Object.defineProperty(SimpleSpeechPhrase.prototype, "RecognitionStatus", {
        get: function () {
            return this.privSimpleSpeechPhrase.RecognitionStatus;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleSpeechPhrase.prototype, "DisplayText", {
        get: function () {
            return this.privSimpleSpeechPhrase.DisplayText;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleSpeechPhrase.prototype, "Offset", {
        get: function () {
            return this.privSimpleSpeechPhrase.Offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SimpleSpeechPhrase.prototype, "Duration", {
        get: function () {
            return this.privSimpleSpeechPhrase.Duration;
        },
        enumerable: true,
        configurable: true
    });
    return SimpleSpeechPhrase;
}());
exports.SimpleSpeechPhrase = SimpleSpeechPhrase;

//# sourceMappingURL=SimpleSpeechPhrase.js.map
