// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AutoDetectSourceLanguagesOpenRangeOptionName } from "../common.speech/Exports.js";
import {Contracts} from "./Contracts.js";
import {
    PropertyCollection,
    PropertyId,
    SourceLanguageConfig,
} from "./Exports.js";
import { LanguageIdMode } from "./LanguageIdMode.js";

/**
 * Language auto detect configuration.
 * @class AutoDetectSourceLanguageConfig
 * Added in version 1.13.0.
 */
export class AutoDetectSourceLanguageConfig {
    private privProperties: PropertyCollection;
    private privLanguageIdMode: LanguageIdMode;

    private constructor() {
        this.privProperties = new PropertyCollection();
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_LanguageIdMode, "AtStart");
        this.privLanguageIdMode = LanguageIdMode.AtStart;
    }

    /**
     * @member AutoDetectSourceLanguageConfig.fromOpenRange
     * @function
     * @public
     * Only [[SpeechSynthesizer]] supports source language auto detection from open range,
     * for [[Recognizer]], please use AutoDetectSourceLanguageConfig with specific source languages.
     * @return {AutoDetectSourceLanguageConfig} Instance of AutoDetectSourceLanguageConfig
     * @summary Creates an instance of the AutoDetectSourceLanguageConfig with open range.
     */
    public static fromOpenRange(): AutoDetectSourceLanguageConfig {
        const config = new AutoDetectSourceLanguageConfig();
        config.properties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, AutoDetectSourceLanguagesOpenRangeOptionName);
        config.properties.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");
        return config;
    }

    /**
     * @member AutoDetectSourceLanguageConfig.fromLanguages
     * @function
     * @public
     * @param {string[]} languages Comma-separated string of languages (eg. "en-US,fr-FR") to populate properties of config.
     * @return {AutoDetectSourceLanguageConfig} Instance of AutoDetectSourceLanguageConfig
     * @summary Creates an instance of the AutoDetectSourceLanguageConfig with given languages.
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
     */
    public static fromSourceLanguageConfigs(configs: SourceLanguageConfig[]): AutoDetectSourceLanguageConfig {
        if (configs.length < 1) {
            throw new Error("Expected non-empty SourceLanguageConfig array.");
        }
        const autoConfig = new AutoDetectSourceLanguageConfig();
        const langs: string[] = [];
        configs.forEach((config: SourceLanguageConfig): void => {
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
     * @summary Gets an auto detected language config properties
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * @member AutoDetectSourceLanguageConfig.prototype.mode
     * @function
     * @public
     * @param {LanguageIdMode} mode LID mode desired.
     * @summary Sets LID operation to desired mode
     */
    public set mode(mode: LanguageIdMode) {
        if (mode === LanguageIdMode.Continuous) {
            this.privProperties.setProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, "2");
            this.privProperties.setProperty(PropertyId.SpeechServiceConnection_LanguageIdMode, "Continuous");
        } else { // LanguageIdMode.AtStart
            this.privProperties.setProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, "1");
            this.privProperties.setProperty(PropertyId.SpeechServiceConnection_LanguageIdMode, "AtStart");
        }
        this.privLanguageIdMode = mode;
    }
}
