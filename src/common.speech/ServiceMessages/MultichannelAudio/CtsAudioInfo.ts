//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { CtsAudioStream } from "./CtsAudioStream";

/**
 * Audio information
 */
export interface CtsAudioInfo {
    /**
     * Audio streams
     */
    streams?: Record<number, CtsAudioStream>;
}
