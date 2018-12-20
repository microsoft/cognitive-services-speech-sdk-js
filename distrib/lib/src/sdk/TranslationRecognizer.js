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
var Contracts_1 = require("./Contracts");
var Exports_2 = require("./Exports");
/**
 * Translation recognizer
 * @class TranslationRecognizer
 */
var TranslationRecognizer = /** @class */ (function (_super) {
    __extends(TranslationRecognizer, _super);
    /**
     * Initializes an instance of the TranslationRecognizer.
     * @constructor
     * @param {SpeechTranslationConfig} speechConfig - Set of properties to configure this recognizer.
     * @param {AudioConfig} audioConfig - An optional audio config associated with the recognizer
     */
    function TranslationRecognizer(speechConfig, audioConfig) {
        var _this = this;
        var configImpl = speechConfig;
        Contracts_1.Contracts.throwIfNull(configImpl, "speechConfig");
        _this = _super.call(this, audioConfig) || this;
        _this.privDisposedTranslationRecognizer = false;
        _this.privProperties = configImpl.properties.clone();
        if (_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice, undefined) !== undefined) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice]);
        }
        Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages]);
        Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage]);
        return _this;
    }
    Object.defineProperty(TranslationRecognizer.prototype, "speechRecognitionLanguage", {
        /**
         * Gets the language name that was set when the recognizer was created.
         * @member TranslationRecognizer.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @returns {string} Gets the language name that was set when the recognizer was created.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "targetLanguages", {
        /**
         * Gets target languages for translation that were set when the recognizer was created.
         * The language is specified in BCP-47 format. The translation will provide translated text for each of language.
         * @member TranslationRecognizer.prototype.targetLanguages
         * @function
         * @public
         * @returns {string[]} Gets target languages for translation that were set when the recognizer was created.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "voiceName", {
        /**
         * Gets the name of output voice.
         * @member TranslationRecognizer.prototype.voiceName
         * @function
         * @public
         * @returns {string} the name of output voice.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice, undefined);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "authorizationToken", {
        /**
         * Gets the authorization token used to communicate with the service.
         * @member TranslationRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @returns {string} Authorization token.
         */
        get: function () {
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        /**
         * Sets the authorization token used to communicate with the service.
         * @member TranslationRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @param {string} value - Authorization token.
         */
        set: function (value) {
            this.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TranslationRecognizer.prototype, "properties", {
        /**
         * The collection of properties and their values defined for this TranslationRecognizer.
         * @member TranslationRecognizer.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The collection of properties and their values defined for this TranslationRecognizer.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts recognition and translation, and stops after the first utterance is recognized.
     * The task returns the translation text as result.
     * Note: recognizeOnceAsync returns when the first utterance has been recognized, so it is suitableonly
     *       for single shot recognition like command or query. For long-running recognition,
     *       use startContinuousRecognitionAsync() instead.
     * @member TranslationRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the result when the translation has completed.
     * @param err - Callback invoked in case of an error.
     */
    TranslationRecognizer.prototype.recognizeOnceAsync = function (cb, err) {
        var _this = this;
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new Exports_1.TranslationConnectionFactory());
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
     * Starts recognition and translation, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive translation results.
     * @member TranslationRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has started.
     * @param err - Callback invoked in case of an error.
     */
    TranslationRecognizer.prototype.startContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
            this.implCloseExistingRecognizer();
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new Exports_1.TranslationConnectionFactory());
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
     * Stops continuous recognition and translation.
     * @member TranslationRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has stopped.
     * @param err - Callback invoked in case of an error.
     */
    TranslationRecognizer.prototype.stopContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
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
     * closes all external resources held by an instance of this class.
     * @member TranslationRecognizer.prototype.close
     * @function
     * @public
     */
    TranslationRecognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
        this.dispose(true);
    };
    TranslationRecognizer.prototype.dispose = function (disposing) {
        if (this.privDisposedTranslationRecognizer) {
            return;
        }
        if (disposing) {
            this.implCloseExistingRecognizer();
            this.privDisposedTranslationRecognizer = true;
            _super.prototype.dispose.call(this, disposing);
        }
    };
    TranslationRecognizer.prototype.createRecognizerConfig = function (speechConfig, recognitionMode) {
        return new Exports_1.RecognizerConfig(speechConfig, Exports_1.RecognitionMode.Conversation, this.properties);
    };
    TranslationRecognizer.prototype.createServiceRecognizer = function (authentication, connectionFactory, audioConfig, recognizerConfig) {
        var configImpl = audioConfig;
        return new Exports_1.TranslationServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    };
    TranslationRecognizer.prototype.implCloseExistingRecognizer = function () {
        if (this.privReco) {
            this.privReco.audioSource.turnOff();
            this.privReco.dispose();
            this.privReco = undefined;
        }
    };
    return TranslationRecognizer;
}(Exports_2.Recognizer));
exports.TranslationRecognizer = TranslationRecognizer;

//# sourceMappingURL=TranslationRecognizer.js.map
