"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../sdk/Exports");
var Exports_2 = require("./Exports");
// tslint:disable-next-line:max-classes-per-file
var IntentServiceRecognizer = /** @class */ (function (_super) {
    __extends(IntentServiceRecognizer, _super);
    function IntentServiceRecognizer(authentication, connectionFactory, audioSource, recognizerConfig, recognizer, intentDataSent) {
        var _this = _super.call(this, authentication, connectionFactory, audioSource, recognizerConfig, recognizer) || this;
        _this.privIntentRecognizer = recognizer;
        _this.privIntentDataSent = intentDataSent;
        return _this;
    }
    IntentServiceRecognizer.prototype.setIntents = function (addedIntents, umbrellaIntent) {
        this.privAddedLmIntents = addedIntents;
        this.privUmbrellaIntent = umbrellaIntent;
    };
    IntentServiceRecognizer.prototype.processTypeSpecificMessages = function (connectionMessage, requestSession, connection, successCallback, errorCallBack) {
        var _this = this;
        var result;
        var ev;
        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
                var speechHypothesis = Exports_2.SpeechHypothesis.fromJSON(connectionMessage.textBody);
                result = new Exports_1.IntentRecognitionResult(undefined, requestSession.requestId, Exports_1.ResultReason.RecognizingIntent, speechHypothesis.Text, speechHypothesis.Duration, speechHypothesis.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                ev = new Exports_1.IntentRecognitionEventArgs(result, speechHypothesis.Offset + requestSession.currentTurnAudioOffset, requestSession.sessionId);
                if (!!this.privIntentRecognizer.recognizing) {
                    try {
                        this.privIntentRecognizer.recognizing(this.privIntentRecognizer, ev);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "speech.phrase":
                var simple = Exports_2.SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);
                result = new Exports_1.IntentRecognitionResult(undefined, requestSession.requestId, Exports_2.EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus), simple.DisplayText, simple.Duration, simple.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                ev = new Exports_1.IntentRecognitionEventArgs(result, result.offset + requestSession.currentTurnAudioOffset, requestSession.sessionId);
                var sendEvent = function () {
                    if (_this.privRecognizerConfig.isContinuousRecognition) {
                        // For continuous recognition telemetry has to be sent for every phrase as per spec.
                        _this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                    }
                    if (!!_this.privIntentRecognizer.recognized) {
                        try {
                            _this.privIntentRecognizer.recognized(_this.privIntentRecognizer, ev);
                            /* tslint:disable:no-empty */
                        }
                        catch (error) {
                            // Not going to let errors in the event handler
                            // trip things up.
                        }
                    }
                    // report result to promise.
                    if (!!successCallback) {
                        try {
                            successCallback(result);
                        }
                        catch (e) {
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
                };
                // If intent data was sent, the terminal result for this recognizer is an intent being found.
                // If no intent data was sent, the terminal event is speech recognition being successful.
                if (false === this.privIntentDataSent || Exports_1.ResultReason.NoMatch === ev.result.reason) {
                    sendEvent();
                }
                else {
                    // Squirrel away the args, when the response event arrives it will build upon them
                    // and then return
                    this.privPendingIntentArgs = ev;
                }
                break;
            case "response":
                // Response from LUIS
                if (this.privRecognizerConfig.isContinuousRecognition) {
                    // For continuous recognition telemetry has to be sent for every phrase as per spec.
                    this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                }
                ev = this.privPendingIntentArgs;
                this.privPendingIntentArgs = undefined;
                if (undefined === ev) {
                    if ("" === connectionMessage.textBody) {
                        // This condition happens if there is nothing but silence in the
                        // audio sent to the service.
                        return;
                    }
                    // Odd... Not sure this can happen
                    ev = new Exports_1.IntentRecognitionEventArgs(new Exports_1.IntentRecognitionResult(), 0 /*TODO*/, requestSession.sessionId);
                }
                var intentResponse = Exports_2.IntentResponse.fromJSON(connectionMessage.textBody);
                // If LUIS didn't return anything, send the existing event, else
                // modify it to show the match.
                // See if the intent found is in the list of intents asked for.
                var addedIntent = this.privAddedLmIntents[intentResponse.topScoringIntent.intent];
                if (this.privUmbrellaIntent !== undefined) {
                    addedIntent = this.privUmbrellaIntent;
                }
                if (null !== intentResponse && addedIntent !== undefined) {
                    var intentId = addedIntent.intentName === undefined ? intentResponse.topScoringIntent.intent : addedIntent.intentName;
                    var reason = ev.result.reason;
                    if (undefined !== intentId) {
                        reason = Exports_1.ResultReason.RecognizedIntent;
                    }
                    // make sure, properties is set.
                    var properties = (undefined !== ev.result.properties) ?
                        ev.result.properties : new Exports_1.PropertyCollection();
                    properties.setProperty(Exports_1.PropertyId.LanguageUnderstandingServiceResponse_JsonResult, connectionMessage.textBody);
                    ev = new Exports_1.IntentRecognitionEventArgs(new Exports_1.IntentRecognitionResult(intentId, ev.result.resultId, reason, ev.result.text, ev.result.duration, ev.result.offset + requestSession.currentTurnAudioOffset, ev.result.errorDetails, ev.result.json, properties), ev.offset + requestSession.currentTurnAudioOffset, ev.sessionId);
                }
                if (!!this.privIntentRecognizer.recognized) {
                    try {
                        this.privIntentRecognizer.recognized(this.privIntentRecognizer, ev);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                // report result to promise.
                if (!!successCallback) {
                    try {
                        successCallback(ev.result);
                    }
                    catch (e) {
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
                break;
            default:
                break;
        }
    };
    // Cancels recognition.
    IntentServiceRecognizer.prototype.cancelRecognition = function (sessionId, requestId, cancellationReason, errorCode, error, cancelRecoCallback) {
        if (!!this.privIntentRecognizer.canceled) {
            var properties = new Exports_1.PropertyCollection();
            properties.setProperty(Exports_2.CancellationErrorCodePropertyName, Exports_1.CancellationErrorCode[errorCode]);
            var cancelEvent = new Exports_1.IntentRecognitionCanceledEventArgs(cancellationReason, error, errorCode, undefined, undefined, sessionId);
            try {
                this.privIntentRecognizer.canceled(this.privIntentRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            }
            catch (_a) { }
            if (!!cancelRecoCallback) {
                var result = new Exports_1.IntentRecognitionResult(undefined, // Intent Id
                requestId, Exports_1.ResultReason.Canceled, undefined, // Text
                undefined, // Druation
                undefined, // Offset
                error, undefined, // Json
                properties);
                try {
                    cancelRecoCallback(result);
                    /* tslint:disable:no-empty */
                }
                catch (_b) { }
            }
        }
    };
    return IntentServiceRecognizer;
}(Exports_2.ServiceRecognizerBase));
exports.IntentServiceRecognizer = IntentServiceRecognizer;

//# sourceMappingURL=IntentServiceRecognizer.js.map
