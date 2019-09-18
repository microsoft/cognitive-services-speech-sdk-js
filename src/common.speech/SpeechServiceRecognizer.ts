// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IAudioSource } from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechRecognizer,
} from "../sdk/Exports";
import {
    CancellationErrorCodePropertyName,
    DetailedSpeechPhrase,
    EnumTranslation,
    OutputFormatPropertyName,
    RecognitionStatus,
    RequestSession,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechHypothesis,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

// tslint:disable-next-line:max-classes-per-file
export class SpeechServiceRecognizer extends ServiceRecognizerBase {

    private privSpeechRecognizer: SpeechRecognizer;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        speechRecognizer: SpeechRecognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, speechRecognizer);
        this.privSpeechRecognizer = speechRecognizer;
    }

    protected processTypeSpecificMessages(
        connectionMessage: SpeechConnectionMessage,
        successCallback?: (e: SpeechRecognitionResult) => void,
        errorCallBack?: (e: string) => void): void {

        let result: SpeechRecognitionResult;
        const resultProps: PropertyCollection = new PropertyCollection();
        resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
            case "speech.fragment":
                const hypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(connectionMessage.textBody);
                const offset: number = hypothesis.Offset + this.privRequestSession.currentTurnAudioOffset;

                result = new SpeechRecognitionResult(
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingSpeech,
                    hypothesis.Text,
                    hypothesis.Duration,
                    offset,
                    undefined,
                    connectionMessage.textBody,
                    resultProps);

                this.privRequestSession.onHypothesis(offset);

                const ev = new SpeechRecognitionEventArgs(result, hypothesis.Duration, this.privRequestSession.sessionId);

                if (!!this.privSpeechRecognizer.recognizing) {
                    try {
                        this.privSpeechRecognizer.recognizing(this.privSpeechRecognizer, ev);
                        /* tslint:disable:no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "speech.phrase":
                const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);
                const resultReason: ResultReason = EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);

                this.privRequestSession.onPhraseRecognized(this.privRequestSession.currentTurnAudioOffset + simple.Offset + simple.Duration);

                if (ResultReason.Canceled === resultReason) {
                    const cancelReason: CancellationReason = EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);

                    this.cancelRecognitionLocal(
                        cancelReason,
                        EnumTranslation.implTranslateCancelErrorCode(simple.RecognitionStatus),
                        undefined,
                        successCallback);

                } else {
                    if (!(this.privRequestSession.isSpeechEnded && resultReason === ResultReason.NoMatch && simple.RecognitionStatus !== RecognitionStatus.InitialSilenceTimeout)) {
                        if (this.privRecognizerConfig.parameters.getProperty(OutputFormatPropertyName) === OutputFormat[OutputFormat.Simple]) {
                            result = new SpeechRecognitionResult(
                                this.privRequestSession.requestId,
                                resultReason,
                                simple.DisplayText,
                                simple.Duration,
                                simple.Offset + this.privRequestSession.currentTurnAudioOffset,
                                undefined,
                                connectionMessage.textBody,
                                resultProps);
                        } else {
                            const detailed: DetailedSpeechPhrase = DetailedSpeechPhrase.fromJSON(connectionMessage.textBody);

                            result = new SpeechRecognitionResult(
                                this.privRequestSession.requestId,
                                resultReason,
                                detailed.RecognitionStatus === RecognitionStatus.Success ? detailed.NBest[0].Display : undefined,
                                detailed.Duration,
                                detailed.Offset + this.privRequestSession.currentTurnAudioOffset,
                                undefined,
                                connectionMessage.textBody,
                                resultProps);
                        }

                        const event: SpeechRecognitionEventArgs = new SpeechRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                        if (!!this.privSpeechRecognizer.recognized) {
                            try {
                                this.privSpeechRecognizer.recognized(this.privSpeechRecognizer, event);
                                /* tslint:disable:no-empty */
                            } catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                    }
                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(result);
                        } catch (e) {
                            if (!!errorCallBack) {
                                errorCallBack(e);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        successCallback = undefined;
                        errorCallBack = undefined;
                    }
                }

                break;
            default:
                break;
        }
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string,
        cancelRecoCallback: (e: SpeechRecognitionResult) => void): void {

        const properties: PropertyCollection = new PropertyCollection();
        properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

        if (!!this.privSpeechRecognizer.canceled) {
            const cancelEvent: SpeechRecognitionCanceledEventArgs = new SpeechRecognitionCanceledEventArgs(
                cancellationReason,
                error,
                errorCode,
                undefined,
                sessionId);
            try {
                this.privSpeechRecognizer.canceled(this.privSpeechRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            } catch { }
        }

        if (!!cancelRecoCallback) {
            const result: SpeechRecognitionResult = new SpeechRecognitionResult(
                requestId,
                ResultReason.Canceled,
                undefined, // Text
                undefined, // Druation
                undefined, // Offset
                error,
                undefined, // Json
                properties);
            try {
                cancelRecoCallback(result);
                /* tslint:disable:no-empty */
            } catch { }
        }
    }
}
