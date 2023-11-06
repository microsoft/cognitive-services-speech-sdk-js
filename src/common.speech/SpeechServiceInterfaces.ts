// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { RecognitionCompletionStatus } from "../../src/common.speech/Exports.js";
import { TranslationStatus } from "./TranslationStatus.js";

export interface ITranslations {
    TranslationStatus: TranslationStatus;
    Translations: ITranslation[];
    FailureReason: string;
}

export interface ITranslation {
    Language: string;
    Text?: string;
    DisplayText?: string;
}

export interface ISpeechEndDetectedResult {
    Offset?: number;
}

// turn.start
export interface ITurnStart {
    context: ITurnStartContext;
}

export interface ITurnStartContext {
    serviceTag: string;
}

export interface IResultErrorDetails {
    errorText: string;
    recogSate: RecognitionCompletionStatus;
}
