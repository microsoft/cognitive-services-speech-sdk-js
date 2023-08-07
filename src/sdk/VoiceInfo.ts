// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the gender of synthesis voices.
 * Added in version 1.20.0.
 */
export enum SynthesisVoiceGender {

    /** Gender unknown */
    Unknown,

    /** Female voice */
    Female,

    /** Male voice */
    Male
}

export enum SynthesisVoiceType {
    OnlineNeural = 1,
    OnlineStandard = 2,
    OfflineNeural = 3,
    OfflineStandard = 4,
}

/**
 * Information about Speech Synthesis voice
 * Added in version 1.20.0.
 * @class VoiceInfo
 */
export class VoiceInfo {
    private privName: string;
    private privLocale: string;
    private privShortName: string;
    private privDisplayName: string;
    private privLocalName: string;
    private privLocaleName: string;
    private privGender: SynthesisVoiceGender;
    private privVoiceType: SynthesisVoiceType;
    private privStyleList: string[] = [];

    public constructor(json: { Name: string; LocalName: string; DisplayName: string; ShortName: string; Gender: string; VoiceType: string; LocaleName: string ; Locale: string; StyleList: string[] }) {
        if (!!json) {
            this.privName = json.Name;
            this.privLocale = json.Locale;
            this.privShortName = json.ShortName;
            this.privLocaleName = json.LocaleName;
            this.privDisplayName = json.DisplayName;
            this.privLocalName = json.LocalName;
            this.privVoiceType = json.VoiceType.endsWith("Standard") ? SynthesisVoiceType.OnlineStandard : SynthesisVoiceType.OnlineNeural;
            this.privGender = json.Gender === "Male" ? SynthesisVoiceGender.Male : json.Gender === "Female" ? SynthesisVoiceGender.Female : SynthesisVoiceGender.Unknown;
            if (!!json.StyleList && Array.isArray(json.StyleList)) {
                for (const style of json.StyleList) {
                    this.privStyleList.push(style);
                }
            }
        }
    }

    public get name(): string {
        return this.privName;
    }

    public get locale(): string {
        return this.privLocale;
    }

    public get shortName(): string {
        return this.privShortName;
    }

    public get displayName(): string {
        return this.privDisplayName;
    }

    public get localName(): string {
        return this.privLocalName;
    }

    public get localeName(): string {
        return this.privLocaleName;
    }

    public get gender(): SynthesisVoiceGender {
        return this.privGender;
    }

    public get voiceType(): SynthesisVoiceType {
        return this.privVoiceType;
    }

    public get styleList(): string[] {
        return this.privStyleList;
    }
}
