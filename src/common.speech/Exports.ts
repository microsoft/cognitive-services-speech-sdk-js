// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Make sure not to export internal modules.
//
export * from "./CognitiveSubscriptionKeyAuthentication";
export * from "./CognitiveTokenAuthentication";
export * from "./IAuthentication";
export * from "./IConnectionFactory";
export * from "./ISynthesisConnectionFactory";
export * from "./IntentConnectionFactory";
export * from "./SpeakerRecognitionConnectionFactory";
export * from "./RecognitionEvents";
export * from "./ServiceRecognizerBase";
export * from "./ConversationServiceRecognizer";
export * from "./RecognizerConfig";
export * from "./SpeechServiceInterfaces";
export * from "./WebsocketMessageFormatter";
export * from "./SpeechConnectionFactory";
export * from "./TranscriberConnectionFactory";
export * from "./TranslationConnectionFactory";
export * from "./SpeechSynthesisConnectionFactory";
export * from "./EnumTranslation";
export * from "./ServiceMessages/Enums";
export * from "./ServiceMessages/TranslationSynthesisEnd";
export * from "./ServiceMessages/TranslationHypothesis";
export * from "./ServiceMessages/TranslationPhrase";
export * from "./TranslationServiceRecognizer";
export * from "./ServiceMessages/SpeechDetected";
export * from "./ServiceMessages/SpeechHypothesis";
export * from "./ServiceMessages/SpeechKeyword";
export * from "./SpeechServiceRecognizer";
export * from "./TranscriptionServiceRecognizer";
export * from "./ServiceMessages/DetailedSpeechPhrase";
export * from "./ServiceMessages/SimpleSpeechPhrase";
export * from "./AddedLmIntent";
export * from "./IntentServiceRecognizer";
export * from "./ServiceMessages/IntentResponse";
export * from "./ServiceMessages/SpeakerResponse";
export * from "./RequestSession";
export * from "./SpeechContext";
export * from "./DynamicGrammarBuilder";
export * from "./DynamicGrammarInterfaces";
export * from "./DialogServiceAdapter";
export * from "./AgentConfig";
export * from "./Transcription/Exports";
export * from "./ServiceMessages/SynthesisAudioMetadata";
export * from "./SynthesisTurn";
export * from "./SynthesisAdapterBase";
export * from "./SynthesisRestAdapter";
export * from "./SynthesizerConfig";
export * from "./SynthesisContext";
export * from "./SpeakerRecognitionConfig";
export * from "./SpeakerIdMessageAdapter";
export * from "./SpeakerServiceRecognizer";
export * from "./VoiceServiceRecognizer";

export const OutputFormatPropertyName: string = "OutputFormat";
export const CancellationErrorCodePropertyName: string = "CancellationErrorCode";
export const ServicePropertiesPropertyName: string = "ServiceProperties";
export const ForceDictationPropertyName: string = "ForceDictation";
export const AutoDetectSourceLanguagesOpenRangeOptionName: string = "OpenRange";
