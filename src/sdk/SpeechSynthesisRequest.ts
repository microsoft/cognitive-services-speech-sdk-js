// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PropertyCollection, PropertyId } from "./Exports.js";
import { SpeechSynthesisRequestInputType } from "./SpeechSynthesisRequestInputType.js";
import { SpeechSynthesisRequestInputStream } from "./SpeechSynthesisRequestInputStream.js";

export { SpeechSynthesisRequestInputStream } from "./SpeechSynthesisRequestInputStream.js";

/**
 * Represents a speech synthesis request with support for text streaming.
 * Note: This class is in preview and may be subject to change in future versions.
 * @class SpeechSynthesisRequest
 */
export class SpeechSynthesisRequest {
    private privInputType: SpeechSynthesisRequestInputType;
    private privInputStream: SpeechSynthesisRequestInputStream;
    private privProperties: PropertyCollection;
    private privTextPieceCallback: (text: string) => void;
    private privStreamCloseCallback: () => void;
    private privBufferedTextPieces: string[] = [];
    private privStreamClosedBeforeReady: boolean = false;

    /**
     * Creates a speech synthesis request.
     * @param inputType The input type for the speech synthesis request.
     */
    public constructor(inputType: SpeechSynthesisRequestInputType) {
        if (inputType !== SpeechSynthesisRequestInputType.TextStream) {
            throw new Error("Only TextStream input type is supported in this version.");
        }
        this.privInputType = inputType;
        this.privInputStream = new SpeechSynthesisRequestInputStream(this);
        this.privProperties = new PropertyCollection();
    }

    /**
     * Gets the input type of this request.
     */
    public get inputType(): SpeechSynthesisRequestInputType {
        return this.privInputType;
    }

    /**
     * Gets the input stream for writing text pieces.
     */
    public get inputStream(): SpeechSynthesisRequestInputStream {
        return this.privInputStream;
    }

    /**
     * Gets the properties collection for this request.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Sets the pitch of the voice.
     */
    public set pitch(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_Pitch, value);
    }

    /**
     * Sets the speaking rate of the voice.
     */
    public set rate(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_Rate, value);
    }

    /**
     * Sets the volume of the voice.
     */
    public set volume(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_Volume, value);
    }

    /**
     * Sets the style of the voice.
     */
    public set style(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_Style, value);
    }

    /**
     * Sets the temperature of the voice synthesis.
     */
    public set temperature(value: number) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_Temperature, value.toString());
    }

    /**
     * Sets the custom lexicon URL.
     */
    public set customLexiconUrl(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_CustomLexiconUrl, value);
    }

    /**
     * Sets the preferred locales for the voice.
     */
    public set preferLocales(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechSynthesisRequest_PreferLocales, value);
    }

    /**
     * @internal
     * Called by InputStream when a text piece is written.
     * Buffers text if no callback is registered yet.
     */
    public onTextPieceReceived(text: string): void {
        if (this.privTextPieceCallback) {
            this.privTextPieceCallback(text);
        } else {
            this.privBufferedTextPieces.push(text);
        }
    }

    /**
     * @internal
     * Called by InputStream when it is closed.
     * Buffers close event if no callback is registered yet.
     */
    public onInputStreamClosed(): void {
        if (this.privStreamCloseCallback) {
            this.privStreamCloseCallback();
        } else {
            this.privStreamClosedBeforeReady = true;
        }
    }

    /**
     * @internal
     * Sets the callback for receiving text pieces.
     * Flushes any buffered text pieces immediately.
     */
    public set onTextPiece(callback: (text: string) => void) {
        this.privTextPieceCallback = callback;
        // Flush buffered text pieces
        for (const text of this.privBufferedTextPieces) {
            callback(text);
        }
        this.privBufferedTextPieces = [];
    }

    /**
     * @internal
     * Sets the callback for stream close events.
     * Fires immediately if stream was already closed.
     */
    public set onClose(callback: () => void) {
        this.privStreamCloseCallback = callback;
        // Fire if stream was already closed before callback was set
        if (this.privStreamClosedBeforeReady) {
            this.privStreamClosedBeforeReady = false;
            callback();
        }
    }
}
