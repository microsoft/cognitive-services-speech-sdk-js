//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The segmentation mode.
 */
export enum SegmentationMode {
    Normal = "Normal",
    Disabled = "Disabled",
    Custom = "Custom",
    Semantic = "Semantic"
}

/**
 * Defines the segmentation configuration in the speech Context message
 */
export interface Segmentation {
    /**
     * The segmentation mode.
     */
    mode?: SegmentationMode;

    /**
     * The segmentation silence timeout in milliseconds.
     */
    segmentationSilenceTimeoutMs?: number;

    /**
     * The segmentation timeout after which a segmentation is forced,
     * even if speaker is still talking without pause, in milliseconds.
     */
    segmentationForcedTimeoutMs?: number;
}
