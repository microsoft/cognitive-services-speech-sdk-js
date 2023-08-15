// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the talking avatar WebRTC connection info.
 * @class TalkingAvatarWebRTCConnectionInfo
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change in the future.
 */
export class TalkingAvatarWebRTCConnectionInfo {
    /**
     * Defines the SDP (Session Description Protocol) offer of WebRTC connection.
     */
    public SDPOffer: string;
    /**
     * Defines the ICE (Interactive Connectivity Establishment) servers of WebRTC connection.
     */
    public ICEServers: string[];
    /**
     * Defines the ICE (Interactive Connectivity Establishment) username of WebRTC connection.
     */
    public ICEUsername?: string;
    /**
     * Defines the ICE (Interactive Connectivity Establishment) credential of WebRTC connection.
     */
    public ICECredential?: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} SDPOffer - The SDP offer of WebRTC connection.
     * @param {string[]} ICEServers - The ICE servers of WebRTC connection.
     * @param {string} ICEUsername - The ICE username of WebRTC connection.
     * @param {string} ICECredential - The ICE credential of WebRTC connection.
     */
    public constructor(SDPOffer: string, ICEServers: string[], ICEUsername?: string, ICECredential?: string) {
        this.SDPOffer = SDPOffer;
        this.ICEServers = ICEServers;
        this.ICEUsername = ICEUsername;
        this.ICECredential = ICECredential;
    }
}
