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
    Male,

    /** Neutral voice */
    Neutral
}

export enum SynthesisVoiceType {
    OnlineNeural = 1,
    OnlineStandard = 2,
    OfflineNeural = 3,
    OfflineStandard = 4,
}

const GENDER_LOOKUP: Record<string, SynthesisVoiceGender> = {
    [SynthesisVoiceGender[SynthesisVoiceGender.Neutral]]: SynthesisVoiceGender.Neutral,
    [SynthesisVoiceGender[SynthesisVoiceGender.Male]]: SynthesisVoiceGender.Male,
    [SynthesisVoiceGender[SynthesisVoiceGender.Female]]: SynthesisVoiceGender.Female,
};

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
    private privSampleRateHertz: IVoiceJson["SampleRateHertz"];
    private privStatus: IVoiceJson["Status"];
    private privExtendedPropertyMap: IVoiceJson["ExtendedPropertyMap"];
    private privWordsPerMinute: IVoiceJson["WordsPerMinute"];
    private privSecondaryLocaleList: IVoiceJson["SecondaryLocaleList"];
    private privRolePlayList: IVoiceJson["RolePlayList"];

    public constructor(json: IVoiceJson) {
        if (!!json) {
            this.privName = json.Name;
            this.privLocale = json.Locale;
            this.privShortName = json.ShortName;
            this.privLocaleName = json.LocaleName;
            this.privDisplayName = json.DisplayName;
            this.privLocalName = json.LocalName;
            this.privVoiceType = json.VoiceType.endsWith("Standard") ? SynthesisVoiceType.OnlineStandard : SynthesisVoiceType.OnlineNeural;
            this.privGender = GENDER_LOOKUP[json.Gender] || SynthesisVoiceGender.Unknown;

            if (!!json.StyleList && Array.isArray(json.StyleList)) {
                for (const style of json.StyleList) {
                    this.privStyleList.push(style);
                }
            }

            this.privSampleRateHertz = json.SampleRateHertz;
            this.privStatus = json.Status;

            if (json.ExtendedPropertyMap) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                this.privExtendedPropertyMap = json.ExtendedPropertyMap;
            }

            this.privWordsPerMinute = json.WordsPerMinute;

            if (Array.isArray(json.SecondaryLocaleList)) {
                this.privSecondaryLocaleList = [...json.SecondaryLocaleList];
            }

            if (Array.isArray(json.RolePlayList)) {
                this.privRolePlayList = [...json.RolePlayList];
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

    public get sampleRateHertz(): IVoiceJson["SampleRateHertz"] {
        return this.privSampleRateHertz;
    }

    public get status(): IVoiceJson["Status"] {
        return this.privStatus;
    }

    public get extendedPropertyMap(): IVoiceJson["ExtendedPropertyMap"] {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.privExtendedPropertyMap;
    }

    public get wordsPerMinute(): IVoiceJson["WordsPerMinute"] {
        return this.privWordsPerMinute;
    }

    public get secondaryLocaleList(): IVoiceJson["SecondaryLocaleList"] {
        return this.privSecondaryLocaleList;
    }

    public get rolePlayList(): IVoiceJson["RolePlayList"] {
        return this.privRolePlayList;
    }
}
