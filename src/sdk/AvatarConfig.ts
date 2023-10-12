// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import { AvatarVideoFormat } from "./Exports";

/**
 * Defines the talking avatar configuration.
 * @class AvatarConfig
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarConfig {
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
