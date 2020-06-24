// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";

export class SourceLanguageConfig {
    private privLanguage: string;
    private privEndpointId: string;

    private constructor(language: string, endpointId?: string) {
        Contracts.throwIfNullOrUndefined(language, "language");
        this.privLanguage = language;
        this.privEndpointId = endpointId;
    }

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
