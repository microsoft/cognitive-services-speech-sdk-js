//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

/**
 * CTS Audio stream information
 */
export interface CtsAudioStream {
    /**
     * The stream offset
     */
    offset?: number; // Using number instead of ulong as TypeScript doesn't have exact equivalent
}
