// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines contents of speech synthesis bookmark event.
 * @class SpeechSynthesisBookmarkEventArgs
 * Added in version 1.16.0
 */
export class SpeechSynthesisBookmarkEventArgs {
    private privAudioOffset: number;
    private privText: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} audioOffset - The audio offset.
     * @param {string} text - The bookmark text.
     */
    public constructor(audioOffset: number, text: string) {
        this.privAudioOffset = audioOffset;
        this.privText = text;
    }

    /**
     * Specifies the audio offset.
     * @member SpeechSynthesisBookmarkEventArgs.prototype.audioOffset
     * @function
     * @public
     * @returns {number} the audio offset.
     */
    public get audioOffset(): number {
        return this.privAudioOffset;
    }

    /**
     * Specifies the bookmark.
     * @member SpeechSynthesisBookmarkEventArgs.prototype.text
     * @function
     * @public
     * @returns {string} the bookmark text.
     */
    public get text(): string {
        return this.privText;
    }
}
