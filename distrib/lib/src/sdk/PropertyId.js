"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Defines speech property ids.
 * @class PropertyId
 */
var PropertyId;
(function (PropertyId) {
    /**
     * The Cognitive Services Speech Service subscription Key. If you are using an intent recognizer, you need to specify
     * to specify the LUIS endpoint key for your particular LUIS app. Under normal circumstances, you shouldn't
     * have to use this property directly.
     * Instead, use @see SpeechConfig.fromSubscription.
     * @member PropertyId.SpeechServiceConnection_Key
     */
    PropertyId[PropertyId["SpeechServiceConnection_Key"] = 0] = "SpeechServiceConnection_Key";
    /**
     * The Cognitive Services Speech Service endpoint (url). Under normal circumstances, you shouldn't
     * have to use this property directly.
     * Instead, use @see SpeechConfig.fromEndpoint.
     * NOTE: This endpoint is not the same as the endpoint used to obtain an access token.
     * @member PropertyId.SpeechServiceConnection_Endpoint
     */
    PropertyId[PropertyId["SpeechServiceConnection_Endpoint"] = 1] = "SpeechServiceConnection_Endpoint";
    /**
     * The Cognitive Services Speech Service region. Under normal circumstances, you shouldn't have to
     * use this property directly.
     * Instead, use @see SpeechConfig.fromSubscription, @see SpeechConfig.fromEndpoint, @see SpeechConfig.fromAuthorizationToken.
     * @member PropertyId.SpeechServiceConnection_Region
     */
    PropertyId[PropertyId["SpeechServiceConnection_Region"] = 2] = "SpeechServiceConnection_Region";
    /**
     * The Cognitive Services Speech Service authorization token (aka access token). Under normal circumstances,
     * you shouldn't have to use this property directly.
     * Instead, use @see SpeechConfig.fromAuthorizationToken,
     * @see SpeechRecognizer.setAuthorizationToken, @see IntentRecognizer.setAuthorizationToken, @see TranslationRecognizer.setAuthorizationToken.
     * @member PropertyId.SpeechServiceAuthorization_Token
     */
    PropertyId[PropertyId["SpeechServiceAuthorization_Token"] = 3] = "SpeechServiceAuthorization_Token";
    /**
     * The Cognitive Services Speech Service authorization type. Currently unused.
     * @member PropertyId.SpeechServiceAuthorization_Type
     */
    PropertyId[PropertyId["SpeechServiceAuthorization_Type"] = 4] = "SpeechServiceAuthorization_Type";
    /**
     * The Cognitive Services Custom Speech Service endpoint id. Under normal circumstances, you shouldn't
     * have to use this property directly.
     * Instead, use @see SpeechConfig.setEndpointId.
     * NOTE: The endpoint id is available in the Custom Speech Portal, listed under Endpoint Details.
     * @member PropertyId.SpeechServiceConnection_EndpointId
     */
    PropertyId[PropertyId["SpeechServiceConnection_EndpointId"] = 5] = "SpeechServiceConnection_EndpointId";
    /**
     * The list of comma separated languages (BCP-47 format) used as target translation languages. Under normal circumstances,
     * you shouldn't have to use this property directly.
     * Instead use @see SpeechTranslationConfig.addTargetLanguage,
     * @see SpeechTranslationConfig.getTargetLanguages, @see TranslationRecognizer.getTargetLanguages.
     * @member PropertyId.SpeechServiceConnection_TranslationToLanguages
     */
    PropertyId[PropertyId["SpeechServiceConnection_TranslationToLanguages"] = 6] = "SpeechServiceConnection_TranslationToLanguages";
    /**
     * The name of the Cognitive Service Text to Speech Service Voice. Under normal circumstances, you shouldn't have to use this
     * property directly.
     * Instead, use @see SpeechTranslationConfig.setVoiceName.
     * NOTE: Valid voice names can be found <a href="https://aka.ms/csspeech/voicenames">here</a>.
     * @member PropertyId.SpeechServiceConnection_TranslationVoice
     */
    PropertyId[PropertyId["SpeechServiceConnection_TranslationVoice"] = 7] = "SpeechServiceConnection_TranslationVoice";
    /**
     * Translation features.
     * @member PropertyId.SpeechServiceConnection_TranslationFeatures
     */
    PropertyId[PropertyId["SpeechServiceConnection_TranslationFeatures"] = 8] = "SpeechServiceConnection_TranslationFeatures";
    /**
     * The Language Understanding Service Region. Under normal circumstances, you shouldn't have to use this property directly.
     * Instead, use @see LanguageUnderstandingModel.
     * @member PropertyId.SpeechServiceConnection_IntentRegion
     */
    PropertyId[PropertyId["SpeechServiceConnection_IntentRegion"] = 9] = "SpeechServiceConnection_IntentRegion";
    /**
     * The Cognitive Services Speech Service recognition Mode. Can be "INTERACTIVE", "CONVERSATION", "DICTATION".
     * This property is intended to be read-only. The SDK is using it internally.
     * @member PropertyId.SpeechServiceConnection_RecoMode
     */
    PropertyId[PropertyId["SpeechServiceConnection_RecoMode"] = 10] = "SpeechServiceConnection_RecoMode";
    /**
     * The spoken language to be recognized (in BCP-47 format). Under normal circumstances, you shouldn't have to use this property
     * directly.
     * Instead, use @see SpeechConfig.setSpeechRecognitionLanguage.
     * @member PropertyId.SpeechServiceConnection_RecoLanguage
     */
    PropertyId[PropertyId["SpeechServiceConnection_RecoLanguage"] = 11] = "SpeechServiceConnection_RecoLanguage";
    /**
     * The session id. This id is a universally unique identifier (aka UUID) representing a specific binding of an audio input stream
     * and the underlying speech recognition instance to which it is bound. Under normal circumstances, you shouldn't have to use this
     * property directly.
     * Instead use @see SessionEventArgs.sessionId.
     * @member PropertyId.Speech_SessionId
     */
    PropertyId[PropertyId["Speech_SessionId"] = 12] = "Speech_SessionId";
    /**
     * The requested Cognitive Services Speech Service response output format (simple or detailed). Under normal circumstances, you shouldn't have
     * to use this property directly.
     * Instead use @see SpeechConfig.setOutputFormat.
     * @member PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse
     */
    PropertyId[PropertyId["SpeechServiceResponse_RequestDetailedResultTrueFalse"] = 13] = "SpeechServiceResponse_RequestDetailedResultTrueFalse";
    /**
     * The requested Cognitive Services Speech Service response output profanity level. Currently unused.
     * @member PropertyId.SpeechServiceResponse_RequestProfanityFilterTrueFalse
     */
    PropertyId[PropertyId["SpeechServiceResponse_RequestProfanityFilterTrueFalse"] = 14] = "SpeechServiceResponse_RequestProfanityFilterTrueFalse";
    /**
     * The Cognitive Services Speech Service response output (in JSON format). This property is available on recognition result objects only.
     * @member PropertyId.SpeechServiceResponse_JsonResult
     */
    PropertyId[PropertyId["SpeechServiceResponse_JsonResult"] = 15] = "SpeechServiceResponse_JsonResult";
    /**
     * The Cognitive Services Speech Service error details (in JSON format). Under normal circumstances, you shouldn't have to
     * use this property directly. Instead use @see CancellationDetails.getErrorDetails.
     * @member PropertyId.SpeechServiceResponse_JsonErrorDetails
     */
    PropertyId[PropertyId["SpeechServiceResponse_JsonErrorDetails"] = 16] = "SpeechServiceResponse_JsonErrorDetails";
    /**
     * The cancellation reason. Currently unused.
     * @member PropertyId.CancellationDetails_Reason
     */
    PropertyId[PropertyId["CancellationDetails_Reason"] = 17] = "CancellationDetails_Reason";
    /**
     * The cancellation text. Currently unused.
     * @member PropertyId.CancellationDetails_ReasonText
     */
    PropertyId[PropertyId["CancellationDetails_ReasonText"] = 18] = "CancellationDetails_ReasonText";
    /**
     * The Cancellation detailed text. Currently unused.
     * @member PropertyId.CancellationDetails_ReasonDetailedText
     */
    PropertyId[PropertyId["CancellationDetails_ReasonDetailedText"] = 19] = "CancellationDetails_ReasonDetailedText";
    /**
     * The Language Understanding Service response output (in JSON format). Available via @see IntentRecognitionResult.Properties.
     * @member PropertyId.LanguageUnderstandingServiceResponse_JsonResult
     */
    PropertyId[PropertyId["LanguageUnderstandingServiceResponse_JsonResult"] = 20] = "LanguageUnderstandingServiceResponse_JsonResult";
})(PropertyId = exports.PropertyId || (exports.PropertyId = {}));

//# sourceMappingURL=PropertyId.js.map
