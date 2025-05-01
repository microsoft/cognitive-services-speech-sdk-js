// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    Deferred,
    IAudioSource,
    MessageType,
} from "../common/Exports.js";
import {
    CancellationErrorCode,
    CancellationReason,
    IntentRecognitionCanceledEventArgs,
    IntentRecognitionEventArgs,
    IntentRecognitionResult,
    IntentRecognizer,
    PropertyCollection,
    PropertyId,
    ResultReason,
} from "../sdk/Exports.js";
import {
    AddedLmIntent,
    CancellationErrorCodePropertyName,
    EnumTranslation,
    IntentResponse,
    ServiceRecognizerBase,
    SimpleSpeechPhrase,
    SpeechHypothesis,
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";
import { IConnectionFactory } from "./IConnectionFactory.js";
import { RecognizerConfig } from "./RecognizerConfig.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

// eslint-disable-next-line max-classes-per-file
export class IntentServiceRecognizer extends ServiceRecognizerBase {
    private privIntentRecognizer: IntentRecognizer;
    private privAddedLmIntents: { [id: string]: AddedLmIntent };
    private privIntentDataSent: boolean;
    private privUmbrellaIntent: AddedLmIntent;
    private privPendingIntentArgs: IntentRecognitionEventArgs;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: IntentRecognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.privIntentRecognizer = recognizer;
        this.privIntentDataSent = false;
        recognizerConfig.recognitionEndpointVersion = "1";
    }

    public setIntents(addedIntents: { [id: string]: AddedLmIntent }, umbrellaIntent: AddedLmIntent): void {
        this.privAddedLmIntents = addedIntents;
        this.privUmbrellaIntent = umbrellaIntent;
        this.privIntentDataSent = true;
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let result: IntentRecognitionResult;
        let ev: IntentRecognitionEventArgs;
        let processed: boolean = false;

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
                const speechHypothesis: SpeechHypothesis = SpeechHypothesis.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);

                result = new IntentRecognitionResult(
                    undefined,
                    this.privRequestSession.requestId,
                    ResultReason.RecognizingIntent,
                    speechHypothesis.Text,
                    speechHypothesis.Duration,
                    speechHypothesis.Offset,
                    speechHypothesis.Language,
                    speechHypothesis.LanguageDetectionConfidence,
                    undefined,
                    speechHypothesis.asJson(),
                    resultProps);

                this.privRequestSession.onHypothesis(result.offset);

                ev = new IntentRecognitionEventArgs(result, speechHypothesis.Offset, this.privRequestSession.sessionId);

                if (!!this.privIntentRecognizer.recognizing) {
                    try {
                        this.privIntentRecognizer.recognizing(this.privIntentRecognizer, ev);
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                processed = true;
                break;
            case "speech.phrase":
                const simple: SimpleSpeechPhrase = SimpleSpeechPhrase.fromJSON(connectionMessage.textBody, this.privRequestSession.currentTurnAudioOffset);
                result = new IntentRecognitionResult(
                    undefined,
                    this.privRequestSession.requestId,
                    EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus),
                    simple.DisplayText,
                    simple.Duration,
                    simple.Offset,
                    simple.Language,
                    simple.LanguageDetectionConfidence,
                    undefined,
                    simple.asJson(),
                    resultProps);

                ev = new IntentRecognitionEventArgs(result, result.offset, this.privRequestSession.sessionId);

                const sendEvent: () => void = (): void => {
                    if (!!this.privIntentRecognizer.recognized) {
                        try {
                            this.privIntentRecognizer.recognized(this.privIntentRecognizer, ev);
                            /* eslint-disable no-empty */
                        } catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }

                    // report result to promise.
                    if (!!this.privSuccessCallback) {
                        try {
                            this.privSuccessCallback(result);
                        } catch (e) {
                            if (!!this.privErrorCallback) {
                                this.privErrorCallback(e as string);
                            }
                        }
                        // Only invoke the call back once.
                        // and if it's successful don't invoke the
                        // error after that.
                        this.privSuccessCallback = undefined;
                        this.privErrorCallback = undefined;
                    }
                };

                // If intent data was sent, the terminal result for this recognizer is an intent being found.
                // If no intent data was sent, the terminal event is speech recognition being successful.
                if (false === this.privIntentDataSent || ResultReason.NoMatch === ev.result.reason) {
                    // Advance the buffers.
                    this.privRequestSession.onPhraseRecognized(ev.offset + ev.result.duration);
                    sendEvent();
                } else {
                    // Squirrel away the args, when the response event arrives it will build upon them
                    // and then return
                    this.privPendingIntentArgs = ev;
                }
                processed = true;
                break;
            case "response":
                // Response from LUIS
                ev = this.privPendingIntentArgs;
                this.privPendingIntentArgs = undefined;

                if (undefined === ev) {
                    if ("" === connectionMessage.textBody) {
                        // This condition happens if there is nothing but silence in the
                        // audio sent to the service.
                        return;
                    }

                    // Odd... Not sure this can happen
                    ev = new IntentRecognitionEventArgs(new IntentRecognitionResult(), 0, this.privRequestSession.sessionId);
                }

                const intentResponse: IntentResponse = IntentResponse.fromJSON(connectionMessage.textBody);

                // If LUIS didn't return anything, send the existing event, else
                // modify it to show the match.
                // See if the intent found is in the list of intents asked for.

                if (null !== intentResponse && !!intentResponse.topScoringIntent && !!intentResponse.topScoringIntent.intent) {
                    let addedIntent: AddedLmIntent = this.privAddedLmIntents[intentResponse.topScoringIntent.intent];

                    if (this.privUmbrellaIntent !== undefined) {
                        addedIntent = this.privUmbrellaIntent;
                    }

                    if (!!addedIntent) {
                        const intentId = addedIntent === undefined || addedIntent.intentName === undefined ? intentResponse.topScoringIntent.intent : addedIntent.intentName;
                        let reason = ev.result.reason;

                        if (undefined !== intentId) {
                            reason = ResultReason.RecognizedIntent;
                        }

                        // make sure, properties is set.
                        const properties = (undefined !== ev.result.properties) ?
                            ev.result.properties : new PropertyCollection();

                        properties.setProperty(PropertyId.LanguageUnderstandingServiceResponse_JsonResult, connectionMessage.textBody);

                        ev = new IntentRecognitionEventArgs(
                            new IntentRecognitionResult(
                                intentId,
                                ev.result.resultId,
                                reason,
                                ev.result.text,
                                ev.result.duration,
                                ev.result.offset,
                                undefined,
                                undefined,
                                ev.result.errorDetails,
                                ev.result.json,
                                properties),
                            ev.offset,
                            ev.sessionId);

                    }
                }
                this.privRequestSession.onPhraseRecognized(ev.offset + ev.result.duration);

                if (!!this.privIntentRecognizer.recognized) {
                    try {
                        this.privIntentRecognizer.recognized(this.privIntentRecognizer, ev);
                        /* eslint-disable no-empty */
                    } catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }

                // report result to promise.
                if (!!this.privSuccessCallback) {
                    try {
                        this.privSuccessCallback(ev.result);
                    } catch (e) {
                        if (!!this.privErrorCallback) {
                            this.privErrorCallback(e as string);
                        }
                    }
                    // Only invoke the call back once.
                    // and if it's successful don't invoke the
                    // error after that.
                    this.privSuccessCallback = undefined;
                    this.privErrorCallback = undefined;
                }
                processed = true;
                break;
            default:
                break;
        }
        const defferal = new Deferred<boolean>();
        defferal.resolve(processed);
        return defferal.promise;
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {

        const properties: PropertyCollection = new PropertyCollection();
        properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

        if (!!this.privIntentRecognizer.canceled) {

            const cancelEvent: IntentRecognitionCanceledEventArgs = new IntentRecognitionCanceledEventArgs(
                cancellationReason,
                error,
                errorCode,
                undefined,
                undefined,
                sessionId);
            try {
                this.privIntentRecognizer.canceled(this.privIntentRecognizer, cancelEvent);
                /* eslint-disable no-empty */
            } catch { }
        }

        if (!!this.privSuccessCallback) {
            const result: IntentRecognitionResult = new IntentRecognitionResult(
                undefined, // Intent Id
                requestId,
                ResultReason.Canceled,
                undefined, // Text
                undefined, // Duration
                undefined, // Offset
                undefined, // Language
                undefined, // LanguageDetectionConfidence
                error,
                undefined, // Json
                properties);
            try {
                this.privSuccessCallback(result);
                this.privSuccessCallback = undefined;
                /* eslint-disable no-empty */
            } catch { }
        }
    }
}
