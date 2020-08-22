// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines contents of speech synthesis word boundary event.
 * @class SpeechSynthesisWordBoundaryEventArgs
 * Added in version 1.11.0
 */
export class SpeechSynthesisWordBoundaryEventArgs {
    private privAudioOffset: number;
    private privText: string;
    private privWordLength: number;
    private privTextOffset: number;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} audioOffset - The audio offset.
     * @param {string} text - The text.
     * @param {number} wordLength - The length of the word.
     * @param {number} textOffset - The text offset.
     */
    public constructor(audioOffset: number, text: string, wordLength: number, textOffset: number) {
        this.privAudioOffset = audioOffset;
        this.privText = text;
        this.privWordLength = wordLength;
        this.privTextOffset = textOffset;
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
}
