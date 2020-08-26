// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    AudioConfig,
    SpeechTranslationConfig,
} from "../Exports";
import { Callback, IConversation } from "./IConversation";

export class ConversationCommon {

    protected privAudioConfig: AudioConfig;
    protected privSpeechTranslationConfig: SpeechTranslationConfig;

    public constructor(audioConfig?: AudioConfig) {
        this.privAudioConfig = audioConfig;
    }

    protected handleCallback(cb: Callback, err: Callback): void {
        if (!!cb) {
            try {
                cb();
            } catch (e) {
                if (!!err) {
                    err(e);
                }
            }
            cb = undefined;
        }
    }

    protected handleError(error: any, err: Callback): void {
        if (!!err) {
            if (error instanceof Error) {
                const typedError: Error = error as Error;
                err(typedError.name + ": " + typedError.message);

            } else {
                err(error);
            }
        }
    }
}
