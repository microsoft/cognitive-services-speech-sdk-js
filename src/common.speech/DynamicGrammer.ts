// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class DynamicGrammar {

    private privPhrases: string[];
    private privGrammars: string[];

    // Adds one more reference phrases to the next context to send.
    // All added phrases are generic phrases.
    public addPhrase(phrase: string | string[]): void {
        if (!this.privPhrases) {
            this.privPhrases = [];
        }

        if (phrase instanceof Array) {
            this.privPhrases = this.privPhrases.concat(phrase as string[]);
        } else {
            this.privPhrases.push(phrase as string);
        }
    }

    // Clears all phrases stored on the recognizer.
    public clearPhrases(): void {
        this.privPhrases = undefined;
    }

    // Adds one or more reference grammars to the next context to send.
    public addReferenceGrammar(grammar: string | string[]): void {
        if (!this.privGrammars) {
            this.privGrammars = [];
        }

        if (grammar instanceof Array) {
            this.privGrammars = this.privGrammars.concat(grammar as string[]);
        } else {
            this.privGrammars.push(grammar as string);
        }
    }

    // clears all grammers stored on the recognizer.
    public clearGrammars(): void {
        this.privGrammars = undefined;
    }

    public generateSpeechContext(): object {
        if (!this.privGrammars && !this.privPhrases) {
            return undefined;
        }

        const retObj: { [k: string]: any } = {};
        /* tslint:disable:no-string-literal */
        retObj["ReferenceGrammars"] = this.privGrammars;
        /* tslint:enable:no-string-literal */
    }
}
