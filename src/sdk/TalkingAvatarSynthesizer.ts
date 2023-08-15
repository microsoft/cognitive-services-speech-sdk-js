// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    SpeechConfig,
    SynthesisResult,
    TalkingAvatarConfig,
    TalkingAvatarEventArgs,
    TalkingAvatarWebRTCConnectionInfo,
    TalkingAvatarWebRTCConnectionResult
} from "./Exports";

/**
 * Defines the talking avatar synthesizer.
 * @class TalkingAvatarSynthesizer
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class TalkingAvatarSynthesizer {

    /**
     * Defines event handler for synthesizing events.
     * @member SpeechSynthesizer.prototype.synthesizing
     * @function
     * @public
     */
    public eventReceived: (sender: TalkingAvatarSynthesizer, event: TalkingAvatarEventArgs) => void;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {SpeechConfig} speechConfig - The speech config.
     * @param {TalkingAvatarConfig} avatarConfig - The talking avatar config.
     */
    public constructor(speechConfig: SpeechConfig, avatarConfig: TalkingAvatarConfig) {
        // todo: implement
    }

    /**
     * Starts the talking avatar session and establishes the WebRTC connection.
     * @member TalkingAvatarSynthesizer.prototype.startTalkingAvatarAsync
     * @function
     * @public
     * @param {TalkingAvatarWebRTCConnectionInfo} webrtcConnectionInfo - The WebRTC connection info.
     * @returns {Promise<TalkingAvatarWebRTCConnectionResult>} The promise of the connection result.
     */
    public async startTalkingAvatarAsync(webrtcConnectionInfo: TalkingAvatarWebRTCConnectionInfo): Promise<TalkingAvatarWebRTCConnectionResult> {
        // todo: implement
    }

    /**
     * Speaks SSML asynchronously. The rendered audio and video will be sent via the WebRTC connection.
     * @member TalkingAvatarSynthesizer.prototype.speakSsmlAsync
     * @function
     * @public
     * @param {string} ssml - The SSML text to speak.
     * @returns {Promise<SynthesisResult>} The promise of the synthesis result.
     */
    public async speakSsmlAsync(ssml: string): Promise<SynthesisResult> {
        // todo: implement
    }

    /**
     * Speaks text asynchronously. The avatar will switch to idle state.
     * @member TalkingAvatarSynthesizer.prototype.stopSpeakingAsync
     * @function
     * @public
     * @returns {Promise<void>} The promise of the void result.
     */
    public async stopSpeakingAsync(): Promise<void> {
        // todo: implement
    }

    /**
     * Stops the talking avatar session and closes the WebRTC connection.
     * @member TalkingAvatarSynthesizer.prototype.stopTalkingAvatarAsync
     * @function
     * @public
     * @returns {Promise<void>} The promise of the void result.
     */
    public async stopTalkingAvatarAsync(): Promise<void> {
        // todo: implement
    }
}
