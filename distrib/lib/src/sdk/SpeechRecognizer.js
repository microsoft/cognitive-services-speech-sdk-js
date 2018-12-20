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
var Exports_1 = require("../common.speech/Exports");
var SpeechConnectionFactory_1 = require("../common.speech/SpeechConnectionFactory");
var Contracts_1 = require("./Contracts");
var Exports_2 = require("./Exports");
/**
 * Performs speech recognition from microphone, file, or other audio input streams, and gets transcribed text as result.
 * @class SpeechRecognizer
 */
var SpeechRecognizer = /** @class */ (function (_super) {
    __extends(SpeechRecognizer, _super);
    /**
     * SpeechRecognizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this recognizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    function SpeechRecognizer(speechConfig, audioConfig) {
        var _this = _super.call(this, audioConfig) || this;
        _this.privDisposedSpeechRecognizer = false;
        var speechConfigImpl = speechConfig;
        Contracts_1.Contracts.throwIfNull(speechConfigImpl, "speechConfig");
        _this.privProperties = speechConfigImpl.properties.clone();
        Contracts_1.Contracts.throwIfNullOrWhitespace(speechConfigImpl.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage]);
        return _this;
    }
    Object.defineProperty(SpeechRecognizer.prototype, "endpointId", {
        /**
         * Gets the endpoint id of a customized speech model that is used for speech recognition.
         * @member SpeechRecognizer.prototype.endpointId
         * @function
         * @public
         * @returns {string} the endpoint id of a customized speech model that is used for speech recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId, "00000000-0000-0000-0000-000000000000");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "authorizationToken", {
        /**
         * Gets the authorization token used to communicate with the service.
         * @member SpeechRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @returns {string} Authorization token.
         */
        get: function () {
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        /**
         * Sets the authorization token used to communicate with the service.
         * @member SpeechRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @param {string} token - Authorization token.
         */
        set: function (token) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(token, "token");
            this.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, token);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "speechRecognitionLanguage", {
        /**
         * Gets the spoken language of recognition.
         * @member SpeechRecognizer.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @returns {string} The spoken language of recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "outputFormat", {
        /**
         * Gets the output format of recognition.
         * @member SpeechRecognizer.prototype.outputFormat
         * @function
         * @public
         * @returns {OutputFormat} The output format of recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            if (this.properties.getProperty(Exports_1.OutputFormatPropertyName, Exports_2.OutputFormat[Exports_2.OutputFormat.Simple]) === Exports_2.OutputFormat[Exports_2.OutputFormat.Simple]) {
                return Exports_2.OutputFormat.Simple;
            }
            else {
                return Exports_2.OutputFormat.Detailed;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechRecognizer.prototype, "properties", {
        /**
         * The collection of properties and their values defined for this SpeechRecognizer.
         * @member SpeechRecognizer.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The collection of properties and their values defined for this SpeechRecognizer.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts speech recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     *       so it is suitable only for single shot recognition
     *       like command or query. For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member SpeechRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the SpeechRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.recognizeOnceAsync = function (cb, err) {
        var _this = this;
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Interactive, this.properties, this.audioConfig, new SpeechConnectionFactory_1.SpeechConnectionFactory());
            this.implRecognizerStart(this.privReco, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!cb) {
                    cb(e);
                }
            }, function (e) {
                _this.implCloseExistingRecognizer();
                if (!!err) {
                    err(e);
                }
            });
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts speech recognition, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * @member SpeechRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.startContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new SpeechConnectionFactory_1.SpeechConnectionFactory());
            this.implRecognizerStart(this.privReco, undefined, undefined);
            // report result to promise.
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
                cb = undefined;
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Stops continuous speech recognition.
     * @member SpeechRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.stopContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
            this.implCloseExistingRecognizer();
            if (!!cb) {
                try {
                    cb();
                }
                catch (e) {
                    if (!!err) {
                        err(e);
                    }
                }
            }
        }
        catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    var typedError = error;
                    err(typedError.name + ": " + typedError.message);
                }
                else {
                    err(error);
                }
            }
        }
    };
    /**
     * Starts speech recognition with keyword spotting, until
     * stopKeywordRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * Note: Key word spotting functionality is only available on the
     *      Speech Devices SDK. This functionality is currently not included in the SDK itself.
     * @member SpeechRecognizer.prototype.startKeywordRecognitionAsync
     * @function
     * @public
     * @param {KeywordRecognitionModel} model The keyword recognition model that
     *        specifies the keyword to be recognized.
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.startKeywordRecognitionAsync = function (model, cb, err) {
        Contracts_1.Contracts.throwIfNull(model, "model");
        if (!!err) {
            err("Not yet implemented.");
        }
    };
    /**
     * Stops continuous speech recognition.
     * Note: Key word spotting functionality is only available on the
     *       Speech Devices SDK. This functionality is currently not included in the SDK itself.
     * @member SpeechRecognizer.prototype.stopKeywordRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    SpeechRecognizer.prototype.stopKeywordRecognitionAsync = function (cb, err) {
        if (!!cb) {
            cb();
        }
    };
    /**
     * closes all external resources held by an instance of this class.
     * @member SpeechRecognizer.prototype.close
     * @function
     * @public
     */
    SpeechRecognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedSpeechRecognizer);
        this.dispose(true);
    };
    /**
     * Disposes any resources held by the object.
     * @member SpeechRecognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - true if disposing the object.
     */
    SpeechRecognizer.prototype.dispose = function (disposing) {
        if (this.privDisposedSpeechRecognizer) {
            return;
        }
        if (disposing) {
            this.implCloseExistingRecognizer();
            this.privDisposedSpeechRecognizer = true;
        }
        _super.prototype.dispose.call(this, disposing);
    };
    SpeechRecognizer.prototype.createRecognizerConfig = function (speechConfig, recognitionMode) {
        return new Exports_1.RecognizerConfig(speechConfig, recognitionMode, this.properties);
    };
    SpeechRecognizer.prototype.createServiceRecognizer = function (authentication, connectionFactory, audioConfig, recognizerConfig) {
        var configImpl = audioConfig;
        return new Exports_1.SpeechServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    };
    SpeechRecognizer.prototype.implCloseExistingRecognizer = function () {
        if (this.privReco) {
            this.privReco.audioSource.turnOff();
            this.privReco.dispose();
            this.privReco = undefined;
        }
    };
    return SpeechRecognizer;
}(Exports_2.Recognizer));
exports.SpeechRecognizer = SpeechRecognizer;

//# sourceMappingURL=SpeechRecognizer.js.map
