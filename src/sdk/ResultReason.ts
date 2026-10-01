// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the possible reasons a recognition result might be generated.
 * @class ResultReason
 */
export enum ResultReason {
    /**
     * Indicates speech could not be recognized. More details
     * can be found in the NoMatchDetails object.
     * @member ResultReason.NoMatch
     */
    NoMatch,

    /**
     * Indicates that the recognition was canceled. More details
     * can be found using the CancellationDetails object.
     * @member ResultReason.Canceled
     */
    Canceled,

    /**
     * Indicates the speech result contains hypothesis text.
     * @member ResultReason.RecognizingSpeech
     */
    RecognizingSpeech,

    /**
     * Indicates the speech result contains final text that has been recognized.
     * Speech Recognition is now complete for this phrase.
     * @member ResultReason.RecognizedSpeech
     */
    RecognizedSpeech,

    /**
     * Indicates the speech result contains a finalized acceptance of a provided keyword.
     * Speech recognition will continue unless otherwise configured.
     * @member ResultReason.RecognizedKeyword
     */
    RecognizedKeyword,

    /**
     * Indicates the translation result contains hypothesis text and its translation(s).
     * @member ResultReason.TranslatingSpeech
     */
    TranslatingSpeech,

    /**
     * Indicates the translation result contains final text and corresponding translation(s).
     * Speech Recognition and Translation are now complete for this phrase.
     * @member ResultReason.TranslatedSpeech
     */
    TranslatedSpeech,

    /**
     * Indicates the synthesized audio result contains a non-zero amount of audio data
     * @member ResultReason.SynthesizingAudio
     */
    SynthesizingAudio,

    /**
     * Indicates the synthesized audio is now complete for this phrase.
     * @member ResultReason.SynthesizingAudioCompleted
     */
    SynthesizingAudioCompleted,

    /**
     * Indicates the speech synthesis is now started
     * @member ResultReason.SynthesizingAudioStarted
     */
    SynthesizingAudioStarted,

    /**
     * Indicates synthesis voices list has been successfully retrieved.
     * @member ResultReason.VoicesListRetrieved
     */
    VoicesListRetrieved,

    /**
     * Indicates the transcription result contains hypothesis text and its translation(s) for
     * other participants in the conversation.
     * @member ResultReason.TranslatingParticipantSpeech
     */
    TranslatingParticipantSpeech,

    /**
     * Indicates the transcription result contains final text and corresponding translation(s)
     * for other participants in the conversation. Speech Recognition and Translation are now
     * complete for this phrase.
     * @member ResultReason.TranslatedParticipantSpeech
     */
    TranslatedParticipantSpeech,

    /**
     * <summary>
     * Indicates the transcription result contains the instant message and corresponding
     * translation(s).
     * @member ResultReason.TranslatedInstantMessage
     */
    TranslatedInstantMessage,

    /**
     * Indicates the transcription result contains the instant message for other participants
     * in the conversation and corresponding translation(s).
     * @member ResultReason.TranslatedParticipantInstantMessage
     */
    TranslatedParticipantInstantMessage,
}
