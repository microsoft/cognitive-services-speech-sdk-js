// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SpeechSynthesisRequest } from "./SpeechSynthesisRequest.js";
import { SpeechSynthesisRequestInputType } from "./SpeechSynthesisRequestInputType.js";

/**
 * Represents a speech synthesis request for personal voice (aka.ms/azureai/personal-voice).
 * Note: This class is in preview and may be subject to change in future versions.
 * Added in version 1.39.0
 * @class PersonalVoiceSynthesisRequest
 */
export class PersonalVoiceSynthesisRequest extends SpeechSynthesisRequest {
    private privPersonalVoiceName: string;
    private privModelName: string;

    /**
     * Creates a speech synthesis request for personal voice.
     * @param inputType The input type for the personal voice synthesis request.
     * @param personalVoiceName The personal voice name.
     * @param modelName The model name, e.g., "DragonLatestNeural" or "PhoenixLatestNeural".
     */
    public constructor(inputType: SpeechSynthesisRequestInputType, personalVoiceName: string, modelName: string) {
        super(inputType);
        this.privPersonalVoiceName = personalVoiceName;
        this.privModelName = modelName;
    }

    /**
     * Gets the personal voice name.
     */
    public get personalVoiceName(): string {
        return this.privPersonalVoiceName;
    }

    /**
     * Gets the model name.
     */
    public get modelName(): string {
        return this.privModelName;
    }
}
