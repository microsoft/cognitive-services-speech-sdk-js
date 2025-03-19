// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";
import { AvatarVideoFormat } from "./Exports.js";

/**
 * Defines the talking avatar configuration.
 * @class AvatarConfig
 * Added in version 1.33.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarConfig {
    private privCustomized: boolean = false;
    private privUseBuiltInVoice: boolean = false;
    private privBackgroundColor: string;
    private privBackgroundImage: URL;
    private privRemoteIceServers: RTCIceServer[];

    /**
     * Defines the avatar character.
     */
    public character: string;
    /**
     * Defines the avatar style.
     */
    public style: string;
    /**
     * Defines the talking avatar output video format.
     */
    public videoFormat: AvatarVideoFormat;

    /**
     * Indicates if the talking avatar is customized.
     */
    public get customized(): boolean {
        return this.privCustomized;
    }

    /**
     * Sets if the talking avatar is customized.
     */
    public set customized(value: boolean) {
        this.privCustomized = value;
    }

    /**
     * Indicates whether to use built-in voice for custom avatar.
     */
    public get useBuiltInVoice(): boolean {
        return this.privUseBuiltInVoice;
    }

    /**
     * Sets whether to use built-in voice for custom avatar.
     */
    public set useBuiltInVoice(value: boolean) {
        this.privUseBuiltInVoice = value;
    }

    /**
     * Gets the background color.
     */
    public get backgroundColor(): string {
        return this.privBackgroundColor;
    }

    /**
     * Sets the background color.
     */
    public set backgroundColor(value: string) {
        this.privBackgroundColor = value;
    }

    /**
     * Gets the background image.
     */
    public get backgroundImage(): URL {
        return this.privBackgroundImage;
    }

    /**
     * Sets the background image.
     * @param {URL} value - The background image.
     */
    public set backgroundImage(value: URL) {
        this.privBackgroundImage = value;
    }

    /**
     * Gets the remote ICE servers.
     * @remarks This method is designed to be used internally in the SDK.
     * @returns {RTCIceServer[]} The remote ICE servers.
     */
    public get remoteIceServers(): RTCIceServer[] {
        return this.privRemoteIceServers;
    }

    /**
     * Sets the remote ICE servers.
     * @remarks Normally, the ICE servers are gathered from the PeerConnection,
     * set this property to override the ICE servers. E.g., the ICE servers are
     * different in client and server side.
     * @param {RTCIceServer[]} value - The remote ICE servers.
     */
    public set remoteIceServers(value: RTCIceServer[]) {
        this.privRemoteIceServers = value;
    }

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} character - The avatar character.
     * @param {string} style - The avatar style.
     * @param {AvatarVideoFormat} videoFormat - The talking avatar output video format.
     */
    public constructor(character: string, style: string, videoFormat: AvatarVideoFormat) {
        Contracts.throwIfNullOrWhitespace(character, "character");
        this.character = character;
        this.style = style;
        if (videoFormat === undefined) {
            videoFormat = new AvatarVideoFormat();
        }
        this.videoFormat = videoFormat;
    }
}
