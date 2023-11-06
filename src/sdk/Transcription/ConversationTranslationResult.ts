// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { PropertyCollection } from "../PropertyCollection.js";
import { ResultReason } from "../ResultReason.js";
import { TranslationRecognitionResult } from "../TranslationRecognitionResult.js";
import { Translations } from "../Translations.js";

export class ConversationTranslationResult extends TranslationRecognitionResult {
    private privId: string;
    private privOrigLang: string;

    public constructor(participantId: string,
                       translations: Translations,
                       originalLanguage?: string,
                       resultId?: string,
                       reason?: ResultReason,
                       text?: string,
                       duration?: number,
                       offset?: number,
                       errorDetails?: string,
                       json?: string,
                       properties?: PropertyCollection) {
        super(translations, resultId, reason, text, duration, offset, undefined, undefined, errorDetails, json, properties);
        this.privId = participantId;
        this.privOrigLang = originalLanguage;
    }

    /**
     * The unique identifier for the participant this result is for.
     */
    public get participantId(): string {
        return this.privId;
    }

    /**
     * The original language this result was in.
     */
    public get originalLang(): string {
        return this.privOrigLang;
    }
}
