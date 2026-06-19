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
     * Audio streams keyed by stream id. A null value is the opt-in marker telling the service
     * the stream is continuation-capable (the reference C++ SDK sends "<id>":null).
     */
    streams?: Record<string, CtsAudioStream | null>;
}
