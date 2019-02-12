// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    IDynamicGrammar,
} from "./Exports";

/**
 * Represents the JSON used in the speech.context message sent to the speech service.
 * The dynamic grammar is always refreshed from the encapsulated dynamic grammar object.
 */
export class SpeechContext {
    private privContext: { [section: string]: any } = {};
    private privDynamicGrammar: DynamicGrammarBuilder;

    constructor(dynamicGrammar: DynamicGrammarBuilder) {
        this.privDynamicGrammar = dynamicGrammar;
    }

    /**
     * Adds a section to the speech.context object.
     * @param sectionName Name of the section to add.
     * @param value JSON serializeable object that represents the value.
     */
    public setSection(sectionName: string, value: any): void {
        this.privContext[sectionName] = value;
    }

    public toJSON(): string {

        const dgi: IDynamicGrammar = this.privDynamicGrammar.generateGrammarObject();
        this.setSection("dgi", dgi);

        const ret: string = JSON.stringify(this.privContext);
        return ret;
    }
}
