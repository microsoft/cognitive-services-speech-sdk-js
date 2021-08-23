// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IMetric, ITelemetry } from "../src/common.speech/ServiceTelemetryListener.Internal";
import { IStringDictionary } from "../src/common/IDictionary";

export const validateTelemetry: (json: string, numPhrases: number, numHypothesis: number) => void = (json: string, numPhrases: number, numHypothesis: number): void => {
    const telemetryMessage: ITelemetry = JSON.parse(json);

    if (0 < numPhrases) {
        let phrases: string[] = telemetryMessage.ReceivedMessages["speech.phrase"];
        if (undefined === phrases) {
            phrases = telemetryMessage.ReceivedMessages["translation.phrase"] ? telemetryMessage.ReceivedMessages["translation.phrase"] : telemetryMessage.ReceivedMessages["translation.response"];
        }
        expect(phrases).not.toBeUndefined();
        expect(phrases.length).toEqual(numPhrases);
    }

    if (0 < numHypothesis) {
        let hypothesis: string[] = telemetryMessage.ReceivedMessages["speech.hypothesis"];
        if (undefined === hypothesis) {
            hypothesis = telemetryMessage.ReceivedMessages["translation.hypothesis"];
        }
        expect(hypothesis.length).toEqual(numHypothesis);
    }

    let foundPhrases: number = 0;
    for (const metric of telemetryMessage.Metrics) {
        if (metric.PhraseLatencyMs !== undefined) {
            foundPhrases++;
            // For continuous recognition tests silence at the end my produce no last phrase.
            expect(metric.PhraseLatencyMs.length).toBeLessThanOrEqual(numPhrases);
            expect(metric.PhraseLatencyMs.length).toBeGreaterThanOrEqual(numPhrases - 1);
        }
    }

    expect(foundPhrases).toEqual(numPhrases === 0 ? 0 : 1);

    let foundHypothesis: number = 0;
    for (const metric of telemetryMessage.Metrics) {
        if (metric.FirstHypothesisLatencyMs !== undefined) {
            foundHypothesis++;

            // For continuous recognition tests silence at the end my produce no hypothesis.
            expect(metric.FirstHypothesisLatencyMs.length).toBeLessThanOrEqual(numPhrases);
            expect(metric.FirstHypothesisLatencyMs.length).toBeGreaterThanOrEqual(numPhrases - 1);
        }
    }

    expect(foundHypothesis).toEqual(numPhrases === 0 ? 0 : 1);
};
