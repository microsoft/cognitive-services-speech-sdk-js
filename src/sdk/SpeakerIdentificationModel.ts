// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";
import { SpeakerRecognitionModel } from "./SpeakerRecognitionModel.js";
import {
    VoiceProfile,
    VoiceProfileType,
} from "./Exports.js";

/**
 * Defines SpeakerIdentificationModel class for Speaker Recognition
 * Model contains a set of profiles against which to identify speaker(s)
 * @class SpeakerIdentificationModel
 */
export class SpeakerIdentificationModel implements SpeakerRecognitionModel {
    private privVoiceProfiles: VoiceProfile[] = [];
    private privProfileIds: string[] = [];

    private constructor(profiles: VoiceProfile[]) {
        Contracts.throwIfNullOrUndefined(profiles, "VoiceProfiles");
        if (profiles.length === 0) {
            throw new Error("Empty Voice Profiles array");
        }
        for (const profile of profiles) {
            if (profile.profileType !== VoiceProfileType.TextIndependentIdentification) {
                throw new Error("Identification model can only be created from Identification profile: " + profile.profileId);
            }
            this.privVoiceProfiles.push(profile);
            this.privProfileIds.push(profile.profileId);
        }
    }
    public static fromProfiles(profiles: VoiceProfile[]): SpeakerIdentificationModel {
        return new SpeakerIdentificationModel(profiles);
    }

    public get voiceProfileIds(): string {
        return this.privProfileIds.join(",");
    }

    public get profileIds(): string[] {
        return this.privProfileIds;
    }

    public get scenario(): string {
        return "TextIndependentIdentification";
    }
}
