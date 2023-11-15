// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    CancellationErrorCode,
    CancellationReason,
    ResultReason
} from "../sdk/Exports.js";
import { RecognitionStatus } from "./Exports.js";

export class EnumTranslation {
    public static implTranslateRecognitionResult(recognitionStatus: RecognitionStatus, expectEndOfDictation: boolean = false): ResultReason {
        let reason = ResultReason.Canceled;
        switch (recognitionStatus) {
            case RecognitionStatus.Success:
                reason = ResultReason.RecognizedSpeech;
                break;
            case RecognitionStatus.EndOfDictation:
                // If we need the result in EndOfDictation (typically some session level result),
                // translate into RecognizedSpeech, otherwise NoMatch
                reason = expectEndOfDictation ? ResultReason.RecognizedSpeech : ResultReason.NoMatch;
                break;
            case RecognitionStatus.NoMatch:
            case RecognitionStatus.InitialSilenceTimeout:
            case RecognitionStatus.BabbleTimeout:
                reason = ResultReason.NoMatch;
                break;
            case RecognitionStatus.Error:
            case RecognitionStatus.BadRequest:
            case RecognitionStatus.Forbidden:
            default:
                reason = ResultReason.Canceled;
                break;
        }
        return reason;
    }

    public static implTranslateCancelResult(recognitionStatus: RecognitionStatus): CancellationReason {
        let reason = CancellationReason.EndOfStream;
        switch (recognitionStatus) {
            case RecognitionStatus.Success:
            case RecognitionStatus.EndOfDictation:
            case RecognitionStatus.NoMatch:
                reason = CancellationReason.EndOfStream;
                break;
            case RecognitionStatus.InitialSilenceTimeout:
            case RecognitionStatus.BabbleTimeout:
            case RecognitionStatus.Error:
            case RecognitionStatus.BadRequest:
            case RecognitionStatus.Forbidden:
            default:
                reason = CancellationReason.Error;
                break;
        }
        return reason;
    }

    public static implTranslateCancelErrorCode(recognitionStatus: RecognitionStatus): CancellationErrorCode {
        let reason: CancellationErrorCode = CancellationErrorCode.NoError;
        switch (recognitionStatus) {
            case RecognitionStatus.Error:
                reason = CancellationErrorCode.ServiceError;
                break;
            case RecognitionStatus.TooManyRequests:
                reason = CancellationErrorCode.TooManyRequests;
                break;
            case RecognitionStatus.BadRequest:
                reason = CancellationErrorCode.BadRequestParameters;
                break;
            case RecognitionStatus.Forbidden:
                reason = CancellationErrorCode.Forbidden;
                break;
            default:
                reason = CancellationErrorCode.NoError;
                break;
        }

        return reason;

    }

    public static implTranslateErrorDetails(cancellationErrorCode: CancellationErrorCode): string {
        let errorDetails: string = "The speech service encountered an internal error and could not continue.";
        switch (cancellationErrorCode) {
            case CancellationErrorCode.Forbidden:
                errorDetails = "The recognizer is using a free subscription that ran out of quota.";
                break;
            case CancellationErrorCode.BadRequestParameters:
                errorDetails = "Invalid parameter or unsupported audio format in the request.";
                break;
            case CancellationErrorCode.TooManyRequests:
                errorDetails = "The number of parallel requests exceeded the number of allowed concurrent transcriptions.";
                break;
            default:
                break;
        }
        return errorDetails;
    }

}
