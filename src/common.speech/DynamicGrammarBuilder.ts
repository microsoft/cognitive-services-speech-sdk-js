// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IDynamicGrammar,
    IDynamicGrammarGeneric,
} from "./Exports.js";

/**
 * Responsible for building the object to be sent to the speech service to support dynamic grammars.
 * @class DynamicGrammarBuilder
 */
export class DynamicGrammarBuilder {

    private privPhrases: string[];
    private privGrammars: string[];

    // Adds one more reference phrases to the dynamic grammar to send.
    // All added phrases are generic phrases.
    public addPhrase(phrase: string | string[]): void {
        if (!this.privPhrases) {
            this.privPhrases = [];
        }

        if (phrase instanceof Array) {
            this.privPhrases = this.privPhrases.concat(phrase);
        } else {
            this.privPhrases.push(phrase);
        }
    }

    // Clears all phrases stored in the current object.
    public clearPhrases(): void {
        this.privPhrases = undefined;
    }

    // Adds one or more reference grammars to the current grammar.
    public addReferenceGrammar(grammar: string | string[]): void {
        if (!this.privGrammars) {
            this.privGrammars = [];
        }

        if (grammar instanceof Array) {
            this.privGrammars = this.privGrammars.concat(grammar);
        } else {
            this.privGrammars.push(grammar);
        }
    }

    // clears all grammars stored on the recognizer.
    public clearGrammars(): void {
        this.privGrammars = undefined;
    }

    // Generates an object that represents the dynamic grammar used by the Speech Service.
    // This is done by building an object with the correct layout based on the phrases and reference grammars added to this instance
    // of a DynamicGrammarBuilder
    public generateGrammarObject(): IDynamicGrammar {
        if (this.privGrammars === undefined && this.privPhrases === undefined) {
            return undefined;
        }

        const retObj: IDynamicGrammar = {};
        retObj.ReferenceGrammars = this.privGrammars;

        if (undefined !== this.privPhrases && 0 !== this.privPhrases.length) {
            const retPhrases: IDynamicGrammarGeneric[] = [];

            this.privPhrases.forEach((value: string): void => {
                retPhrases.push({
                    Text: value,
                });
            });

            retObj.Groups = [{ Type: "Generic", Items: retPhrases }];
        }

        return retObj;
    }
}
