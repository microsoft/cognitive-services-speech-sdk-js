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
var SpeechServiceRecognizer = /** @class */ (function (_super) {
    __extends(SpeechServiceRecognizer, _super);
    function SpeechServiceRecognizer(authentication, connectionFactory, audioSource, recognizerConfig, speechRecognizer) {
        var _this = _super.call(this, authentication, connectionFactory, audioSource, recognizerConfig, speechRecognizer) || this;
        _this.privSpeechRecognizer = speechRecognizer;
        return _this;
    }
    SpeechServiceRecognizer.prototype.processTypeSpecificMessages = function (connectionMessage, requestSession, connection, successCallback, errorCallBack) {
        var result;
        switch (connectionMessage.path.toLowerCase()) {
            case "speech.hypothesis":
                var hypothesis = Exports_2.SpeechHypothesis.fromJSON(connectionMessage.textBody);
                result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, Exports_1.ResultReason.RecognizingSpeech, hypothesis.Text, hypothesis.Duration, hypothesis.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                var ev = new Exports_1.SpeechRecognitionEventArgs(result, hypothesis.Duration, requestSession.sessionId);
                if (!!this.privSpeechRecognizer.recognizing) {
                    try {
                        this.privSpeechRecognizer.recognizing(this.privSpeechRecognizer, ev);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "speech.phrase":
                // Always send telemetry because we want it to to up for recognize once which will listening to the service
                // after recognition happens.
                this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                var simple = Exports_2.SimpleSpeechPhrase.fromJSON(connectionMessage.textBody);
                var resultReason = Exports_2.EnumTranslation.implTranslateRecognitionResult(simple.RecognitionStatus);
                requestSession.onServiceRecognized(requestSession.currentTurnAudioOffset + simple.Offset);
                if (Exports_1.ResultReason.Canceled === resultReason) {
                    var cancelReason = Exports_2.EnumTranslation.implTranslateCancelResult(simple.RecognitionStatus);
                    result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, resultReason, undefined, undefined, undefined, undefined, connectionMessage.textBody, undefined);
                    if (!!this.privSpeechRecognizer.canceled) {
                        var cancelEvent = new Exports_1.SpeechRecognitionCanceledEventArgs(cancelReason, undefined, cancelReason === Exports_1.CancellationReason.Error ? Exports_1.CancellationErrorCode.ServiceError : Exports_1.CancellationErrorCode.NoError, undefined, requestSession.sessionId);
                        try {
                            this.privSpeechRecognizer.canceled(this.privSpeechRecognizer, cancelEvent);
                            /* tslint:disable:no-empty */
                        }
                        catch (_a) { }
                    }
                }
                else {
                    if (!(requestSession.isSpeechEnded && resultReason === Exports_1.ResultReason.NoMatch && simple.RecognitionStatus !== Exports_2.RecognitionStatus.InitialSilenceTimeout)) {
                        if (this.privRecognizerConfig.parameters.getProperty(Exports_2.OutputFormatPropertyName) === Exports_1.OutputFormat[Exports_1.OutputFormat.Simple]) {
                            result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, resultReason, simple.DisplayText, simple.Duration, simple.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                        }
                        else {
                            var detailed = Exports_2.DetailedSpeechPhrase.fromJSON(connectionMessage.textBody);
                            result = new Exports_1.SpeechRecognitionResult(requestSession.requestId, resultReason, detailed.RecognitionStatus === Exports_2.RecognitionStatus.Success ? detailed.NBest[0].Display : undefined, detailed.Duration, detailed.Offset + requestSession.currentTurnAudioOffset, undefined, connectionMessage.textBody, undefined);
                        }
                        var event_1 = new Exports_1.SpeechRecognitionEventArgs(result, result.offset, requestSession.sessionId);
                        if (!!this.privSpeechRecognizer.recognized) {
                            try {
                                this.privSpeechRecognizer.recognized(this.privSpeechRecognizer, event_1);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
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
                break;
            default:
                break;
        }
    };
    // Cancels recognition.
    SpeechServiceRecognizer.prototype.cancelRecognition = function (sessionId, requestId, cancellationReason, errorCode, error, cancelRecoCallback) {
        var properties = new Exports_1.PropertyCollection();
        properties.setProperty(Exports_2.CancellationErrorCodePropertyName, Exports_1.CancellationErrorCode[errorCode]);
        if (!!this.privSpeechRecognizer.canceled) {
            var cancelEvent = new Exports_1.SpeechRecognitionCanceledEventArgs(cancellationReason, error, errorCode, undefined, sessionId);
            try {
                this.privSpeechRecognizer.canceled(this.privSpeechRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            }
            catch (_a) { }
        }
        if (!!cancelRecoCallback) {
            var result = new Exports_1.SpeechRecognitionResult(requestId, Exports_1.ResultReason.Canceled, undefined, // Text
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
    };
    return SpeechServiceRecognizer;
}(Exports_2.ServiceRecognizerBase));
exports.SpeechServiceRecognizer = SpeechServiceRecognizer;

//# sourceMappingURL=SpeechServiceRecognizer.js.map
