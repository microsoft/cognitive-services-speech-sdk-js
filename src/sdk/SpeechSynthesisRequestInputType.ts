// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the input type of speech synthesis request.
 * @enum SpeechSynthesisRequestInputType
 */
export enum SpeechSynthesisRequestInputType {
    /**
     * Plain text input.
     */
    Text = 1,

    /**
     * SSML (Speech Synthesis Markup Language) input.
     */
    SSML = 2,

    /**
     * Text stream input, for streaming text to the synthesizer.
     */
    TextStream = 3,
}
