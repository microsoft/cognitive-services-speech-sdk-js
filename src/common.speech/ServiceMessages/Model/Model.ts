//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * The model configuration sent in speech.context.
 */
export interface Model {
    /**
     * The custom model name.
     */
    name: string;

    /**
     * Optional, arbitrary model options blob. Omitted when not configured.
     */
    options?: object;
}
