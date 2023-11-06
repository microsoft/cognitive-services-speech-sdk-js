// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { RecognitionEventArgs, SpeechRecognitionResult, ConversationTranscriptionResult } from "./Exports.js";

/**
 * Defines contents of speech recognizing/recognized event.
 * @class SpeechRecognitionEventArgs
 */
export class SpeechRecognitionEventArgs extends RecognitionEventArgs {
    private privResult: SpeechRecognitionResult;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {SpeechRecognitionResult} result - The speech recognition result.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    public constructor(result: SpeechRecognitionResult, offset?: number, sessionId?: string) {
        super(offset, sessionId);

        this.privResult = result;
    }

    /**
     * Specifies the recognition result.
     * @member SpeechRecognitionEventArgs.prototype.result
     * @function
     * @public
     * @returns {SpeechRecognitionResult} the recognition result.
     */
    public get result(): SpeechRecognitionResult {
        return this.privResult;
    }
}

/**
 * Defines contents of conversation transcribed/transcribing event.
 * @class ConversationTranscriptionEventArgs
 */
export class ConversationTranscriptionEventArgs extends RecognitionEventArgs {
    private privResult: ConversationTranscriptionResult;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {ConversationTranscriptionResult} result - The conversation transcription result.
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    public constructor(result: ConversationTranscriptionResult, offset?: number, sessionId?: string) {
        super(offset, sessionId);

        this.privResult = result;
    }

    /**
     * Specifies the transcription result.
     * @member ConversationTranscription1EventArgs.prototype.result
     * @function
     * @public
     * @returns {ConversationTranscriptionResult} the recognition result.
     */
        public get result(): ConversationTranscriptionResult {
            return this.privResult;
        }
}

/**
 * Defines contents of meeting transcribed/transcribing event.
 * @class MeetingTranscriptionEventArgs
 */
export class MeetingTranscriptionEventArgs extends SpeechRecognitionEventArgs {
}
