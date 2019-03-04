// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Interfaces in this file represent the various nodes in the JSON that the speech service accepts
// for dynamic grammars.

/**
 *  Top level grammar node
 */
export interface IDynamicGrammar {
    ReferenceGrammars?: string[];
    Groups?: IDynamicGrammarGroup[];
}

/**
 * Group of Dynamic Grammar items of a common type.
 */
export interface IDynamicGrammarGroup {
    Type: string;
    Name?: string;
    SubstringMatch?: string; // None, LeftRooted, PartialName
    Items: IDynamicGrammarPeople[] | IDynamicGrammarGeneric[];
}

export interface IDynamicGrammarPeople {
    Name: string;
    First?: string;
    Middle?: string;
    Last?: string;
    Synonyms?: string[];
    Weight?: number;
}

/**
 * Generic phrase based dynamic grammars
 */
export interface IDynamicGrammarGeneric {
    Text: string;
    Synonyms?: string[];
    Weight?: number;
}
