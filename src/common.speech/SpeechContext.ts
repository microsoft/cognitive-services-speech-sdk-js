// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    IDynamicGrammar,
} from "./Exports";

export class SpeechContext {
    private privContext: { [section: string]: any } = {};
    private privDynamicGrammar: DynamicGrammarBuilder;

    constructor(dynamicGrammar: DynamicGrammarBuilder) {
        this.privDynamicGrammar = dynamicGrammar;
    }

    public setSection(sectionName: string, value: any): void {
        this.privContext[sectionName] = value;
    }

    public toJSON(): string {

        const dgi: IDynamicGrammar = this.privDynamicGrammar.generateGrammar();
        this.setSection("dgi", dgi);

        const ret: string = JSON.stringify(this.privContext);
        return ret;
    }
}
