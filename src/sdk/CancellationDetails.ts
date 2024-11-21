// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { CancellationErrorCodePropertyName, EnumTranslation, SimpleSpeechPhrase } from "../common.speech/Exports.js";
import { CancellationDetailsBase } from "./CancellationDetailsBase.js";
import {
    CancellationErrorCode,
    CancellationReason,
    RecognitionResult,
    SpeechSynthesisResult
} from "./Exports.js";

/**
 * Contains detailed information about why a result was canceled.
 * @class CancellationDetails
 */
export class CancellationDetails extends CancellationDetailsBase {

    private constructor(reason: CancellationReason, errorDetails: string, errorCode: CancellationErrorCode) {
        super(reason, errorDetails, errorCode);
    }

    /**
     * Creates an instance of CancellationDetails object for the canceled RecognitionResult.
     * @member CancellationDetails.fromResult
     * @function
     * @public
     * @param {RecognitionResult | SpeechSynthesisResult} result - The result that was canceled.
     * @returns {CancellationDetails} The cancellation details object being created.
     */
    public static fromResult(result: RecognitionResult | SpeechSynthesisResult): CancellationDetails {
        let reason = CancellationReason.Error;
        let errorCode: CancellationErrorCode = CancellationErrorCode.NoError;

        if (result instanceof RecognitionResult && !!result.json) {
            const simpleSpeech: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(result.json, 0); // Offset fixups are already done.
            reason = EnumTranslation.implTranslateCancelResult(simpleSpeech.RecognitionStatus);
        }

        if (!!result.properties) {
            errorCode = CancellationErrorCode[result.properties.getProperty(CancellationErrorCodePropertyName, CancellationErrorCode[CancellationErrorCode.NoError]) as keyof typeof CancellationErrorCode];
        }

        return new CancellationDetails(reason, result.errorDetails || EnumTranslation.implTranslateErrorDetails(errorCode), errorCode);
    }

}
