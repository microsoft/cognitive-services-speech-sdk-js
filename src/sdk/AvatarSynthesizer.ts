// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SpeechSynthesisConnectionFactory } from "../common.speech/SpeechSynthesisConnectionFactory.js";
import { SynthesisRestAdapter } from "../common.speech/SynthesisRestAdapter.js";
import { SynthesizerConfig } from "../common.speech/SynthesizerConfig.js";
import {
    AvatarSynthesisAdapter,
    IAuthentication,
    ISynthesisConnectionFactory,
    SpeechServiceConfig,
    SynthesisAdapterBase
} from "../common.speech/Exports.js";
import { createNoDashGuid, Deferred, Events, EventType, PlatformEvent } from "../common/Exports.js";
import { AudioOutputFormatImpl } from "./Audio/AudioOutputFormat.js";
import {
    AvatarConfig,
    AvatarEventArgs,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechConfig,
    SpeechSynthesisOutputFormat,
    SpeechSynthesisResult,
    SynthesisResult,
    Synthesizer
} from "./Exports.js";
import { Contracts } from "./Contracts.js";
import { SynthesisRequest } from "./Synthesizer.js";

/**
 * Defines the avatar synthesizer.
 * @class AvatarSynthesizer
 * Added in version 1.33.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarSynthesizer extends Synthesizer {
    protected privProperties: PropertyCollection;
    private privAvatarConfig: AvatarConfig;
    private privIceServers: RTCIceServer[];
    /**
     * Defines event handler for avatar events.
     * @member AvatarSynthesizer.prototype.avatarEventReceived
     * @function
     * @public
     */
    public avatarEventReceived: (sender: AvatarSynthesizer, event: AvatarEventArgs) => void;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {SpeechConfig} speechConfig - The speech config.
     * @param {AvatarConfig} avatarConfig - The talking avatar config.
     */
    public constructor(speechConfig: SpeechConfig, avatarConfig: AvatarConfig) {
        super(speechConfig);

        Contracts.throwIfNullOrUndefined(avatarConfig, "avatarConfig");

        this.privConnectionFactory = new SpeechSynthesisConnectionFactory();
        this.privAvatarConfig = avatarConfig;
        this.implCommonSynthesizeSetup();
    }

    protected implCommonSynthesizeSetup(): void {
        super.implCommonSynthesizeSetup();

        // The service checks the audio format setting while it ignores it in avatar synthesis.
        this.privAdapter.audioOutputFormat = AudioOutputFormatImpl.fromSpeechSynthesisOutputFormat(
            SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm
        );
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
        Contracts.throwIfNullOrUndefined(peerConnection, "peerConnection");
        this.privIceServers = peerConnection.getConfiguration().iceServers;
        Contracts.throwIfNullOrUndefined(this.privIceServers, "Ice servers must be set.");
        const iceGatheringDone = new Deferred<void>();
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/icegatheringstatechange_event
        peerConnection.onicegatheringstatechange = (): void => {
            Events.instance.onEvent(new PlatformEvent("peer connection: ice gathering state: " + peerConnection.iceGatheringState, EventType.Debug));
            if (peerConnection.iceGatheringState === "complete") {
                Events.instance.onEvent(new PlatformEvent("peer connection: ice gathering complete.", EventType.Info));
                iceGatheringDone.resolve();
            }
        };
        peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent): void => {
            if (event.candidate) {
                Events.instance.onEvent(new PlatformEvent("peer connection: ice candidate: " + event.candidate.candidate, EventType.Debug));
            } else {
                Events.instance.onEvent(new PlatformEvent("peer connection: ice candidate: complete", EventType.Debug));
                iceGatheringDone.resolve();
            }
        };
        // Set a timeout for ice gathering, currently 2 seconds.
        setTimeout((): void => {
            if (peerConnection.iceGatheringState !== "complete") {
                Events.instance.onEvent(new PlatformEvent("peer connection: ice gathering timeout.", EventType.Warning));
                iceGatheringDone.resolve();
            }
        }, 2000);
        const sdp: RTCSessionDescriptionInit = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(sdp);
        await iceGatheringDone.promise;
        Events.instance.onEvent(new PlatformEvent("peer connection: got local SDP.", EventType.Info));
        this.privProperties.setProperty(PropertyId.TalkingAvatarService_WebRTC_SDP, JSON.stringify(peerConnection.localDescription));

        const result: SpeechSynthesisResult = await this.speak("", false);
        if (result.reason !== ResultReason.SynthesizingAudioCompleted) {
            return new SynthesisResult(
                result.resultId,
                result.reason,
                result.errorDetails,
                result.properties,
            );
        }
        const sdpAnswerString: string = atob(result.properties.getProperty(PropertyId.TalkingAvatarService_WebRTC_SDP));
        const sdpAnswer: RTCSessionDescription = new RTCSessionDescription(
            JSON.parse(sdpAnswerString) as RTCSessionDescriptionInit,
        );
        await peerConnection.setRemoteDescription(sdpAnswer);
        return new SynthesisResult(
            result.resultId,
            result.reason,
            undefined,
            result.properties,
        );
    }

    /**
     * Speaks plain text asynchronously. The rendered audio and video will be sent via the WebRTC connection.
     * @member AvatarSynthesizer.prototype.speakTextAsync
     * @function
     * @public
     * @param {string} text - The plain text to speak.
     * @returns {Promise<SynthesisResult>} The promise of the synthesis result.
     */
    public async speakTextAsync(text: string): Promise<SynthesisResult> {
        const r = await this.speak(text, false);
        return new SynthesisResult(
            r.resultId,
            r.reason,
            r.errorDetails,
            r.properties,
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
    public async speakSsmlAsync(ssml: string): Promise<SynthesisResult> {
        const r = await this.speak(ssml, true);
        return new SynthesisResult(
            r.resultId,
            r.reason,
            r.errorDetails,
            r.properties,
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
        while (this.synthesisRequestQueue.length() > 0) {
            const request = await this.synthesisRequestQueue.dequeue();
            request.err("Synthesis is canceled by user.");
        }
        return this.privAdapter.stopSpeaking();
    }

    /**
     * Stops the talking avatar session and closes the WebRTC connection.
     * For now, this is the same as close().
     * You need to create a new AvatarSynthesizer instance to start a new session.
     * @member AvatarSynthesizer.prototype.stopAvatarAsync
     * @function
     * @public
     * @returns {Promise<void>} The promise of the void result.
     */
    public async stopAvatarAsync(): Promise<void> {
        Contracts.throwIfDisposed(this.privDisposed);
        return this.dispose(true);
    }

    /**
     * Dispose of associated resources.
     * @member AvatarSynthesizer.prototype.close
     * @function
     * @public
     */
    public async close(): Promise<void> {
        if (this.privDisposed) {
            return;
        }

        return this.dispose(true);
    }

    /**
     * Gets the ICE servers. Internal use only.
     */
    public get iceServers(): RTCIceServer[] {
        return this.privIceServers;
    }

    // Creates the synthesis adapter
    protected createSynthesisAdapter(
        authentication: IAuthentication,
        connectionFactory: ISynthesisConnectionFactory,
        synthesizerConfig: SynthesizerConfig): SynthesisAdapterBase {
        return new AvatarSynthesisAdapter(
            authentication,
            connectionFactory,
            synthesizerConfig,
            this,
            this.privAvatarConfig);
    }

    protected createRestSynthesisAdapter(
        _authentication: IAuthentication,
        _synthesizerConfig: SynthesizerConfig): SynthesisRestAdapter {
        return undefined;
    }

    protected createSynthesizerConfig(speechConfig: SpeechServiceConfig): SynthesizerConfig {
        const config = super.createSynthesizerConfig(speechConfig);
        config.avatarEnabled = true;
        return config;
    }

    protected async speak(text: string, isSSML: boolean): Promise<SpeechSynthesisResult> {
        const requestId = createNoDashGuid();
        const deferredResult = new Deferred<SpeechSynthesisResult>();
        this.synthesisRequestQueue.enqueue(new SynthesisRequest(requestId, text, isSSML,
            (e: SpeechSynthesisResult): void => {
                deferredResult.resolve(e);
                this.privSynthesizing = false;
                void this.adapterSpeak();
            },
            (e: string): void => {
                deferredResult.reject(e);
                this.privSynthesizing = false;
            }));
        void this.adapterSpeak();
        return deferredResult.promise;
    }
}
