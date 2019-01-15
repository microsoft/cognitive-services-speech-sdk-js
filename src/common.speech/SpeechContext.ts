// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DynamicGrammar } from "./Exports";

export class SpeechContext {
    private privContext: { [section: string]: any } = {};
    private privDynamicGrammar: DynamicGrammar;

    constructor(dynamicGrammar: DynamicGrammar) {
        this.privDynamicGrammar = dynamicGrammar;
    }

    public setSection(sectionName: string, value: any): void {
        this.privContext[sectionName] = value;
    }

    public toJSON(): string {
        this.setSection("dgi", this.privDynamicGrammar.generateSpeechContext());
        return JSON.stringify(this.privContext);
    }
}
