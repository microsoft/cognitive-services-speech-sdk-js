// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { VoiceProfileType } from "./Exports.js";

/**
 * Defines Voice Profile class for Speaker Recognition
 * @class VoiceProfile
 */
export class VoiceProfile {
    private privId: string;
    private privProfileType: VoiceProfileType;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} profileId - profileId of this Voice Profile.
     * @param {VoiceProfileType} profileType - profileType of this Voice Profile.
     */
    public constructor(profileId: string, profileType: VoiceProfileType) {
        this.privId = profileId;
        this.privProfileType = profileType;
    }

    /**
     * profileId of this Voice Profile instance
     * @member VoiceProfile.prototype.profileId
     * @function
     * @public
     * @returns {string} profileId of this Voice Profile instance.
     */
    public get profileId(): string {
        return this.privId;
    }

    /**
     * profileType of this Voice Profile instance
     * @member VoiceProfile.prototype.profileType
     * @function
     * @public
     * @returns {VoiceProfileType} profile type of this Voice Profile instance.
     */
    public get profileType(): VoiceProfileType {
        return this.privProfileType;
    }

}
