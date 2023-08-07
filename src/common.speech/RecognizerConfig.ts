// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { PropertyCollection, PropertyId } from "../sdk/Exports";

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
    private privRecognitionMode: RecognitionMode;
    private privLanguageIdMode: string;
    private privSpeechServiceConfig: SpeechServiceConfig;
    private privRecognitionActivityTimeout: number;
    private privParameters: PropertyCollection;
    private privMaxRetryCount: number;
    private privEnableSpeakerId: boolean;

    public constructor(
        speechServiceConfig: SpeechServiceConfig,
        parameters: PropertyCollection) {
        this.privSpeechServiceConfig = speechServiceConfig ? speechServiceConfig : new SpeechServiceConfig(new Context(null));
        this.privParameters = parameters;
        this.privMaxRetryCount = parseInt(parameters.getProperty("SPEECH-Error-MaxRetryCount", "4"), 10);
        this.privLanguageIdMode = parameters.getProperty(PropertyId.SpeechServiceConnection_LanguageIdMode, undefined);
        this.privEnableSpeakerId = false;
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

    public get languageIdMode(): string {
        return this.privLanguageIdMode;
    }

    public get autoDetectSourceLanguages(): string {
        return this.parameters.getProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, undefined);
    }

    public get recognitionEndpointVersion(): string {
        return this.parameters.getProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, undefined);
    }

    public get sourceLanguageModels(): { language: string; endpoint: string }[] {
        const models: { language: string; endpoint: string }[] = [];
        let modelsExist: boolean = false;
        if (this.autoDetectSourceLanguages !== undefined) {
            for (const language of this.autoDetectSourceLanguages.split(",")) {
                const customProperty = language + PropertyId.SpeechServiceConnection_EndpointId.toString();
                const modelId: string = this.parameters.getProperty(customProperty, undefined);
                if (modelId !== undefined) {
                    models.push( { language, endpoint: modelId });
                    modelsExist = true;
                } else {
                    models.push( { language, endpoint: "" } );
                }
            }
        }
        return modelsExist ? models : undefined;
    }

    public get maxRetryCount(): number {
        return this.privMaxRetryCount;
    }

    public get isSpeakerDiarizationEnabled(): boolean {
        return this.privEnableSpeakerId;
    }

    public set isSpeakerDiarizationEnabled(value: boolean) {
        this.privEnableSpeakerId = value;
    }
}

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
        bitRate: number;
        codec: string;
        resolution: {
            width: number;
            height: number;
        };
    };
    talkingAvatar: {
        character: string;
        style: string;
        background: {
            color: string;
            image: {
                url: string;
            };
        };
    };
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
        const SPEECHSDK_CLIENTSDK_VERSION = "1.15.0-alpha.0.1";

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
