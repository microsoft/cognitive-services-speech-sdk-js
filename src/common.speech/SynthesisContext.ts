// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioOutputFormatImpl } from "../sdk/Audio/AudioOutputFormat";
import { PropertyId, SpeechSynthesizer } from "../sdk/Exports";

/**
 * Represents the JSON used in the synthesis.context message sent to the speech service.
 * The dynamic grammar is always refreshed from the encapsulated dynamic grammar object.
 */
export class SynthesisContext {
    private privContext: { [section: string]: any } = {};
    private privSpeechSynthesizer: SpeechSynthesizer;
    private privAudioOutputFormat: AudioOutputFormatImpl;

    public constructor(speechSynthesizer: SpeechSynthesizer) {
        this.privSpeechSynthesizer = speechSynthesizer;
    }

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

        const synthesisSection: ISynthesisSection = this.buildSynthesisContext();
        this.setSection("synthesis", synthesisSection);

        return JSON.stringify(this.privContext);
    }

    private buildSynthesisContext(): ISynthesisSection {
        return {
            audio: {
                metadataOptions: {
                    bookmarkEnabled: (!!this.privSpeechSynthesizer.bookmarkReached),
                    punctuationBoundaryEnabled: this.privSpeechSynthesizer.properties.getProperty(
                        PropertyId.SpeechServiceResponse_RequestPunctuationBoundary, (!!this.privSpeechSynthesizer.wordBoundary)),
                    sentenceBoundaryEnabled: this.privSpeechSynthesizer.properties.getProperty(
                        PropertyId.SpeechServiceResponse_RequestSentenceBoundary, false),
                    sessionEndEnabled: true,
                    visemeEnabled: (!!this.privSpeechSynthesizer.visemeReceived),
                    wordBoundaryEnabled: this.privSpeechSynthesizer.properties.getProperty(
                        PropertyId.SpeechServiceResponse_RequestWordBoundary, (!!this.privSpeechSynthesizer.wordBoundary)),
                },
                outputFormat: this.privAudioOutputFormat.requestAudioFormatString,
            },
            language: {
                autoDetection: this.privSpeechSynthesizer.autoDetectSourceLanguage
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
