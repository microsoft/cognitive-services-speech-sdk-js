// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection } from "../sdk/Exports";

export enum RecognitionMode {
    Interactive,
    Conversation,
    Dictation,
}

export enum SpeechResultFormat {
    Simple,
    Detailed,
}

export class RecognizerConfig {
    private privRecognitionMode: RecognitionMode = RecognitionMode.Interactive;
    private privSpeechServiceConfig: SpeechServiceConfig;
    private privRecognitionActivityTimeout: number;
    private privParameters: PropertyCollection;

    constructor(
        speechServiceConfig: SpeechServiceConfig,
        parameters: PropertyCollection) {
        this.privSpeechServiceConfig = speechServiceConfig ? speechServiceConfig : new SpeechServiceConfig(new Context(null));
        this.privParameters = parameters;
    }

    public get parameters(): PropertyCollection {
        return this.privParameters;
    }

    public get recognitionMode(): RecognitionMode {
        return this.privRecognitionMode;
    }

    public set recognitionMode(value: RecognitionMode) {
        this.privRecognitionMode = value;
        this.privRecognitionActivityTimeout = value === RecognitionMode.Interactive ? 8000 : 25000;
        this.privSpeechServiceConfig.Recognition = RecognitionMode[value];
    }

    public get SpeechServiceConfig(): SpeechServiceConfig {
        return this.privSpeechServiceConfig;
    }

    public get recognitionActivityTimeout(): number {
        return this.privRecognitionActivityTimeout;
    }

    public get isContinuousRecognition(): boolean {
        return this.privRecognitionMode !== RecognitionMode.Interactive;
    }
}

// The config is serialized and sent as the Speech.Config
// tslint:disable-next-line:max-classes-per-file
export class SpeechServiceConfig {
    private context: Context;
    private recognition: string;

    constructor(context: Context) {
        this.context = context;
    }

    public serialize = (): string => {
        return JSON.stringify(this, (key: any, value: any): any => {
            if (value && typeof value === "object") {
                const replacement: any = {};
                for (const k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
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

// tslint:disable-next-line:max-classes-per-file
export class Context {
    public system: System;
    public os: OS;
    public audio: ISpeechConfigAudio;

    constructor(os: OS) {
        this.system = new System();
        this.os = os;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class System {
    public name: string;
    public version: string;
    public build: string;
    public lang: string;

    constructor() {
        // Note: below will be patched for official builds.
        const SPEECHSDK_CLIENTSDK_VERSION = "1.6.0-alpha.0.1";

        this.name = "SpeechSDK";
        this.version = SPEECHSDK_CLIENTSDK_VERSION;
        this.build = "JavaScript";
        this.lang = "JavaScript";
    }
}

// tslint:disable-next-line:max-classes-per-file
export class OS {
    public platform: string;
    public name: string;
    public version: string;

    constructor(platform: string, name: string, version: string) {
        this.platform = platform;
        this.name = name;
        this.version = version;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class Device {
    public manufacturer: string;
    public model: string;
    public version: string;

    constructor(manufacturer: string, model: string, version: string) {
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
