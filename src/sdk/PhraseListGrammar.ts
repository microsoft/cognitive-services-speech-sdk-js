// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    ServiceRecognizerBase,
} from "../common.speech/Exports";
import { Recognizer, ConversationTranscriber } from "./Exports";

/**
 * Allows additions of new phrases to improve speech recognition.
 *
 * Phrases added to the recognizer are effective at the start of the next recognition, or the next time the SpeechSDK must reconnect
 * to the speech service.
 */
export class PhraseListGrammar {
    private privGrammerBuilder: DynamicGrammarBuilder;

    private constructor(recogBase: ServiceRecognizerBase) {
        this.privGrammerBuilder = recogBase.dynamicGrammar;
    }

    /**
     * Creates a PhraseListGrammar from a given speech recognizer. Will accept any recognizer that derives from @class Recognizer.
     * @param recognizer The recognizer to add phrase lists to.
     */
    public static fromRecognizer(recognizer: Recognizer): PhraseListGrammar {
        const recoBase: ServiceRecognizerBase = recognizer.internalData as ServiceRecognizerBase;

        return new PhraseListGrammar(recoBase);
    }

    /**
     * Creates a PhraseListGrammar from a given ConversationTranscriber.
     * @param conversationTranscriber The ConversationTranscriber to add phrase lists to.
     */
    public static fromConversationTranscriber(conversationTranscriber: ConversationTranscriber): PhraseListGrammar {
        return PhraseListGrammar.fromRecognizer(conversationTranscriber.recognizer);
    }

    /**
     * Adds a single phrase to the current recognizer.
     * @param phrase Phrase to add.
     */
    public addPhrase(phrase: string): void {
        this.privGrammerBuilder.addPhrase(phrase);
    }

    /**
     * Adds multiple phrases to the current recognizer.
     * @param phrases Array of phrases to add.
     */
    public addPhrases(phrases: string[]): void {
        this.privGrammerBuilder.addPhrase(phrases);
    }

    /**
     * Clears all phrases added to the current recognizer.
     */
    public clear(): void {
        this.privGrammerBuilder.clearPhrases();
    }
}
