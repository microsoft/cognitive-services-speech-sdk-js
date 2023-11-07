// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import {Contracts} from "./Contracts.js";
import {
    PropertyId,
    RecognitionResult
} from "./Exports.js";

interface AssessmentResult {
    NBest: DetailResult[];
}

interface DetailResult {
    Words: WordResult[];
    PronunciationAssessment: {
        AccuracyScore: number;
        CompletenessScore: number;
        FluencyScore: number;
        PronScore: number;
        ProsodyScore: number;
    };
    ContentAssessment: {
        GrammarScore: number;
        VocabularyScore: number;
        TopicScore: number;
    };
}

interface WordResult {
    Word: string;
    Phonemes: {
        Phoneme?: string;
        PronunciationAssessment?: {
            NBestPhonemes: { Phoneme: string }[];
        };
     }[];
    PronunciationAssessment?: {
        AccuracyScore: number;
        ErrorType: string;
    };
    Syllables: { Syllable: string }[];
}

export class ContentAssessmentResult {
    private privPronJson: DetailResult;

    /**
     * @Internal
     * Do not use externally.
     */
    public constructor(detailResult: DetailResult) {
        this.privPronJson = detailResult;
    }

    /**
     * Correctness in using grammar and variety of sentence patterns.
     * Grammatical errors are jointly evaluated by lexical accuracy,
     * grammatical accuracy and diversity of sentence structures.
     * @member ContentAssessmentResult.prototype.grammarScore
     * @function
     * @public
     * @returns {number} Grammar score.
     */
    public get grammarScore(): number {
        return this.privPronJson.ContentAssessment.GrammarScore;
    }

    /**
     * Proficiency in lexical usage. It evaluates the speaker's effective usage
     * of words and their appropriateness within the given context to express
     * ideas accurately, as well as level of lexical complexity.
     * @member ContentAssessmentResult.prototype.vocabularyScore
     * @function
     * @public
     * @returns {number} Vocabulary score.
     */
    public get vocabularyScore(): number {
        return this.privPronJson.ContentAssessment.VocabularyScore;
    }

    /**
     * Level of understanding and engagement with the topic, which provides
     * insights into the speaker’s ability to express their thoughts and ideas
     * effectively and the ability to engage with the topic.
     * @member ContentAssessmentResult.prototype.topicScore
     * @function
     * @public
     * @returns {number} Topic score.
     */
    public get topicScore(): number {
        return this.privPronJson.ContentAssessment.TopicScore;
    }
}

/**
 * Pronunciation assessment results.
 * @class PronunciationAssessmentResult
 * Added in version 1.15.0.
 */
export class PronunciationAssessmentResult {
    private privPronJson: DetailResult;

    private constructor(jsonString: string) {
        const j = JSON.parse(jsonString) as AssessmentResult;
        Contracts.throwIfNullOrUndefined(j.NBest[0], "NBest");
        this.privPronJson = j.NBest[0];
    }

    /**
     * @member PronunciationAssessmentResult.fromResult
     * @function
     * @public
     * @param {RecognitionResult} result The recognition result.
     * @return {PronunciationAssessmentConfig} Instance of PronunciationAssessmentConfig
     * @summary Creates an instance of the PronunciationAssessmentResult from recognition result.
     */
    public static fromResult(result: RecognitionResult): PronunciationAssessmentResult {
        Contracts.throwIfNullOrUndefined(result, "result");
        const json: string = result.properties.getProperty(PropertyId.SpeechServiceResponse_JsonResult);
        Contracts.throwIfNullOrUndefined(json, "json");
        return new PronunciationAssessmentResult(json);
    }

    /**
     * Gets the detail result of pronunciation assessment.
     * @member PronunciationAssessmentConfig.prototype.detailResult
     * @function
     * @public
     * @returns {DetailResult} detail result.
     */
    public get detailResult(): DetailResult {
        return this.privPronJson;
    }

    /**
     * The score indicating the pronunciation accuracy of the given speech, which indicates
     * how closely the phonemes match a native speaker's pronunciation.
     * @member PronunciationAssessmentResult.prototype.accuracyScore
     * @function
     * @public
     * @returns {number} Accuracy score.
     */
    public get accuracyScore(): number {
        return this.detailResult.PronunciationAssessment?.AccuracyScore;
    }

    /**
     * The overall score indicating the pronunciation quality of the given speech.
     * This is calculated from AccuracyScore, FluencyScore and CompletenessScore with weight.
     * @member PronunciationAssessmentResult.prototype.pronunciationScore
     * @function
     * @public
     * @returns {number} Pronunciation score.
     */
    public get pronunciationScore(): number {
        return this.detailResult.PronunciationAssessment?.PronScore;
    }

    /**
     * The score indicating the completeness of the given speech by calculating the ratio of pronounced words towards entire input.
     * @member PronunciationAssessmentResult.prototype.completenessScore
     * @function
     * @public
     * @returns {number} Completeness score.
     */
    public get completenessScore(): number {
        return this.detailResult.PronunciationAssessment?.CompletenessScore;
    }

    /**
     * The score indicating the fluency of the given speech.
     * @member PronunciationAssessmentResult.prototype.fluencyScore
     * @function
     * @public
     * @returns {number} Fluency score.
     */
    public get fluencyScore(): number {
        return this.detailResult.PronunciationAssessment?.FluencyScore;
    }

    /**
     * The prosody score, which indicates how nature of the given speech, including stress, intonation, speaking speed and rhythm.
     * @member PronunciationAssessmentResult.prototype.prosodyScore
     * @function
     * @public
     * @returns {number} Prosody score.
     */
    public get prosodyScore(): number {
        return this.detailResult.PronunciationAssessment?.ProsodyScore;
    }

    /**
     * The concent assessment result.
     * Only available when content assessment is enabled.
     * @member PronunciationAssessmentResult.prototype.contentAssessmentResult
     * @function
     * @public
     * @returns {ContentAssessmentResult} Content assessment result.
     */
    public get contentAssessmentResult(): ContentAssessmentResult {
        if (this.detailResult.ContentAssessment === undefined) {
            return undefined;
        }
        return new ContentAssessmentResult(this.detailResult);
    }
}
