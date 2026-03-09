// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * @internal
 * Interface for the parent request that the input stream delegates to.
 */
interface ISpeechSynthesisRequestInputStreamHost {
    onTextPieceReceived(text: string): void;
    onInputStreamClosed(): void;
}

/**
 * Represents an input stream for speech synthesis request text streaming.
 * Note: This class is in preview and may be subject to change in future versions.
 * Added in version 1.37.0
 * @class SpeechSynthesisRequestInputStream
 */
export class SpeechSynthesisRequestInputStream {
    private privParent: ISpeechSynthesisRequestInputStreamHost;
    private privClosed: boolean = false;

    /**
     * Constructor for internal use.
     * @param parent The parent SpeechSynthesisRequest.
     */
    public constructor(parent: ISpeechSynthesisRequestInputStreamHost) {
        this.privParent = parent;
    }

    /**
     * Writes the specified text to the input stream.
     * @param text The text to be written to the input stream.
     */
    public write(text: string): void {
        if (this.privClosed) {
            throw new Error("Cannot write to a closed input stream.");
        }
        this.privParent.onTextPieceReceived(text);
    }

    /**
     * Closes the input stream, signaling that no more text will be written.
     */
    public close(): void {
        if (!this.privClosed) {
            this.privClosed = true;
            this.privParent.onInputStreamClosed();
        }
    }

    /**
     * Gets whether the input stream is closed.
     */
    public get isClosed(): boolean {
        return this.privClosed;
    }
}
