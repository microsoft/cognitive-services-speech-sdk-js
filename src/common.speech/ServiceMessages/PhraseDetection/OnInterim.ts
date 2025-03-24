//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { NextAction } from "./OnSuccess";

/**
 * The on interim configuration
 */
export interface OnInterim {
    /**
     * The action to take on interim
     */
    action?: NextAction;
}
