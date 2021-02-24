// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ServiceRecognizerBase } from "../common.speech/ServiceRecognizerBase";
import { Contracts } from "./Contracts";
import {
    PronunciationAssessmentGradingSystem,
    PronunciationAssessmentGranularity,
    PropertyCollection,
    PropertyId,
    Recognizer
} from "./Exports";

/**
 * Pronunciation assessment configuration.
 * @class PronunciationAssessmentConfig
 * Added in version 1.15.0.
 */
export class PronunciationAssessmentConfig {
    private privProperties: PropertyCollection;

    /**
     * PronunciationAssessmentConfig constructor.
     * @constructor
     * @param {string} referenceText
     * @param gradingSystem
     * @param granularity
     * @param enableMiscue
     */
    public constructor(referenceText: string,
                       gradingSystem: PronunciationAssessmentGradingSystem = PronunciationAssessmentGradingSystem.FivePoint,
                       granularity: PronunciationAssessmentGranularity = PronunciationAssessmentGranularity.Phoneme,
                       enableMiscue: boolean = false) {
        Contracts.throwIfNullOrUndefined(referenceText, "referenceText");
        this.privProperties = new PropertyCollection();
        this.privProperties.setProperty(PropertyId.PronunciationAssessment_ReferenceText, referenceText);
        this.privProperties.setProperty(PropertyId.PronunciationAssessment_GradingSystem, PronunciationAssessmentGradingSystem[gradingSystem]);
        this.privProperties.setProperty(PropertyId.PronunciationAssessment_Granularity, PronunciationAssessmentGranularity[granularity]);
        this.privProperties.setProperty(PropertyId.PronunciationAssessment_EnableMiscue, String(enableMiscue));
    }

    /**
     * @member PronunciationAssessmentConfig.fromJSON
     * @function
     * @public
     * @param {string} json The json string containing the pronunciation assessment parameters.
     * @return {PronunciationAssessmentConfig} Instance of PronunciationAssessmentConfig
     * @summary Creates an instance of the PronunciationAssessmentConfig from json.
     */
    public static fromJSON(json: string): PronunciationAssessmentConfig {
        Contracts.throwIfNullOrUndefined(json, "json");
        const config = new PronunciationAssessmentConfig("");
        config.privProperties = new PropertyCollection();
        config.properties.setProperty(PropertyId.PronunciationAssessment_Json, json);
        return config;
    }

    public toJSON(): string {
        this.updateJson();
        return this.privProperties.getProperty(PropertyId.PronunciationAssessment_Params);
    }

    public applyTo(recognizer: Recognizer): void {
        this.updateJson();
        const recoBase = recognizer.internalData as ServiceRecognizerBase;
        recoBase.speechContext.setPronunciationAssessmentParams(this.properties.getProperty(PropertyId.PronunciationAssessment_Params));
    }

    /**
     * Gets the reference text.
     * @member PronunciationAssessmentConfig.prototype.referenceText
     * @function
     * @public
     * @returns {string} Reference text.
     */
    public get referenceText(): string {
        return this.properties.getProperty(PropertyId.PronunciationAssessment_ReferenceText);
    }

    /**
     * Gets/Sets the reference text.
     * @member PronunciationAssessmentConfig.prototype.referenceText
     * @function
     * @public
     * @param {string} referenceText - Reference text.
     */
    public set referenceText(referenceText: string) {
        Contracts.throwIfNullOrWhitespace(referenceText, "referenceText");
        this.properties.setProperty(PropertyId.PronunciationAssessment_ReferenceText, referenceText);
    }

    /**
     * @member PronunciationAssessmentConfig.prototype.properties
     * @function
     * @public
     * @return {PropertyCollection} Properties of the config.
     * @summary Gets a pronunciation assessment config properties
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    private updateJson(): void {
        const jsonString = this.privProperties.getProperty(PropertyId.PronunciationAssessment_Json, "{}");
        const paramsJson = JSON.parse(jsonString);

        const referenceText = this.privProperties.getProperty(PropertyId.PronunciationAssessment_ReferenceText);
        if (referenceText) {
            paramsJson.referenceText = referenceText;
        }

        const gradingSystem = this.privProperties.getProperty(PropertyId.PronunciationAssessment_GradingSystem);
        if (gradingSystem) {
            paramsJson.gradingSystem = gradingSystem;
        }

        const granularity = this.privProperties.getProperty(PropertyId.PronunciationAssessment_Granularity);
        if (granularity) {
            paramsJson.granularity = granularity;
        }

        // always set dimension to Comprehensive
        paramsJson.dimension = "Comprehensive";

        const enableMiscueString = this.privProperties.getProperty(PropertyId.PronunciationAssessment_EnableMiscue);
        if (enableMiscueString === "true") {
            paramsJson.enableMiscue = true;
        } else if (enableMiscueString === "false") {
            paramsJson.enableMiscue = false;
        }

        this.privProperties.setProperty(PropertyId.PronunciationAssessment_Params, JSON.stringify(paramsJson));
    }

}
