"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
// Make sure not to export internal modules.
//
__export(require("./CognitiveSubscriptionKeyAuthentication"));
__export(require("./CognitiveTokenAuthentication"));
__export(require("./IAuthentication"));
__export(require("./IntentConnectionFactory"));
__export(require("./RecognitionEvents"));
__export(require("./ServiceRecognizerBase"));
__export(require("./RecognizerConfig"));
__export(require("./WebsocketMessageFormatter"));
__export(require("./SpeechConnectionFactory"));
__export(require("./TranslationConnectionFactory"));
__export(require("./EnumTranslation"));
__export(require("./ServiceMessages/Enums"));
__export(require("./ServiceMessages/TranslationSynthesisEnd"));
__export(require("./ServiceMessages/TranslationHypothesis"));
__export(require("./ServiceMessages/TranslationPhrase"));
__export(require("./TranslationServiceRecognizer"));
__export(require("./ServiceMessages/SpeechDetected"));
__export(require("./ServiceMessages/SpeechHypothesis"));
__export(require("./SpeechServiceRecognizer"));
__export(require("./ServiceMessages/DetailedSpeechPhrase"));
__export(require("./ServiceMessages/SimpleSpeechPhrase"));
__export(require("./AddedLmIntent"));
__export(require("./IntentServiceRecognizer"));
__export(require("./ServiceMessages/IntentResponse"));
__export(require("./RequestSession"));
exports.OutputFormatPropertyName = "OutputFormat";
exports.CancellationErrorCodePropertyName = "CancellationErrorCode";

//# sourceMappingURL=Exports.js.map
