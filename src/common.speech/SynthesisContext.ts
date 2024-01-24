// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat.js";
import { PropertyId, SpeechSynthesizer } from "../sdk/Exports.js";

/**
 * Represents the JSON used in the synthesis.context message sent to the speech service.
 * The dynamic grammar is always refreshed from the encapsulated dynamic grammar object.
 */
export class SynthesisContext {
    private privContext: { [section: string]: any } = {};
    private privAudioOutputFormat: AudioOutputFormatImpl;

    /**
     * Adds a section to the synthesis.context object.
     * @param sectionName Name of the section to add.
     * @param value JSON serializable object that represents the value.
     */
    public setSection(sectionName: string, value: string | object): void {
        this.privContext[sectionName] = value;
    }

    /**
     * Sets the audio output format for synthesis context generation.
     * @param format {AudioOutputFormatImpl} the output format
     */
    public set audioOutputFormat(format: AudioOutputFormatImpl) {
        this.privAudioOutputFormat = format;
    }

    public toJSON(): string {
        return JSON.stringify(this.privContext);
    }

    public setSynthesisSection(speechSynthesizer: SpeechSynthesizer): void {
        const synthesisSection: ISynthesisSection = this.buildSynthesisContext(speechSynthesizer);
        this.setSection("synthesis", synthesisSection);
    }

    private buildSynthesisContext(speechSynthesizer: SpeechSynthesizer): ISynthesisSection {
        return {
            audio: {
                metadataOptions: {
                    bookmarkEnabled: (!!speechSynthesizer?.bookmarkReached),
                    punctuationBoundaryEnabled: speechSynthesizer?.properties.getProperty(
                        PropertyId.SpeechServiceResponse_RequestPunctuationBoundary, (!!speechSynthesizer?.wordBoundary)),
                    sentenceBoundaryEnabled: speechSynthesizer?.properties.getProperty(
                        PropertyId.SpeechServiceResponse_RequestSentenceBoundary, false),
                    sessionEndEnabled: true,
                    visemeEnabled: (!!speechSynthesizer?.visemeReceived),
                    wordBoundaryEnabled: speechSynthesizer?.properties.getProperty(
                        PropertyId.SpeechServiceResponse_RequestWordBoundary, (!!speechSynthesizer?.wordBoundary)),
                },
                outputFormat: this.privAudioOutputFormat.requestAudioFormatString,
            },
            language: {
                autoDetection: speechSynthesizer?.autoDetectSourceLanguage
            }
        } as ISynthesisSection;
    }
}

interface ISynthesisSection {
    audio: {
        outputFormat: string;
        metadataOptions: {
            bookmarkEnabled: boolean;
            wordBoundaryEnabled: string;
            punctuationBoundaryEnabled: string;
            visemeEnabled: boolean;
            sentenceBoundaryEnabled: string;
            sessionEndEnabled: boolean;
        };
    };
    language: {
        autoDetection: boolean;
    };
}
