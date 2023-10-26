// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

/**
 * Defines a coordinate in 2D space.
 * @class Coordinate
 * Added in version 1.33.0
 */
export class Coordinate {
    public x: number;
    public y: number;

    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

/**
 * Defines the avatar output video format.
 * @class AvatarVideoFormat
 * Added in version 1.33.0
 *
 * @experimental This feature is experimental and might change in the future.
 */
export class AvatarVideoFormat {
    /**
     * Defines the video codec.
     * @default "H264"
     */
    public codec: string;
    /**
     * Defines the video bitrate.
     * @default 2000000
     */
    public bitrate: number;
    /**
     * Defines the video width.
     * @default 1920
     */
    public width: number;
    /**
     * Defines the video height.
     * @default 1080
     */
    public height: number;

    /**
     * Sets the video crop range.
     */
    public setCropRange(topLeft: Coordinate, bottomRight: Coordinate): void {
        this.cropRange = {
            bottomRight,
            topLeft,
        };
    }

    /**
     * Defines the video crop range.
     * @default undefined
     * @internal
     */
    public cropRange: {
        topLeft: Coordinate;
        bottomRight: Coordinate;
    };

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} codec - The video codec.
     * @param {number} bitrate - The video bitrate.
     * @param {number} width - The video width.
     * @param {number} height - The video height.
     */
    public constructor(codec: string = "H264",
                       bitrate: number = 2000000,
                       width: number = 1920,
                       height: number = 1080,
    ) {
        this.codec = codec;
        this.bitrate = bitrate;
        this.width = width;
        this.height = height;
    }
}
