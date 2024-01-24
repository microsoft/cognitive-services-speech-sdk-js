// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SpeechSynthesisBoundaryType } from "./SpeechSynthesisBoundaryType.js";

/**
 * Defines contents of speech synthesis word boundary event.
 * @class SpeechSynthesisWordBoundaryEventArgs
 * Added in version 1.11.0
 */
export class SpeechSynthesisWordBoundaryEventArgs {
    private readonly privAudioOffset: number;
    private readonly privDuration: number;
    private readonly privText: string;
    private readonly privWordLength: number;
    private readonly privTextOffset: number;
    private readonly privBoundaryType: SpeechSynthesisBoundaryType;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} audioOffset - The audio offset.
     * @param {number} duration - The audio duration.
     * @param {string} text - The text.
     * @param {number} wordLength - The length of the word.
     * @param {number} textOffset - The text offset.
     * @param {SpeechSynthesisBoundaryType} boundaryType - The boundary type
     */
    public constructor(audioOffset: number, duration: number, text: string, wordLength: number,
                       textOffset: number, boundaryType: SpeechSynthesisBoundaryType) {
        this.privAudioOffset = audioOffset;
        this.privDuration = duration;
        this.privText = text;
        this.privWordLength = wordLength;
        this.privTextOffset = textOffset;
        this.privBoundaryType = boundaryType;
    }

    /**
     * Specifies the audio offset.
     * @member SpeechSynthesisWordBoundaryEventArgs.prototype.audioOffset
     * @function
     * @public
     * @returns {number} the audio offset.
     */
    public get audioOffset(): number {
        return this.privAudioOffset;
    }

    /**
     * Specifies the duration, in ticks (100 nanoseconds).
     * @member SpeechSynthesisWordBoundaryEventArgs.prototype.duration
     * @function
     * @public
     * @returns {number} Duration in 100 nanosecond increments.
     */
    public get duration(): number {
        return this.privDuration;
    }

    /**
     * Specifies the text of the word boundary event.
     * @member SpeechSynthesisWordBoundaryEventArgs.prototype.text
     * @function
     * @public
     * @returns {string} the text.
     */
    public get text(): string {
        return this.privText;
    }

    /**
     * Specifies the word length
     * @member SpeechSynthesisWordBoundaryEventArgs.prototype.wordLength
     * @function
     * @public
     * @returns {number} the word length
     */
    public get wordLength(): number {
        return this.privWordLength;
    }

    /**
     * Specifies the text offset.
     * @member SpeechSynthesisWordBoundaryEventArgs.prototype.textOffset
     * @function
     * @public
     * @returns {number} the text offset.
     */
    public get textOffset(): number {
        return this.privTextOffset;
    }

    /**
     * Specifies the boundary type.
     * @member SpeechSynthesisWordBoundaryEventArgs.prototype.boundaryType
     * @function
     * @public
     * @returns {SpeechSynthesisBoundaryType} the boundary type.
     */
    public get boundaryType(): SpeechSynthesisBoundaryType {
        return this.privBoundaryType;
    }
}
