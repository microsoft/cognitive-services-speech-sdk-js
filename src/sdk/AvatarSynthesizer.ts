// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {SpeechSynthesisConnectionFactory} from "../common.speech/SpeechSynthesisConnectionFactory";
import {SynthesisRestAdapter} from "../common.speech/SynthesisRestAdapter";
import {SynthesizerConfig} from "../common.speech/SynthesizerConfig";
import { IAuthentication, ISynthesisConnectionFactory, SynthesisAdapterBase } from "../common.speech/Exports";
import {
    AvatarConfig,
    AvatarEventArgs,
    PropertyCollection,
    SpeechConfig,
    SpeechSynthesizer,
    SynthesisResult,
    Synthesizer
} from "./Exports";

/**
 * Defines the avatar synthesizer.
 * @class AvatarSynthesizer
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarSynthesizer extends Synthesizer {
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
        super(speechConfig);

        this.privConnectionFactory = new SpeechSynthesisConnectionFactory();
        // this.synthesisRequestQueue = new Queue<SynthesisRequest>();
        this.implCommonSynthesizeSetup();
    }

    protected implCommonSynthesizeSetup(): void {
        super.implCommonSynthesizeSetup();
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
        const sdpAnswer: RTCSessionDescription = new RTCSessionDescription(
            JSON.parse("") as RTCSessionDescriptionInit,
        );
        await peerConnection.setRemoteDescription(sdpAnswer);
        return new SynthesisResult(
            "someid",
        );
    }

    /**
     * Speaks SSML asynchronously. The rendered audio and video will be sent via the WebRTC connection.
     * @member AvatarSynthesizer.prototype.speakSsmlAsync
     * @function
     * @public
     * @param {string} ssml - The SSML text to speak.
     * @returns {Promise<SynthesisResult>} The promise of the synthesis result.
     */
    // eslint-disable-next-line @typescript-eslint/require-await
    public async speakSsmlAsync(ssml: string): Promise<SynthesisResult> {
        // todo: implement
        return new SynthesisResult(
            "someid",
        );
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

    // Creates the synthesis adapter
    protected createSynthesisAdapter(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig): SynthesisAdapterBase {
        return new SynthesisAdapterBase(authentication, connectionFactory,
            synthesizerConfig, this as unknown as SpeechSynthesizer, undefined);
    }

    protected createRestSynthesisAdapter(
        authentication: IAuthentication,
        synthesizerConfig: SynthesizerConfig): SynthesisRestAdapter {
        return undefined;
    }

}
