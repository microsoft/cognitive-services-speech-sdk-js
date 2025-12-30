// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the avatar scene configuration for controlling avatar positioning and orientation.
 * @class AvatarSceneConfig
 * Added in version 1.44.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class AvatarSceneConfig {
    /**
     * The zoom level of the avatar. Value should be between 0 and 1, where 1 is the default (no zoom).
     * @default 1.0
     */
    public zoom: number;

    /**
     * The horizontal position offset of the avatar. Value should be between -1 and 1, where 0 is centered.
     * @default 0.0
     */
    public positionX: number;

    /**
     * The vertical position offset of the avatar. Value should be between -1 and 1, where 0 is centered.
     * @default 0.0
     */
    public positionY: number;

    /**
     * The rotation around the X axis (pitch) in radians.
     * @default 0.0
     */
    public rotationX: number;

    /**
     * The rotation around the Y axis (yaw) in radians.
     * @default 0.0
     */
    public rotationY: number;

    /**
     * The rotation around the Z axis (roll) in radians.
     * @default 0.0
     */
    public rotationZ: number;

    /**
     * Creates and initializes an instance of this class with default values.
     * @constructor
     * @param {number} zoom - The zoom level (0-1, default 1.0).
     * @param {number} positionX - The horizontal position offset (-1 to 1, default 0.0).
     * @param {number} positionY - The vertical position offset (-1 to 1, default 0.0).
     * @param {number} rotationX - The rotation around the X axis in radians (default 0.0).
     * @param {number} rotationY - The rotation around the Y axis in radians (default 0.0).
     * @param {number} rotationZ - The rotation around the Z axis in radians (default 0.0).
     */
    public constructor(
        zoom: number = 1.0,
        positionX: number = 0.0,
        positionY: number = 0.0,
        rotationX: number = 0.0,
        rotationY: number = 0.0,
        rotationZ: number = 0.0
    ) {
        this.zoom = zoom;
        this.positionX = positionX;
        this.positionY = positionY;
        this.rotationX = rotationX;
        this.rotationY = rotationY;
        this.rotationZ = rotationZ;
    }
}
