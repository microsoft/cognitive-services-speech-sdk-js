// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { PropertyCollection, PropertyId } from "../sdk/Exports.js";
import { Context, SpeechServiceConfig } from "./Exports.js";
import { RecognitionMode } from "./ServiceMessages/PhraseDetection/PhraseDetectionContext.js";

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
        return this.parameters.getProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, "2");
    }

    public set recognitionEndpointVersion(version: string) {
        this.parameters.setProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, version);
    }

    public get sourceLanguageModels(): { language: string; endpoint: string }[] {
        const models: { language: string; endpoint: string }[] = [];
        let modelsExist: boolean = false;
        if (this.autoDetectSourceLanguages !== undefined) {
            for (const language of this.autoDetectSourceLanguages.split(",")) {
                const customProperty = language + PropertyId.SpeechServiceConnection_EndpointId.toString();
                const modelId: string = this.parameters.getProperty(customProperty, undefined);
                if (modelId !== undefined) {
                    models.push({ language, endpoint: modelId });
                    modelsExist = true;
                } else {
                    models.push({ language, endpoint: "" });
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
