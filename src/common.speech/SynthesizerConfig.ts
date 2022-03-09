// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection } from "../sdk/Exports";
import {Context, SpeechServiceConfig} from "./Exports";

export enum SynthesisServiceType {
    Standard,
    Custom,
}

export class SynthesizerConfig {
    private privSynthesisServiceType: SynthesisServiceType = SynthesisServiceType.Standard;
    private privSpeechServiceConfig: SpeechServiceConfig;
    private privParameters: PropertyCollection;

    public constructor(
        speechServiceConfig: SpeechServiceConfig,
        parameters: PropertyCollection) {
        this.privSpeechServiceConfig = speechServiceConfig ? speechServiceConfig : new SpeechServiceConfig(new Context(null));
        this.privParameters = parameters;
    }

    public get parameters(): PropertyCollection {
        return this.privParameters;
    }

    public get synthesisServiceType(): SynthesisServiceType {
        return this.privSynthesisServiceType;
    }

    public set synthesisServiceType(value: SynthesisServiceType) {
        this.privSynthesisServiceType = value;
    }

    public get SpeechServiceConfig(): SpeechServiceConfig {
        return this.privSpeechServiceConfig;
    }
}
