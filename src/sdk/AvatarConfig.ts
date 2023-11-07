// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts.js";
import { AvatarVideoFormat } from "./Exports.js";

/**
 * Defines the talking avatar configuration.
 * @class AvatarConfig
 * Added in version 1.33.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarConfig {
    private privCustomized: boolean = false;
    private privBackgroundColor: string;

    /**
     * Defines the avatar character.
     */
    public character: string;
    /**
     * Defines the avatar style.
     */
    public style: string;
    /**
     * Defines the talking avatar output video format.
     */
    public videoFormat: AvatarVideoFormat;

    /**
     * Indicates if the talking avatar is customized.
     */
    public get customized(): boolean {
        return this.privCustomized;
    }

    /**
     * Sets if the talking avatar is customized.
     */
    public set customized(value: boolean) {
        this.privCustomized = value;
    }

    /**
     * Sets the background color.
     */
    public get backgroundColor(): string {
        return this.privBackgroundColor;
    }

    /**
     * Gets the background color.
     */
    public set backgroundColor(value: string) {
        this.privBackgroundColor = value;
    }

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} character - The avatar character.
     * @param {string} style - The avatar style.
     * @param {AvatarVideoFormat} videoFormat - The talking avatar output video format.
     */
    public constructor(character: string, style: string, videoFormat: AvatarVideoFormat) {
        Contracts.throwIfNullOrWhitespace(character, "character");
        this.character = character;
        this.style = style;
        if (videoFormat === undefined) {
            videoFormat = new AvatarVideoFormat();
        }
        this.videoFormat = videoFormat;
    }
}
