// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    Recognizer
} from "../Exports";
import { ConversationTranscriber } from "./Exports";

/**
 * @private
 * @class ConversationTranscriberImpl
 */
export class ConversationTranscriberImpl extends ConversationTranscriber {

    /**
     * The recognizer instance defined for this ConversationTranscriber.
     * @member ConversationTranscriberImpl.prototype.recognizer
     * @function
     * @public;
     * @returns {Recognizer} The recognizer instance defined for this ConversationTranscriber.
     */
     public get recognizer(): Recognizer {
        return this.privRecognizer;
    }
}
