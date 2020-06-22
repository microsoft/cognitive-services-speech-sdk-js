// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {Contracts} from "./Contracts";
import {
    PropertyCollection,
    PropertyId,
} from "./Exports";

/**
 * Language auto detect configuration.
 * @class AutoDetectSourceLanguageConfig
 */
export class AutoDetectSourceLanguageConfig {
    private privProperties: PropertyCollection;

    private constructor() {
        this.privProperties = new PropertyCollection();
    }

    public static fromLanguages(languages: string[]): AutoDetectSourceLanguageConfig {
        Contracts.throwIfArrayEmptyOrWhitespace(languages, "languages");
        const config = new AutoDetectSourceLanguageConfig();
        config.privProperties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, languages.join());
        return config;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

}
