// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface IVoiceJson {
    Name: string;
    LocalName: string;
    DisplayName: string;
    LocaleName: string;
    ShortName: string;
    Gender: string;
    VoiceType: string;
    Locale: string;
    StyleList: string[];
    SampleRateHertz: string;
    Status: string;
    ExtendedPropertyMap?: any;
    WordsPerMinute: string;
    SecondaryLocaleList?: string[];
    RolePlayList?: string[];
}
