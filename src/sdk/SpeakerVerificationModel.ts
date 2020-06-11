// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import {
    VoiceProfile,
    VoiceProfileType,
} from "./Exports";

/**
 * Defines SpeakerVerificationModel class for Speaker Recognition
 * Model contains a profile against which to verify a speaker
 * @class SpeakerVerificationModel
 */
export class SpeakerVerificationModel {
    private privVoiceProfile: VoiceProfile;

    private constructor(profile: VoiceProfile) {
        Contracts.throwIfNullOrUndefined(profile, "VoiceProfile");
        if (profile.profileType === VoiceProfileType.TextIndependentIdentification) {
            throw new Error("Verification model cannot be created from Identification profile");
        }
        this.privVoiceProfile = profile;
    }

    public static fromProfile(profile: VoiceProfile): SpeakerVerificationModel {
        return new SpeakerVerificationModel(profile);
    }

    public get voiceProfile(): VoiceProfile {
        return this.privVoiceProfile;
    }
}
