import { PropertyCollection } from "../sdk/Exports";
export declare enum RecognitionMode {
    Interactive = 0,
    Conversation = 1,
    Dictation = 2
}
export declare enum SpeechResultFormat {
    Simple = 0,
    Detailed = 1
}
export declare class RecognizerConfig {
    private privRecognitionMode;
    private privPlatformConfig;
    private privRecognitionActivityTimeout;
    private privSpeechConfig;
    constructor(platformConfig: PlatformConfig, recognitionMode: RecognitionMode, speechConfig: PropertyCollection);
    readonly parameters: PropertyCollection;
    readonly recognitionMode: RecognitionMode;
    readonly platformConfig: PlatformConfig;
    readonly recognitionActivityTimeout: number;
    readonly isContinuousRecognition: boolean;
}
export declare class PlatformConfig {
    private context;
    constructor(context: Context);
    serialize: () => string;
    readonly Context: Context;
}
export declare class Context {
    system: System;
    os: OS;
    constructor(os: OS);
}
export declare class System {
    name: string;
    version: string;
    build: string;
    lang: string;
    constructor();
}
export declare class OS {
    platform: string;
    name: string;
    version: string;
    constructor(platform: string, name: string, version: string);
}
export declare class Device {
    manufacturer: string;
    model: string;
    version: string;
    constructor(manufacturer: string, model: string, version: string);
}
