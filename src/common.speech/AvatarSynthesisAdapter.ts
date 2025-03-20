// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    AvatarConfig,
    AvatarEventArgs,
    AvatarSynthesizer,
    PropertyId,
    Synthesizer,
} from "../sdk/Exports.js";
import {
    ISynthesisConnectionFactory,
    ISynthesisMetadata,
    ISynthesisSectionVideo,
    SynthesisAdapterBase,
    SynthesizerConfig
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";

export class AvatarSynthesisAdapter extends SynthesisAdapterBase {
    private readonly privAvatarSynthesizer: AvatarSynthesizer;
    private readonly privAvatarConfig: AvatarConfig;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig,
        avatarSynthesizer: AvatarSynthesizer,
        avatarConfig: AvatarConfig,
        ) {

        super(authentication, connectionFactory,
            synthesizerConfig, undefined);
        this.privAvatarSynthesizer = avatarSynthesizer;
        this.privSynthesizer = avatarSynthesizer as Synthesizer;
        this.privAvatarConfig = avatarConfig;
    }

    protected setSynthesisContextSynthesisSection(): void {
        this.privSynthesisContext.setSynthesisSection(undefined);
    }

    protected setSpeechConfigSynthesisSection(): void {
        this.privSynthesizerConfig.synthesisVideoSection = {
            format: {
                bitrate: this.privAvatarConfig.videoFormat?.bitrate,
                codec: this.privAvatarConfig.videoFormat?.codec,
                crop: {
                    bottomRight: {
                        x: this.privAvatarConfig.videoFormat?.cropRange?.bottomRight?.x,
                        y: this.privAvatarConfig.videoFormat?.cropRange?.bottomRight?.y,
                    },
                    topLeft: {
                        x: this.privAvatarConfig.videoFormat?.cropRange?.topLeft?.x,
                        y: this.privAvatarConfig.videoFormat?.cropRange?.topLeft?.y,
                    },
                },
                resolution: {
                    height: this.privAvatarConfig.videoFormat?.height,
                    width: this.privAvatarConfig.videoFormat?.width,
                },
            },
            protocol: {
                name: "WebRTC",
                webrtcConfig: {
                    clientDescription: btoa(this.privSynthesizerConfig.parameters.getProperty(PropertyId.TalkingAvatarService_WebRTC_SDP)),
                    iceServers: this.privAvatarConfig.remoteIceServers ?? this.privAvatarSynthesizer.iceServers,
                },
            },
            talkingAvatar: {
                background: {
                    color: this.privAvatarConfig.backgroundColor,
                    image: {
                        url: this.privAvatarConfig.backgroundImage?.toString(),
                    }
                },
                character: this.privAvatarConfig.character,
                customized: this.privAvatarConfig.customized,
                style: this.privAvatarConfig.style,
                useBuiltInVoice: this.privAvatarConfig.useBuiltInVoice,
            }
        } as ISynthesisSectionVideo;
    }


    protected onAvatarEvent(metadata: ISynthesisMetadata): void {
        if (!!this.privAvatarSynthesizer.avatarEventReceived) {
            const avatarEventArgs: AvatarEventArgs = new AvatarEventArgs(
                metadata.Data.Offset,
                metadata.Data.Name);
            try {
                this.privAvatarSynthesizer.avatarEventReceived(this.privAvatarSynthesizer, avatarEventArgs);
            } catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    }
}
