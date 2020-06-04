// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import {
    VoiceProfile,
    VoiceProfileType,
} from "./Exports";

export class SpeakerIdentificationModel {
    private privVoiceProfiles: VoiceProfile[] = [];

    private constructor(profiles: VoiceProfile[]) {
        Contracts.throwIfNullOrUndefined(profiles, "VoiceProfiles");
        if (profiles.length === 0) {
            throw new Error("Empty Voice Profiles array");
        }
        profiles.forEach((profile: VoiceProfile) => {
            if (profile.profileType !== VoiceProfileType.TextIndependentIdentification) {
                throw new Error("Identification model cannot be created from Verification profile: " + profile.profileId);
            }
            this.privVoiceProfiles.push(profile);
        });
    }
    public static fromProfiles(profiles: VoiceProfile[]): SpeakerIdentificationModel {
        return new SpeakerIdentificationModel(profiles);
    }

    public get voiceProfileIds(): string {
        return this.privVoiceProfiles.map((profile: VoiceProfile) => profile.profileId).join(",");
    }

}
