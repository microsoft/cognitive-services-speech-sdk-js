// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

// The config is serialized and sent as the Speech.Config
export class SpeechServiceConfig {
    private context: Context;
    private recognition: string;

    public constructor(context: Context) {
        this.context = context;
    }

    public serialize(): string {
        return JSON.stringify(this, (key: any, value: { [k: string]: any }): any => {
            if (value && typeof value === "object" && !Array.isArray(value)) {
                const replacement: { [k: string ]: any } = {};
                for (const k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
                    }
                }
                return replacement;
            }
            return value;
        });
    }

    public get Context(): Context {
        return this.context;
    }

    public get Recognition(): string {
        return this.recognition;
    }

    public set Recognition(value: string) {
        this.recognition = value.toLowerCase();
    }
}

export class Context {
    public system: System;
    public os: OS;
    public audio: ISpeechConfigAudio;
    public synthesis: {
        video: ISynthesisSectionVideo;
    };

    public constructor(os: OS) {
        this.system = new System();
        this.os = os;
    }
}

export class System {
    public name: string;
    public version: string;
    public build: string;
    public lang: string;

    public constructor() {
        // Note: below will be patched for official builds.
        const SPEECHSDK_CLIENTSDK_VERSION = "1.44.0-alpha.0.1";

        this.name = "SpeechSDK";
        this.version = SPEECHSDK_CLIENTSDK_VERSION;
        this.build = "JavaScript";
        this.lang = "JavaScript";
    }
}

export class OS {
    public platform: string;
    public name: string;
    public version: string;

    public constructor(platform: string, name: string, version: string) {
        this.platform = platform;
        this.name = name;
        this.version = version;
    }
}

export class Device {
    public manufacturer: string;
    public model: string;
    public version: string;

    public constructor(manufacturer: string, model: string, version: string) {
        this.manufacturer = manufacturer;
        this.model = model;
        this.version = version;
    }
}

export interface ISpeechConfigAudio {
    source?: ISpeechConfigAudioDevice;
    playback?: ISpeechConfigAudioDevice;
}

export interface ISpeechConfigAudioDevice {
    manufacturer: string;
    model: string;
    connectivity: connectivity;
    type: type;
    samplerate: number;
    bitspersample: number;
    channelcount: number;
}

export enum connectivity {
    Bluetooth = "Bluetooth",
    Wired = "Wired",
    WiFi = "WiFi",
    Cellular = "Cellular",
    InBuilt = "InBuilt",
    Unknown = "Unknown",
}

export enum type {
    Phone = "Phone",
    Speaker = "Speaker",
    Car = "Car",
    Headset = "Headset",
    Thermostat = "Thermostat",
    Microphones = "Microphones",
    Deskphone = "Deskphone",
    RemoteControl = "RemoteControl",
    Unknown = "Unknown",
    File = "File",
    Stream = "Stream",
}

export interface ICoordinate {
    x: number;
    y: number;
}

// For avatar synthesis
export interface ISynthesisSectionVideo {
    protocol: {
        name: string;
        webrtcConfig: {
            clientDescription: string;
            iceServers: {
                urls: string[];
                username: string;
                credential: string;
            }[];
        };
    };
    format: {
        bitrate: number;
        codec: string;
        crop: {
            topLeft: ICoordinate;
            bottomRight: ICoordinate;
        };
        resolution: {
            width: number;
            height: number;
        };
    };
    talkingAvatar: {
        character: string;
        customized: boolean;
        useBuiltInVoice: boolean;
        style: string;
        background: {
            color: string;
        };
    };
}
