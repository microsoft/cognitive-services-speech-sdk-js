// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    AudioConfig,
    PropertyCollection,
    PropertyId,
    SpeechConfig,
    SpeechConfigImpl,
    SpeechSynthesisOutputFormat,
    SynthesisResult,
    AvatarConfig,
    AvatarEventArgs
} from "./Exports";
import {Contracts} from "./Contracts";
import {SpeechSynthesisConnectionFactory} from "../common.speech/SpeechSynthesisConnectionFactory";
import {Queue} from "../common/Queue";
import {SynthesisRequest} from "./SpeechSynthesizer";
import {Context, OS, SpeechServiceConfig} from "../common.speech/RecognizerConfig";
import {CognitiveSubscriptionKeyAuthentication} from "../common.speech/CognitiveSubscriptionKeyAuthentication";
import {CognitiveTokenAuthentication} from "../common.speech/CognitiveTokenAuthentication";
import {AudioOutputFormatImpl} from "./Audio/AudioOutputFormat";
import {SynthesisRestAdapter} from "../common.speech/SynthesisRestAdapter";
import {SynthesizerConfig} from "../common.speech/SynthesizerConfig";

/**
 * Defines the avatar synthesizer.
 * @class AvatarSynthesizer
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarSynthesizer {
    protected privProperties: PropertyCollection;

    /**
     * Defines event handler for synthesizing events.
     * @member SpeechSynthesizer.prototype.synthesizing
     * @function
     * @public
     */
    public eventReceived: (sender: AvatarSynthesizer, event: AvatarEventArgs) => void;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {SpeechConfig} speechConfig - The speech config.
     * @param {AvatarConfig} avatarConfig - The talking avatar config.
     */
    public constructor(speechConfig: SpeechConfig, avatarConfig: AvatarConfig) {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        this.privProperties = speechConfigImpl.properties.clone();
        this.privDisposed = false;
        this.privSynthesizing = false;
        this.privConnectionFactory = new SpeechSynthesisConnectionFactory();
        this.synthesisRequestQueue = new Queue<SynthesisRequest>();
        this.implCommonSynthesizeSetup();
    }

    protected implCommonSynthesizeSetup(): void {

        let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        let osName = "unknown";
        let osVersion = "unknown";

        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }

        const synthesizerConfig = this.createSynthesizerConfig(
            new SpeechServiceConfig(
                new Context(new OS(osPlatform, osName, osVersion))));

        const subscriptionKey = this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        const authentication = (subscriptionKey && subscriptionKey !== "") ?
            new CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new CognitiveTokenAuthentication(
                (): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                },
                (): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                });

        this.privAdapter = this.createSynthesisAdapter(
            authentication,
            this.privConnectionFactory,
            this.audioConfig,
            synthesizerConfig);

        this.privAdapter.audioOutputFormat = AudioOutputFormatImpl.fromSpeechSynthesisOutputFormat(
            SpeechSynthesisOutputFormat[this.properties.getProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, undefined) as keyof typeof SpeechSynthesisOutputFormat]
        );

        this.privRestAdapter = new SynthesisRestAdapter(synthesizerConfig, authentication);
    }

    protected createSynthesizerConfig(speechConfig: SpeechServiceConfig): SynthesizerConfig {
        return new SynthesizerConfig(
            speechConfig,
            this.privProperties);
    }

    /**
     * Starts the talking avatar session and establishes the WebRTC connection.
     * @member AvatarSynthesizer.prototype.startAvatarAsync
     * @function
     * @public
     * @param {AvatarWebRTCConnectionInfo} peerConnection - The peer connection.
     * @returns {Promise<SynthesisResult>} The promise of the connection result.
     */
    public async startAvatarAsync(peerConnection: RTCPeerConnection): Promise<SynthesisResult> {
        const sdp: RTCSessionDescriptionInit = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(sdp);
        // todo: implement
        const sdpAnswer: RTCSessionDescription = new RTCSessionDescription();
        await peerConnection.setRemoteDescription(sdpAnswer);
        return new SynthesisResult(
            "someid",
        )
    }

    /**
     * Speaks SSML asynchronously. The rendered audio and video will be sent via the WebRTC connection.
     * @member AvatarSynthesizer.prototype.speakSsmlAsync
     * @function
     * @public
     * @param {string} ssml - The SSML text to speak.
     * @returns {Promise<SynthesisResult>} The promise of the synthesis result.
     */
    public async speakSsmlAsync(ssml: string): Promise<SynthesisResult> {
        // todo: implement
        return new SynthesisResult(
            "someid",
        )
    }

    /**
     * Speaks text asynchronously. The avatar will switch to idle state.
     * @member AvatarSynthesizer.prototype.stopSpeakingAsync
     * @function
     * @public
     * @returns {Promise<void>} The promise of the void result.
     */
    public async stopSpeakingAsync(): Promise<void> {
        // todo: implement
    }

    /**
     * Stops the talking avatar session and closes the WebRTC connection.
     * @member AvatarSynthesizer.prototype.stopAvatarAsync
     * @function
     * @public
     * @returns {Promise<void>} The promise of the void result.
     */
    public async stopAvatarAsync(): Promise<void> {
        // todo: implement
    }

    protected async startAvatarAsync(sdp: RTCSessionDescriptionInit): Promise<RTCSessionDescription> {

    }
}
