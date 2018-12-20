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
var Exports_1 = require("../common/Exports");
var Exports_2 = require("../sdk/Exports");
var Exports_3 = require("./Exports");
// tslint:disable-next-line:max-classes-per-file
var TranslationServiceRecognizer = /** @class */ (function (_super) {
    __extends(TranslationServiceRecognizer, _super);
    function TranslationServiceRecognizer(authentication, connectionFactory, audioSource, recognizerConfig, translationRecognizer) {
        var _this = _super.call(this, authentication, connectionFactory, audioSource, recognizerConfig, translationRecognizer) || this;
        _this.privTranslationRecognizer = translationRecognizer;
        return _this;
    }
    TranslationServiceRecognizer.prototype.processTypeSpecificMessages = function (connectionMessage, requestSession, connection, successCallback, errorCallBack) {
        switch (connectionMessage.path.toLowerCase()) {
            case "translation.hypothesis":
                var result = this.fireEventForResult(Exports_3.TranslationHypothesis.fromJSON(connectionMessage.textBody), requestSession);
                if (!!this.privTranslationRecognizer.recognizing) {
                    try {
                        this.privTranslationRecognizer.recognizing(this.privTranslationRecognizer, result);
                        /* tslint:disable:no-empty */
                    }
                    catch (error) {
                        // Not going to let errors in the event handler
                        // trip things up.
                    }
                }
                break;
            case "translation.phrase":
                if (this.privRecognizerConfig.isContinuousRecognition) {
                    // For continuous recognition telemetry has to be sent for every phrase as per spec.
                    this.sendTelemetryData(requestSession, requestSession.getTelemetry());
                }
                var translatedPhrase = Exports_3.TranslationPhrase.fromJSON(connectionMessage.textBody);
                if (translatedPhrase.RecognitionStatus === Exports_3.RecognitionStatus.Success) {
                    // OK, the recognition was successful. How'd the translation do?
                    var result_1 = this.fireEventForResult(translatedPhrase, requestSession);
                    if (!!this.privTranslationRecognizer.recognized) {
                        try {
                            this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, result_1);
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
                            successCallback(result_1.result);
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
                }
                else {
                    var reason = Exports_3.EnumTranslation.implTranslateRecognitionResult(translatedPhrase.RecognitionStatus);
                    var result_2 = new Exports_2.TranslationRecognitionResult(undefined, requestSession.requestId, reason, translatedPhrase.Text, translatedPhrase.Duration, translatedPhrase.Offset, undefined, connectionMessage.textBody, undefined);
                    if (reason === Exports_2.ResultReason.Canceled) {
                        var cancelReason = Exports_3.EnumTranslation.implTranslateCancelResult(translatedPhrase.RecognitionStatus);
                        var ev = new Exports_2.TranslationRecognitionCanceledEventArgs(requestSession.sessionId, cancelReason, null, cancelReason === Exports_2.CancellationReason.Error ? Exports_2.CancellationErrorCode.ServiceError : Exports_2.CancellationErrorCode.NoError, result_2);
                        if (!!this.privTranslationRecognizer.canceled) {
                            try {
                                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, ev);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                    }
                    else {
                        if (!(requestSession.isSpeechEnded && reason === Exports_2.ResultReason.NoMatch && translatedPhrase.RecognitionStatus !== Exports_3.RecognitionStatus.InitialSilenceTimeout)) {
                            var ev = new Exports_2.TranslationRecognitionEventArgs(result_2, 0 /*offset*/, requestSession.sessionId);
                            if (!!this.privTranslationRecognizer.recognized) {
                                try {
                                    this.privTranslationRecognizer.recognized(this.privTranslationRecognizer, ev);
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
                            successCallback(result_2);
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
                }
                break;
            case "translation.synthesis":
                this.sendSynthesisAudio(connectionMessage.binaryBody, requestSession.sessionId);
                break;
            case "translation.synthesis.end":
                var synthEnd = Exports_3.TranslationSynthesisEnd.fromJSON(connectionMessage.textBody);
                switch (synthEnd.SynthesisStatus) {
                    case Exports_3.SynthesisStatus.Error:
                        if (!!this.privTranslationRecognizer.synthesizing) {
                            var result_3 = new Exports_2.TranslationSynthesisResult(Exports_2.ResultReason.Canceled, undefined);
                            var retEvent = new Exports_2.TranslationSynthesisEventArgs(result_3, requestSession.sessionId);
                            try {
                                this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                        if (!!this.privTranslationRecognizer.canceled) {
                            // And raise a canceled event to send the rich(er) error message back.
                            var canceledResult = new Exports_2.TranslationRecognitionCanceledEventArgs(requestSession.sessionId, Exports_2.CancellationReason.Error, synthEnd.FailureReason, Exports_2.CancellationErrorCode.ServiceError, null);
                            try {
                                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, canceledResult);
                                /* tslint:disable:no-empty */
                            }
                            catch (error) {
                                // Not going to let errors in the event handler
                                // trip things up.
                            }
                        }
                        break;
                    case Exports_3.SynthesisStatus.Success:
                        this.sendSynthesisAudio(undefined, requestSession.sessionId);
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }
    };
    // Cancels recognition.
    TranslationServiceRecognizer.prototype.cancelRecognition = function (sessionId, requestId, cancellationReason, errorCode, error, cancelRecoCallback) {
        if (!!this.privTranslationRecognizer.canceled) {
            var properties = new Exports_2.PropertyCollection();
            properties.setProperty(Exports_3.CancellationErrorCodePropertyName, Exports_2.CancellationErrorCode[errorCode]);
            var cancelEvent = new Exports_2.TranslationRecognitionCanceledEventArgs(sessionId, cancellationReason, error, errorCode, undefined);
            try {
                this.privTranslationRecognizer.canceled(this.privTranslationRecognizer, cancelEvent);
                /* tslint:disable:no-empty */
            }
            catch (_a) { }
            if (!!cancelRecoCallback) {
                var result = new Exports_2.TranslationRecognitionResult(undefined, // Translations
                requestId, Exports_2.ResultReason.Canceled, undefined, // Text
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
    TranslationServiceRecognizer.prototype.fireEventForResult = function (serviceResult, requestSession) {
        var translations;
        if (undefined !== serviceResult.Translation.Translations) {
            translations = new Exports_2.Translations();
            for (var _i = 0, _a = serviceResult.Translation.Translations; _i < _a.length; _i++) {
                var translation = _a[_i];
                translations.set(translation.Language, translation.Text);
            }
        }
        var resultReason;
        if (serviceResult instanceof Exports_3.TranslationPhrase) {
            if (serviceResult.Translation.TranslationStatus === Exports_1.TranslationStatus.Success) {
                resultReason = Exports_2.ResultReason.TranslatedSpeech;
            }
            else {
                resultReason = Exports_2.ResultReason.RecognizedSpeech;
            }
        }
        else {
            resultReason = Exports_2.ResultReason.TranslatingSpeech;
        }
        var result = new Exports_2.TranslationRecognitionResult(translations, requestSession.requestId, resultReason, serviceResult.Text, serviceResult.Duration, serviceResult.Offset, serviceResult.Translation.FailureReason, JSON.stringify(serviceResult), undefined);
        var ev = new Exports_2.TranslationRecognitionEventArgs(result, serviceResult.Offset, requestSession.sessionId);
        return ev;
    };
    TranslationServiceRecognizer.prototype.sendSynthesisAudio = function (audio, sessionId) {
        var reason = (undefined === audio) ? Exports_2.ResultReason.SynthesizingAudioCompleted : Exports_2.ResultReason.SynthesizingAudio;
        var result = new Exports_2.TranslationSynthesisResult(reason, audio);
        var retEvent = new Exports_2.TranslationSynthesisEventArgs(result, sessionId);
        if (!!this.privTranslationRecognizer.synthesizing) {
            try {
                this.privTranslationRecognizer.synthesizing(this.privTranslationRecognizer, retEvent);
                /* tslint:disable:no-empty */
            }
            catch (error) {
                // Not going to let errors in the event handler
                // trip things up.
            }
        }
    };
    return TranslationServiceRecognizer;
}(Exports_3.ServiceRecognizerBase));
exports.TranslationServiceRecognizer = TranslationServiceRecognizer;

//# sourceMappingURL=TranslationServiceRecognizer.js.map
