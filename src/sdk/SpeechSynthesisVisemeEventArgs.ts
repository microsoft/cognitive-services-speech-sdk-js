// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines contents of speech synthesis viseme event.
 * @class SpeechSynthesisVisemeEventArgs
 * Added in version 1.16.0
 */
export class SpeechSynthesisVisemeEventArgs {
    private privAudioOffset: number;
    private privViseme: string;
    private privDescription: string;
    private privAnimation: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} audioOffset - The audio offset.
     * @param {string} viseme - The text.
     * @param {string} description - The description.
     * @param {string} animation - The animation.
     */
    public constructor(audioOffset: number, viseme: string, description: string, animation: string) {
        this.privAudioOffset = audioOffset;
        this.privViseme = viseme;
        this.privDescription = description;
        this.privAnimation = animation;
    }

    /**
     * Specifies the audio offset.
     * @member SpeechSynthesisVisemeEventArgs.prototype.audioOffset
     * @function
     * @public
     * @returns {number} the audio offset.
     */
    public get audioOffset(): number {
        return this.privAudioOffset;
    }

    /**
     * Specifies the viseme.
     * @member SpeechSynthesisVisemeEventArgs.prototype.viseme
     * @function
     * @public
     * @returns {string} the viseme.
     */
    public get viseme(): string {
        return this.privViseme;
    }

    /**
     * Specifies the description.
     * @member SpeechSynthesisVisemeEventArgs.prototype.description
     * @function
     * @public
     * @returns {string} the description.
     */
    public get description(): string {
        return this.privDescription;
    }

    /**
     * Specifies the animation.
     * @member SpeechSynthesisVisemeEventArgs.prototype.animation
     * @function
     * @public
     * @returns {string} the animation.
     */
    public get animation(): string {
        return this.privAnimation;
    }
}
