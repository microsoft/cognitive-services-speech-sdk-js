// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection } from "../sdk/Exports.js";
import {
    Context,
    ISynthesisSectionVideo,
    SpeechServiceConfig
    } from "./Exports.js";

export enum SynthesisServiceType {
    Standard,
    Custom,
}

export class SynthesizerConfig {
    private privSynthesisServiceType: SynthesisServiceType = SynthesisServiceType.Standard;
    private privSpeechServiceConfig: SpeechServiceConfig;
    private privParameters: PropertyCollection;
    public avatarEnabled: boolean = false;

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

    public set synthesisVideoSection(value: ISynthesisSectionVideo) {
        this.privSpeechServiceConfig.Context.synthesis = {
            video: value
        };
    }

    public get SpeechServiceConfig(): SpeechServiceConfig {
        return this.privSpeechServiceConfig;
    }

    public setContextFromJson(contextJson: string | object): void {
        const context: Context = JSON.parse(contextJson as string) as Context;
        if (context.system !== null) {
            this.privSpeechServiceConfig.Context.system = context.system;
        }

        if (context.os !== null) {
            this.privSpeechServiceConfig.Context.os = context.os;
        }

        if (context.audio !== null) {
            this.privSpeechServiceConfig.Context.audio = context.audio;
        }

        if (context.synthesis !== null) {
            this.privSpeechServiceConfig.Context.synthesis = context.synthesis;
        }
    }
}
