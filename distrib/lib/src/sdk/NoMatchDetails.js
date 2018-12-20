"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../../src/common.speech/Exports");
var Exports_2 = require("./Exports");
/**
 * Contains detailed information for NoMatch recognition results.
 * @class NoMatchDetails
 */
var NoMatchDetails = /** @class */ (function () {
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {NoMatchReason} reason - The no-match reason.
     */
    function NoMatchDetails(reason) {
        this.privReason = reason;
    }
    /**
     * Creates an instance of NoMatchDetails object for the NoMatch SpeechRecognitionResults.
     * @member NoMatchDetails.fromResult
     * @function
     * @public
     * @param {SpeechRecognitionResult | IntentRecognitionResult | TranslationRecognitionResult}
     *        result - The recognition result that was not recognized.
     * @returns {NoMatchDetails} The no match details object being created.
     */
    NoMatchDetails.fromResult = function (result) {
        var simpleSpeech = Exports_1.SimpleSpeechPhrase.fromJSON(result.json);
        var reason = Exports_2.NoMatchReason.NotRecognized;
        switch (simpleSpeech.RecognitionStatus) {
            case Exports_1.RecognitionStatus.BabbleTimeout:
                reason = Exports_2.NoMatchReason.InitialBabbleTimeout;
                break;
            case Exports_1.RecognitionStatus.InitialSilenceTimeout:
                reason = Exports_2.NoMatchReason.InitialSilenceTimeout;
                break;
            default:
                reason = Exports_2.NoMatchReason.NotRecognized;
                break;
        }
        return new NoMatchDetails(reason);
    };
    Object.defineProperty(NoMatchDetails.prototype, "reason", {
        /**
         * The reason the recognition was canceled.
         * @member NoMatchDetails.prototype.reason
         * @function
         * @public
         * @returns {NoMatchReason} Specifies the reason canceled.
         */
        get: function () {
            return this.privReason;
        },
        enumerable: true,
        configurable: true
    });
    return NoMatchDetails;
}());
exports.NoMatchDetails = NoMatchDetails;

//# sourceMappingURL=NoMatchDetails.js.map
