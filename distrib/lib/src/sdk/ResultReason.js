"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines the possible reasons a recognition result might be generated.
 * @class ResultReason
 */
var ResultReason;
(function (ResultReason) {
    /**
     * Indicates speech could not be recognized. More details
     * can be found in the NoMatchDetails object.
     * @member ResultReason.NoMatch
     */
    ResultReason[ResultReason["NoMatch"] = 0] = "NoMatch";
    /**
     * Indicates that the recognition was canceled. More details
     * can be found using the CancellationDetails object.
     * @member ResultReason.Canceled
     */
    ResultReason[ResultReason["Canceled"] = 1] = "Canceled";
    /**
     * Indicates the speech result contains hypothesis text.
     * @member ResultReason.RecognizedSpeech
     */
    ResultReason[ResultReason["RecognizingSpeech"] = 2] = "RecognizingSpeech";
    /**
     * Indicates the speech result contains final text that has been recognized.
     * Speech Recognition is now complete for this phrase.
     * @member ResultReason.RecognizedSpeech
     */
    ResultReason[ResultReason["RecognizedSpeech"] = 3] = "RecognizedSpeech";
    /**
     * Indicates the intent result contains hypothesis text and intent.
     * @member ResultReason.RecognizingIntent
     */
    ResultReason[ResultReason["RecognizingIntent"] = 4] = "RecognizingIntent";
    /**
     * Indicates the intent result contains final text and intent.
     * Speech Recognition and Intent determination are now complete for this phrase.
     * @member ResultReason.RecognizedIntent
     */
    ResultReason[ResultReason["RecognizedIntent"] = 5] = "RecognizedIntent";
    /**
     * Indicates the translation result contains hypothesis text and its translation(s).
     * @member ResultReason.TranslatingSpeech
     */
    ResultReason[ResultReason["TranslatingSpeech"] = 6] = "TranslatingSpeech";
    /**
     * Indicates the translation result contains final text and corresponding translation(s).
     * Speech Recognition and Translation are now complete for this phrase.
     * @member ResultReason.TranslatedSpeech
     */
    ResultReason[ResultReason["TranslatedSpeech"] = 7] = "TranslatedSpeech";
    /**
     * Indicates the synthesized audio result contains a non-zero amount of audio data
     * @member ResultReason.SynthesizingAudio
     */
    ResultReason[ResultReason["SynthesizingAudio"] = 8] = "SynthesizingAudio";
    /**
     * Indicates the synthesized audio is now complete for this phrase.
     * @member ResultReason.SynthesizingAudioCompleted
     */
    ResultReason[ResultReason["SynthesizingAudioCompleted"] = 9] = "SynthesizingAudioCompleted";
})(ResultReason = exports.ResultReason || (exports.ResultReason = {}));

//# sourceMappingURL=ResultReason.js.map
