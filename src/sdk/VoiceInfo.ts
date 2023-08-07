// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IVoiceJson } from "./IVoiceJson";

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
    private privName: IVoiceJson["Name"];
    private privLocale: IVoiceJson["Locale"];
    private privShortName: IVoiceJson["ShortName"];
    private privDisplayName: IVoiceJson["DisplayName"];
    private privLocalName: IVoiceJson["LocalName"];
    private privLocaleName: IVoiceJson["LocaleName"];
    private privGender: SynthesisVoiceGender;
    private privVoiceType: SynthesisVoiceType;
    private privStyleList: IVoiceJson["StyleList"] = [];

    public constructor(json: IVoiceJson) {
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

    public get name(): IVoiceJson["Name"] {
        return this.privName;
    }

    public get locale(): IVoiceJson["Locale"] {
        return this.privLocale;
    }

    public get shortName(): IVoiceJson["ShortName"] {
        return this.privShortName;
    }

    public get displayName(): IVoiceJson["DisplayName"] {
        return this.privDisplayName;
    }

    public get localName(): IVoiceJson["LocalName"] {
        return this.privLocalName;
    }

    public get localeName(): IVoiceJson["LocaleName"] {
        return this.privLocaleName;
    }

    public get gender(): SynthesisVoiceGender {
        return this.privGender;
    }

    public get voiceType(): SynthesisVoiceType {
        return this.privVoiceType;
    }

    public get styleList(): IVoiceJson["StyleList"] {
        return this.privStyleList;
    }
}
