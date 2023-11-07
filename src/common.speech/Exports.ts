// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Make sure not to export internal modules.
//
export * from "./CognitiveSubscriptionKeyAuthentication.js";
export * from "./CognitiveTokenAuthentication.js";
export * from "./IAuthentication.js";
export * from "./IConnectionFactory.js";
export * from "./ISynthesisConnectionFactory.js";
export * from "./IntentConnectionFactory.js";
export * from "./SpeakerRecognitionConnectionFactory.js";
export * from "./RecognitionEvents.js";
export * from "./ServiceRecognizerBase.js";
export * from "./ConversationServiceRecognizer.js";
export * from "./RecognizerConfig.js";
export * from "./SpeechServiceInterfaces.js";
export * from "./WebsocketMessageFormatter.js";
export * from "./SpeechConnectionFactory.js";
export * from "./ConversationTranscriberConnectionFactory.js";
export * from "./TranscriberConnectionFactory.js";
export * from "./TranslationConnectionFactory.js";
export * from "./SpeechSynthesisConnectionFactory.js";
export * from "./EnumTranslation.js";
export * from "./ServiceMessages/Enums.js";
export * from "./ServiceMessages/TranslationSynthesisEnd.js";
export * from "./ServiceMessages/TranslationHypothesis.js";
export * from "./ServiceMessages/TranslationPhrase.js";
export * from "./TranslationServiceRecognizer.js";
export * from "./ServiceMessages/SpeechDetected.js";
export * from "./ServiceMessages/SpeechHypothesis.js";
export * from "./ServiceMessages/SpeechKeyword.js";
export * from "./SpeechServiceRecognizer.js";
export * from "./ConversationTranscriptionServiceRecognizer.js";
export * from "./TranscriptionServiceRecognizer.js";
export * from "./ServiceMessages/DetailedSpeechPhrase.js";
export * from "./ServiceMessages/SimpleSpeechPhrase.js";
export * from "./AddedLmIntent.js";
export * from "./IntentServiceRecognizer.js";
export * from "./ServiceMessages/IntentResponse.js";
export * from "./ServiceMessages/SpeakerResponse.js";
export * from "./RequestSession.js";
export * from "./SpeechContext.js";
export * from "./DynamicGrammarBuilder.js";
export * from "./DynamicGrammarInterfaces.js";
export * from "./DialogServiceAdapter.js";
export * from "./AgentConfig.js";
export * from "./Transcription/Exports.js";
export * from "./ServiceMessages/SynthesisAudioMetadata.js";
export * from "./SynthesisTurn.js";
export * from "./SynthesisAdapterBase.js";
export { AvatarSynthesisAdapter } from "./AvatarSynthesisAdapter.js";
export { SpeechSynthesisAdapter } from "./SpeechSynthesisAdapter.js";
export * from "./SynthesisRestAdapter.js";
export * from "./SynthesizerConfig.js";
export * from "./SynthesisContext.js";
export * from "./SpeakerRecognitionConfig.js";
export * from "./SpeakerServiceRecognizer.js";
export * from "./VoiceServiceRecognizer.js";
export * from "./SpeechServiceConfig.js";

export const OutputFormatPropertyName: string = "OutputFormat";
export const CancellationErrorCodePropertyName: string = "CancellationErrorCode";
export const ServicePropertiesPropertyName: string = "ServiceProperties";
export const ForceDictationPropertyName: string = "ForceDictation";
export const AutoDetectSourceLanguagesOpenRangeOptionName: string = "OpenRange";
