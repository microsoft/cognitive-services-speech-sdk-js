// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SessionEventArgs } from "./Exports.js";

/**
 * Defines payload for session events like Speech Start/End Detected
 * @class
 */
export class RecognitionEventArgs extends SessionEventArgs {
    private privOffset: number;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {number} offset - The offset.
     * @param {string} sessionId - The session id.
     */
    public constructor(offset: number, sessionId?: string) {
        super(sessionId);

        this.privOffset = offset;
    }

    /**
     * Represents the message offset
     * @member RecognitionEventArgs.prototype.offset
     * @function
     * @public
     */
    public get offset(): number {
        return this.privOffset;
    }
}
