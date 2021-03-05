// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines contents of speech synthesis viseme event.
 * @class SpeechSynthesisVisemeEventArgs
 * Added in version 1.16.0
 */
export class SpeechSynthesisVisemeEventArgs {
    private privAudioOffset: number;
    private privVisemeId: number;
    private privAnimation: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} audioOffset - The audio offset.
     * @param {number} visemeId - The viseme ID.
     * @param {string} animation - The animation, could be in svg or other format.
     */
    public constructor(audioOffset: number, visemeId: number, animation: string) {
        this.privAudioOffset = audioOffset;
        this.privVisemeId = visemeId;
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
     * Specifies the viseme ID.
     * @member SpeechSynthesisVisemeEventArgs.prototype.visemeId
     * @function
     * @public
     * @returns {number} the viseme ID.
     */
    public get visemeId(): number {
        return this.privVisemeId;
    }

    /**
     * Specifies the animation.
     * @member SpeechSynthesisVisemeEventArgs.prototype.animation
     * @function
     * @public
     * @returns {string} the animation, could be in svg or other format.
     */
    public get animation(): string {
        return this.privAnimation;
    }
}
