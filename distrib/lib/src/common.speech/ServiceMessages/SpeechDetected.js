"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var SpeechDetected = /** @class */ (function () {
    function SpeechDetected(json) {
        this.privSpeechStartDetected = JSON.parse(json);
    }
    SpeechDetected.fromJSON = function (json) {
        return new SpeechDetected(json);
    };
    Object.defineProperty(SpeechDetected.prototype, "Offset", {
        get: function () {
            return this.privSpeechStartDetected.Offset;
        },
        enumerable: true,
        configurable: true
    });
    return SpeechDetected;
}());
exports.SpeechDetected = SpeechDetected;

//# sourceMappingURL=SpeechDetected.js.map
