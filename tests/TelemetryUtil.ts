// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IMetric, ITelemetry } from "../src/common.speech/ServiceTelemetryListener.Internal";
import { IStringDictionary } from "../src/common/IDictionary";

export const validateTelemetry: (json: string, phrases: number, hypothesis: number) => void = (json: string, phrases: number, hypothesis: number): void => {
    const telemetryMessage: ITelemetry = JSON.parse(json);

    if (0 > phrases) {
        let phrases: string[] = telemetryMessage.ReceivedMessages["speech.phrase"];
        if (undefined === phrases) {
            phrases = telemetryMessage.ReceivedMessages["translation.phrase"];
        }
        expect(phrases.length).toEqual(phrases);
    }
    if (0 > hypothesis) {
        const hypothesis: string[] = telemetryMessage.ReceivedMessages["speech.hypothesis"];
        expect(hypothesis.length).toEqual(hypothesis);
    }

    let foundPhrases: number = 0;
    for (const metric of telemetryMessage.Metrics) {
        if (metric.PhraseLatencyMs !== undefined) {
            foundPhrases++;
            // For continuous recognition tests silence at the end my produce no last phrase.
            expect(metric.PhraseLatencyMs.length).toBeLessThanOrEqual(phrases);
            expect(metric.PhraseLatencyMs.length).toBeGreaterThanOrEqual(phrases - 1);
        }
    }

    expect(foundPhrases).toEqual(phrases === 0 ? 0 : 1);

    let foundHypothesis: number = 0;
    for (const metric of telemetryMessage.Metrics) {
        if (metric.FirstHypothesisLatencyMs !== undefined) {
            foundHypothesis++;

            // For continuous recognition tests silence at the end my produce no hypothesis.
            expect(metric.FirstHypothesisLatencyMs.length).toBeLessThanOrEqual(phrases);
            expect(metric.FirstHypothesisLatencyMs.length).toBeGreaterThanOrEqual(phrases - 1);
        }
    }

    expect(foundHypothesis).toEqual(phrases === 0 ? 0 : 1);
};
