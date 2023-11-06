// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";
import {
    SpeechRecognitionResult,
    ConversationTranscriptionResult
} from "./Exports.js";

/**
 * Output format
 * @class AutoDetectSourceLanguageResult
 */
export class AutoDetectSourceLanguageResult {

    private privLanguage: string;
    private privLanguageDetectionConfidence: string;

    private constructor(language: string, languageDetectionConfidence: string) {
        Contracts.throwIfNullOrUndefined(language, "language");
        Contracts.throwIfNullOrUndefined(languageDetectionConfidence, "languageDetectionConfidence");
        this.privLanguage = language;
        this.privLanguageDetectionConfidence = languageDetectionConfidence;
    }

    /**
     * Creates an instance of AutoDetectSourceLanguageResult object from a SpeechRecognitionResult instance.
     * @member AutoDetectSourceLanguageResult.fromResult
     * @function
     * @public
     * @param {SpeechRecognitionResult} result - The recognition result.
     * @returns {AutoDetectSourceLanguageResult} AutoDetectSourceLanguageResult object being created.
     */
    public static fromResult(result: SpeechRecognitionResult): AutoDetectSourceLanguageResult {
        return new AutoDetectSourceLanguageResult(result.language, result.languageDetectionConfidence);
    }

    /**
     * Creates an instance of AutoDetectSourceLanguageResult object from a ConversationTranscriptionResult instance.
     * @member AutoDetectSourceLanguageResult.fromConversationTranscriptionResult
     * @function
     * @public
     * @param {ConversationTranscriptionResult} result - The transcription result.
     * @returns {AutoDetectSourceLanguageResult} AutoDetectSourceLanguageResult object being created.
     */
        public static fromConversationTranscriptionResult(result: ConversationTranscriptionResult): AutoDetectSourceLanguageResult {
            return new AutoDetectSourceLanguageResult(result.language, result.languageDetectionConfidence);
        }

    public get language(): string {
        return this.privLanguage;
    }

    public get languageDetectionConfidence(): string {
        return this.privLanguageDetectionConfidence;
    }
}
