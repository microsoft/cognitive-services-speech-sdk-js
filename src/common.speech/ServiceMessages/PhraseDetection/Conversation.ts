//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { Segmentation } from "./Segmentation";

/**
 * Defines the conversation configuration in the speech Context message
 */
export interface Conversation {
    /**
     * The segmentation configuration.
     */
    segmentation: Segmentation;
}
