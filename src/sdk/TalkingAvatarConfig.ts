// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {TalkingAvatarVideoFormat} from "./Exports";

/**
 * Defines the talking avatar configuration.
 * @class TalkingAvatarConfig
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class TalkingAvatarConfig {
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
    public videoFormat: TalkingAvatarVideoFormat;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} character - The avatar character.
     * @param {string} style - The avatar style.
     * @param {TalkingAvatarVideoFormat} videoFormat - The talking avatar output video format.
     */
    public constructor(character: string, style: string, videoFormat: TalkingAvatarVideoFormat) {
        this.character = character;
        this.style = style;
        this.videoFormat = videoFormat;
    }
}
