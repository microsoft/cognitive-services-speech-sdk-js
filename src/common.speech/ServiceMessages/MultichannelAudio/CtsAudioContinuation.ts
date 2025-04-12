//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { CtsAudioInfo } from "./CtsAudioInfo";

/**
 * CTS multichannel audio continuation
 */
export interface CtsAudioContinuation {
    /**
     * CTS Continuation token for audio stream
     */
    token?: string;

    /**
     * Audio information
     */
    audio?: CtsAudioInfo;
}
