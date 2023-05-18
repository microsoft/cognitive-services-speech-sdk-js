// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// eslint-disable-next-line max-classes-per-file
import { PropertyCollection, PropertyId } from "../sdk/Exports";
import { Context, ISynthesisSectionVideo, SpeechServiceConfig } from "./Exports";

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

    public get SpeechSynthesisServiceConfig(): SpeechServiceConfig {
        const talkingAvatarServiceClientRequest = this.privParameters.getProperty(
            PropertyId.TalkingAvatarService_ClientRequestJson, undefined);
        if (talkingAvatarServiceClientRequest !== undefined) {
            const video = JSON.parse(talkingAvatarServiceClientRequest) as ISynthesisSectionVideo;
            this.privSpeechServiceConfig.Context.synthesis = {
                video,
            };
        }
        return this.privSpeechServiceConfig;
    }
}
