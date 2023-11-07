// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";

/**
 * Source Language configuration.
 * @class SourceLanguageConfig
 */
export class SourceLanguageConfig {
    private privLanguage: string;
    private privEndpointId: string;

    private constructor(language: string, endpointId?: string) {
        Contracts.throwIfNullOrUndefined(language, "language");
        this.privLanguage = language;
        this.privEndpointId = endpointId;
    }

    /**
     * @member SourceLanguageConfig.fromLanguage
     * @function
     * @public
     * @param {string} language language (eg. "en-US") value of config.
     * @param {string?} endpointId endpointId of model bound to given language of config.
     * @return {SourceLanguageConfig} Instance of SourceLanguageConfig
     * @summary Creates an instance of the SourceLanguageConfig with the given language and optional endpointId.
     * Added in version 1.13.0.
     */
    public static fromLanguage(language: string, endpointId?: string): SourceLanguageConfig {
        return new SourceLanguageConfig(language, endpointId);
    }

    public get language(): string {
        return this.privLanguage;
    }

    public get endpointId(): string {
        return this.privEndpointId;
    }
}
