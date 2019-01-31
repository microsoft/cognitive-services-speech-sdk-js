// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IDynamicGrammar,
    IDynamicGrammarGeneric,
} from "./Exports";

export class DynamicGrammarBuilder {

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

    public generateGrammar(): IDynamicGrammar {
        if (this.privGrammars === undefined && this.privPhrases === undefined) {
            return undefined;
        }

        const retObj: IDynamicGrammar = {};
        retObj.ReferenceGrammars = this.privGrammars;

        if (undefined !== this.privPhrases && 0 !== this.privPhrases.length) {
            const retPhrases: IDynamicGrammarGeneric[] = [];

            this.privPhrases.forEach((value: string, index: number, array: string[]): void => {
                retPhrases.push({
                    Text: value,
                });
            });

            retObj.Groups = [{ Type: "Generic", Items: retPhrases }];
        }

        return retObj;
    }
}
