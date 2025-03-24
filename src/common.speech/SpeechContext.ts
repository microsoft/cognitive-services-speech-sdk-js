// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    DynamicGrammarBuilder,
} from "./Exports.js";
import { Dgi } from "./ServiceMessages/Dgi/Dgi.js";
import { RecognitionMode } from "./ServiceMessages/PhraseDetection/PhraseDetectionContext.js";
import { OutputFormat, PhraseOption } from "./ServiceMessages/PhraseOutput/PhraseOutput.js";
import { PronunciationAssessmentOptions } from "./ServiceMessages/PronunciationScore/PronunciationAssessmentOptions.js";

import { SpeechContext as SpeechServiceContext } from "./ServiceMessages/SpeechContext.js";

/**
 * Represents the JSON used in the speech.context message sent to the speech service.
 * The dynamic grammar is always refreshed from the encapsulated dynamic grammar object.
 */
export class SpeechContext {
    private privContext: SpeechServiceContext = {};
    private privDynamicGrammar: DynamicGrammarBuilder;

    public constructor(dynamicGrammar: DynamicGrammarBuilder) {
        this.privDynamicGrammar = dynamicGrammar;
    }

    public getContext(): SpeechServiceContext {
        return this.privContext;
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
        this.privContext.phraseDetection.enrichment.pronunciationAssessment = JSON.parse(params) as PronunciationAssessmentOptions || {};
        if (isSpeakerDiarizationEnabled) {
            this.privContext.phraseDetection.mode = RecognitionMode.Conversation;
        }
        this.setWordLevelTimings();
        this.privContext.phraseOutput.detailed.options.push(PhraseOption.PronunciationAssessment);
        if (this.privContext.phraseOutput.detailed.options.indexOf(PhraseOption.SNR) === -1) {
            this.privContext.phraseOutput.detailed.options.push(PhraseOption.SNR);
        }
        if (!!contentAssessmentTopic) {
            this.privContext.phraseDetection.enrichment.contentAssessment = {
                topic: contentAssessmentTopic
            };
            this.privContext.phraseOutput.detailed.options.push(PhraseOption.ContentAssessment);
        }
    }

    public setDetailedOutputFormat(): void {
        if (this.privContext.phraseOutput === undefined) {
            this.privContext.phraseOutput = {
                detailed: {
                    options: []
                }
            };
        }
        if (this.privContext.phraseOutput.detailed === undefined) {
            this.privContext.phraseOutput.detailed = {
                options: []
            };
        }
        this.privContext.phraseOutput.format = OutputFormat.Detailed;
    }

    public setWordLevelTimings(): void {
        if (this.privContext.phraseOutput === undefined) {
            this.privContext.phraseOutput = {
                detailed: {
                    options: []
                }
            };
        }
        if (this.privContext.phraseOutput.detailed === undefined) {
            this.privContext.phraseOutput.detailed = {
                options: []
            };
        }
        this.privContext.phraseOutput.format = OutputFormat.Detailed;
        if (this.privContext.phraseOutput.detailed.options.indexOf(PhraseOption.WordTimings) === -1) {
            this.privContext.phraseOutput.detailed.options.push(PhraseOption.WordTimings);
        }
    }

    public setSpeakerDiarizationAudioOffsetMs(audioOffsetMs: number): void {
        this.privContext.phraseDetection.speakerDiarization.audioOffsetMs = audioOffsetMs;
    }

    public toJSON(): string {

        const dgi: Dgi = this.privDynamicGrammar.generateGrammarObject();
        this.privContext.dgi = dgi;

        const ret: string = JSON.stringify(this.privContext);
        return ret;
    }
}
