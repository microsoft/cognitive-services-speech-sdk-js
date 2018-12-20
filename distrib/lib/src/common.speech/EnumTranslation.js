"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../sdk/Exports");
var Exports_2 = require("./Exports");
var EnumTranslation = /** @class */ (function () {
    function EnumTranslation() {
    }
    EnumTranslation.implTranslateRecognitionResult = function (recognitionStatus) {
        var reason = Exports_1.ResultReason.Canceled;
        switch (recognitionStatus) {
            case Exports_2.RecognitionStatus.Success:
                reason = Exports_1.ResultReason.RecognizedSpeech;
                break;
            case Exports_2.RecognitionStatus.NoMatch:
            case Exports_2.RecognitionStatus.InitialSilenceTimeout:
            case Exports_2.RecognitionStatus.BabbleTimeout:
            case Exports_2.RecognitionStatus.EndOfDictation:
                reason = Exports_1.ResultReason.NoMatch;
                break;
            case Exports_2.RecognitionStatus.Error:
            default:
                reason = Exports_1.ResultReason.Canceled;
                break;
        }
        return reason;
    };
    EnumTranslation.implTranslateCancelResult = function (recognitionStatus) {
        var reason = Exports_1.CancellationReason.EndOfStream;
        switch (recognitionStatus) {
            case Exports_2.RecognitionStatus.Success:
            case Exports_2.RecognitionStatus.EndOfDictation:
            case Exports_2.RecognitionStatus.NoMatch:
                reason = Exports_1.CancellationReason.EndOfStream;
                break;
            case Exports_2.RecognitionStatus.InitialSilenceTimeout:
            case Exports_2.RecognitionStatus.BabbleTimeout:
            case Exports_2.RecognitionStatus.Error:
            default:
                reason = Exports_1.CancellationReason.Error;
                break;
        }
        return reason;
    };
    return EnumTranslation;
}());
exports.EnumTranslation = EnumTranslation;

//# sourceMappingURL=EnumTranslation.js.map
