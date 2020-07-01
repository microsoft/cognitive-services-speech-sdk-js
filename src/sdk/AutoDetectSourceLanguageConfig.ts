// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AutoDetectSourceLanguagesOpenRangeOptionName } from "../common.speech/Exports";
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

    /**
     * @member AutoDetectSourceLanguageConfig.fromOpenRange
     * @function
     * @public
     * Only [[SpeechSynthesizer]] supports source language auto detection from open range,
     * for [[Recognizer]], please use AutoDetectSourceLanguageConfig with specific source languages.
     * @return {AutoDetectSourceLanguageConfig} Instance of AutoDetectSourceLanguageConfig
     * @summary Creates an instance of the AutoDetectSourceLanguageConfig with open range.
     * Added in version 1.13.0.
     */
    public static fromOpenRange(): AutoDetectSourceLanguageConfig {
        const config = new AutoDetectSourceLanguageConfig();
        config.properties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, AutoDetectSourceLanguagesOpenRangeOptionName);
        return config;
    }

    /**
     * @member AutoDetectSourceLanguageConfig.fromLanguages
     * @function
     * @public
     * @param {string[]} languages Comma-separated string of languages (eg. "en-US,fr-FR") to populate properties of config.
     * @return {AutoDetectSourceLanguageConfig} Instance of AutoDetectSourceLanguageConfig
     * @summary Creates an instance of the AutoDetectSourceLanguageConfig with given languages.
     * Added in version 1.13.0.
     */
    public static fromLanguages(languages: string[]): AutoDetectSourceLanguageConfig {
        Contracts.throwIfArrayEmptyOrWhitespace(languages, "languages");
        const config = new AutoDetectSourceLanguageConfig();
        config.properties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, languages.join());
        return config;
    }

    /**
     * @member AutoDetectSourceLanguageConfig.fromSourceLanguageConfigs
     * @function
     * @public
     * @param {SourceLanguageConfig[]} configs SourceLanguageConfigs to populate properties of config.
     * @return {AutoDetectSourceLanguageConfig} Instance of AutoDetectSourceLanguageConfig
     * @summary Creates an instance of the AutoDetectSourceLanguageConfig with given SourceLanguageConfigs.
     * Added in version 1.13.0.
     */
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

    /**
     * @member AutoDetectSourceLanguageConfig.prototype.properties
     * @function
     * @public
     * @return {PropertyCollection} Properties of the config.
     * @summary Gets a auto detected language config properties
     * Added in version 1.13.0.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

}
