// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
    IDynamicGrammar,
} from "./Exports.js";

interface Context {
    [section: string]: any;
}

interface PhraseContext {
    [section: string]: any;
    phraseDetection?: {
        enrichment?: {
            pronunciationAssessment: any;
            contentAssessment?: {
                topic: string;
            };
        };
        speakerDiarization?: {
            mode?: string;
            audioSessionId?: string;
            audioOffsetMs?: number;
            identityProvider?: string;
        };
        mode?: string;
    };
    phraseOutput?: {
        detailed?: {
            options?: string[];
        };
        format?: any;
    };
}

/**
 * Represents the JSON used in the speech.context message sent to the speech service.
 * The dynamic grammar is always refreshed from the encapsulated dynamic grammar object.
 */
export class SpeechContext {
    private privContext: PhraseContext = {};
    private privDynamicGrammar: DynamicGrammarBuilder;

    public constructor(dynamicGrammar: DynamicGrammarBuilder) {
        this.privDynamicGrammar = dynamicGrammar;
    }

    /**
     * Gets a section of the speech.context object.
     * @param sectionName Name of the section to get.
     * @return string or Context JSON serializable object that represents the value.
     */
    public getSection(sectionName: string): string | Context {
        return (this.privContext[sectionName] || {}) as string | Context;
    }

    /**
     * Adds a section to the speech.context object.
     * @param sectionName Name of the section to add.
     * @param value JSON serializable object that represents the value.
     */
    public setSection(sectionName: string, value: string | Context): void {
        this.privContext[sectionName] = value;
    }

    /**
     * @Internal
     * This is only used by pronunciation assessment config.
     * Do not use externally, object returned will change without warning or notice.
     */
    public setPronunciationAssessmentParams(params: string,
        contentAssessmentTopic: string,
        isSpeakerDiarizationEnabled: boolean = false): void {
        if (this.privContext.phraseDetection === undefined) {
            this.privContext.phraseDetection = {
                enrichment: {
                    pronunciationAssessment: {}
                }
            };
        }
        if (this.privContext.phraseDetection.enrichment === undefined) {
            this.privContext.phraseDetection.enrichment = {
                pronunciationAssessment: {}
            };
        }
        this.privContext.phraseDetection.enrichment.pronunciationAssessment = JSON.parse(params) as Context;
        if (isSpeakerDiarizationEnabled) {
            this.privContext.phraseDetection.mode = "Conversation";
        }
        this.setWordLevelTimings();
        this.privContext.phraseOutput.detailed.options.push("PronunciationAssessment");
        if (this.privContext.phraseOutput.detailed.options.indexOf("SNR") === -1) {
            this.privContext.phraseOutput.detailed.options.push("SNR");
        }
        if (!!contentAssessmentTopic) {
            this.privContext.phraseDetection.enrichment.contentAssessment = {
                topic: contentAssessmentTopic
            };
            this.privContext.phraseOutput.detailed.options.push("ContentAssessment");
        }
    }

    public setDetailedOutputFormat(): void {
        if (this.privContext.phraseOutput === undefined) {
            this.privContext.phraseOutput = {
                detailed: {
                    options: []
                },
                format: {}
            };
        }
        if (this.privContext.phraseOutput.detailed === undefined) {
            this.privContext.phraseOutput.detailed = {
                options: []
            };
        }
        this.privContext.phraseOutput.format = "Detailed";
    }

    public setWordLevelTimings(): void {
        if (this.privContext.phraseOutput === undefined) {
            this.privContext.phraseOutput = {
                detailed: {
                    options: []
                },
                format: {}
            };
        }
        if (this.privContext.phraseOutput.detailed === undefined) {
            this.privContext.phraseOutput.detailed = {
                options: []
            };
        }
        this.privContext.phraseOutput.format = "Detailed";
        if (this.privContext.phraseOutput.detailed.options.indexOf("WordTimings") === -1) {
            this.privContext.phraseOutput.detailed.options.push("WordTimings");
        }
    }

    public setSpeakerDiarizationAudioOffsetMs(audioOffsetMs: number): void {
        this.privContext.phraseDetection.speakerDiarization.audioOffsetMs = audioOffsetMs;
    }

    public toJSON(): string {

        const dgi: IDynamicGrammar = this.privDynamicGrammar.generateGrammarObject();
        this.setSection("dgi", dgi);

        const ret: string = JSON.stringify(this.privContext);
        return ret;
    }
}
