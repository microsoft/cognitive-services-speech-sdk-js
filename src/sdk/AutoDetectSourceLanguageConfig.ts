// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {Contracts} from "./Contracts";
import {
    PropertyCollection,
    PropertyId,
    SourceLanguageConfig,
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
        config.properties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, languages.join());
        return config;
    }

    public static fromSourceLanguageConfigs(configs: SourceLanguageConfig[]): AutoDetectSourceLanguageConfig {
        if (configs.length < 1) {
            throw new Error("Expected non-empty SourceLanguageConfig array.");
        }
        const autoConfig = new AutoDetectSourceLanguageConfig();
        const langs: string[] = [];
        configs.forEach((config: SourceLanguageConfig) => {
            langs.push(config.language);
            if (config.endpointId !== undefined && config.endpointId !== "") {
                const customProperty = config.language + PropertyId.SpeechServiceConnection_EndpointId.toString();
                autoConfig.properties.setProperty(customProperty, config.endpointId);
            }
        });
        autoConfig.properties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, langs.join());

        return autoConfig;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

}
