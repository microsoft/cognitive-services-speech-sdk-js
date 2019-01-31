// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DynamicGrammarBuilder, ServiceRecognizerBase } from "../common.speech/Exports";
import { Recognizer } from "./Exports";

export class PhraseListGrammar {
    private privGrammerBuilder: DynamicGrammarBuilder;

    private constructor(recogBase: ServiceRecognizerBase) {
        this.privGrammerBuilder = recogBase.dynamicGrammar;
    }

    public static FromRecognizer(recognizer: Recognizer): PhraseListGrammar {
        const recoBase: ServiceRecognizerBase = recognizer.internalData as ServiceRecognizerBase;

        return new PhraseListGrammar(recoBase);
    }

    public AddPhrase(phrase: string): void {
        this.privGrammerBuilder.addPhrase(phrase);
    }

    public AddPhrases(phrases: string[]): void {
        this.privGrammerBuilder.addPhrase(phrases);
    }
}
