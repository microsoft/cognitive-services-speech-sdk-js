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
 * Intent recognizer.
 * @class
 */
var IntentRecognizer = /** @class */ (function (_super) {
    __extends(IntentRecognizer, _super);
    /**
     * Initializes an instance of the IntentRecognizer.
     * @constructor
     * @param {SpeechConfig} speechConfig - The set of configuration properties.
     * @param {AudioConfig} audioConfig - An optional audio input config associated with the recognizer
     */
    function IntentRecognizer(speechConfig, audioConfig) {
        var _this = this;
        Contracts_1.Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        var configImpl = speechConfig;
        Contracts_1.Contracts.throwIfNullOrUndefined(configImpl, "speechConfig");
        _this = _super.call(this, audioConfig) || this;
        _this.privIntentDataSent = false;
        _this.privAddedIntents = [];
        _this.privAddedLmIntents = {};
        _this.privDisposedIntentRecognizer = false;
        _this.privProperties = configImpl.properties;
        Contracts_1.Contracts.throwIfNullOrWhitespace(_this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage), Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage]);
        return _this;
    }
    Object.defineProperty(IntentRecognizer.prototype, "speechRecognitionLanguage", {
        /**
         * Gets the spoken language of recognition.
         * @member IntentRecognizer.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @returns {string} the spoken language of recognition.
         */
        get: function () {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(IntentRecognizer.prototype, "authorizationToken", {
        /**
         * Gets the authorization token used to communicate with the service.
         * @member IntentRecognizer.prototype.authorizationToken
         * @function
         * @public
         * @returns {string} Authorization token.
         */
        get: function () {
            return this.properties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        /**
         * Sets the authorization token used to communicate with the service.
         * Note: Please use a token derived from your LanguageUnderstanding subscription key for the Intent recognizer.
         * @member IntentRecognizer.prototype.authorizationToken
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
    Object.defineProperty(IntentRecognizer.prototype, "properties", {
        /**
         * The collection of properties and their values defined for this IntentRecognizer.
         * @member IntentRecognizer.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The collection of properties and their
         *          values defined for this IntentRecognizer.
         */
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Starts intent recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text and intent as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     *       so it is suitable only for single shot recognition like command or query.
     *       For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member IntentRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the recognition has finished with an IntentRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.recognizeOnceAsync = function (cb, err) {
        var _this = this;
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            this.implCloseExistingRecognizer();
            var contextJson = void 0;
            if (Object.keys(this.privAddedLmIntents).length !== 0 || undefined !== this.privUmbrellaIntent) {
                contextJson = this.buildSpeechContext();
                this.privIntentDataSent = true;
            }
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Interactive, this.properties, this.audioConfig, new Exports_1.IntentConnectionFactory());
            var intentReco = this.privReco;
            intentReco.setIntents(this.privAddedLmIntents, this.privUmbrellaIntent);
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
            }, contextJson);
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
     * @member IntentRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.startContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
            this.implCloseExistingRecognizer();
            var contextJson = void 0;
            if (Object.keys(this.privAddedLmIntents).length !== 0) {
                contextJson = this.buildSpeechContext();
                this.privIntentDataSent = true;
            }
            this.privReco = this.implRecognizerSetup(Exports_1.RecognitionMode.Conversation, this.properties, this.audioConfig, new Exports_1.IntentConnectionFactory());
            var intentReco = this.privReco;
            intentReco.setIntents(this.privAddedLmIntents, this.privUmbrellaIntent);
            this.implRecognizerStart(this.privReco, undefined, undefined, contextJson);
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
     * Stops continuous intent recognition.
     * @member IntentRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.stopContinuousRecognitionAsync = function (cb, err) {
        try {
            Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
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
     * Starts speech recognition with keyword spotting, until stopKeywordRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * Note: Key word spotting functionality is only available on the Speech Devices SDK.
     *       This functionality is currently not included in the SDK itself.
     * @member IntentRecognizer.prototype.startKeywordRecognitionAsync
     * @function
     * @public
     * @param {KeywordRecognitionModel} model - The keyword recognition model that specifies the keyword to be recognized.
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.startKeywordRecognitionAsync = function (model, cb, err) {
        Contracts_1.Contracts.throwIfNull(model, "model");
        if (!!err) {
            err("Not yet implemented.");
        }
    };
    /**
     * Stops continuous speech recognition.
     * Note: Key word spotting functionality is only available on the Speech Devices SDK.
     *       This functionality is currently not included in the SDK itself.
     * @member IntentRecognizer.prototype.stopKeywordRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    IntentRecognizer.prototype.stopKeywordRecognitionAsync = function (cb, err) {
        if (!!cb) {
            cb();
        }
    };
    /**
     * Adds a phrase that should be recognized as intent.
     * @member IntentRecognizer.prototype.addIntent
     * @function
     * @public
     * @param {string} intentId - A String that represents the identifier of the intent to be recognized.
     * @param {string} phrase - A String that specifies the phrase representing the intent.
     */
    IntentRecognizer.prototype.addIntent = function (simplePhrase, intentId) {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        Contracts_1.Contracts.throwIfNullOrWhitespace(intentId, "intentId");
        Contracts_1.Contracts.throwIfNullOrWhitespace(simplePhrase, "simplePhrase");
        this.privAddedIntents.push([intentId, simplePhrase]);
    };
    /**
     * Adds an intent from Language Understanding service for recognition.
     * @member IntentRecognizer.prototype.addIntentWithLanguageModel
     * @function
     * @public
     * @param {string} intentId - A String that represents the identifier of the intent
     *        to be recognized. Ignored if intentName is empty.
     * @param {string} model - The intent model from Language Understanding service.
     * @param {string} intentName - The intent name defined in the intent model. If it
     *        is empty, all intent names defined in the model will be added.
     */
    IntentRecognizer.prototype.addIntentWithLanguageModel = function (intentId, model, intentName) {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        Contracts_1.Contracts.throwIfNullOrWhitespace(intentId, "intentId");
        Contracts_1.Contracts.throwIfNull(model, "model");
        var modelImpl = model;
        Contracts_1.Contracts.throwIfNullOrWhitespace(modelImpl.appId, "model.appId");
        this.privAddedLmIntents[intentId] = new Exports_1.AddedLmIntent(modelImpl, intentName);
    };
    /**
     * @summary Adds all intents from the specified Language Understanding Model.
     * @member IntentRecognizer.prototype.addAllIntents
     * @function
     * @public
     * @function
     * @public
     * @param {LanguageUnderstandingModel} model - The language understanding model containing the intents.
     * @param {string} intentId - A custom id String to be returned in the IntentRecognitionResult's getIntentId() method.
     */
    IntentRecognizer.prototype.addAllIntents = function (model, intentId) {
        Contracts_1.Contracts.throwIfNull(model, "model");
        var modelImpl = model;
        Contracts_1.Contracts.throwIfNullOrWhitespace(modelImpl.appId, "model.appId");
        this.privUmbrellaIntent = new Exports_1.AddedLmIntent(modelImpl, intentId);
    };
    /**
     * closes all external resources held by an instance of this class.
     * @member IntentRecognizer.prototype.close
     * @function
     * @public
     */
    IntentRecognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposedIntentRecognizer);
        this.dispose(true);
    };
    IntentRecognizer.prototype.createRecognizerConfig = function (speecgConfig, recognitionMode) {
        return new Exports_1.RecognizerConfig(speecgConfig, recognitionMode, this.properties);
    };
    IntentRecognizer.prototype.createServiceRecognizer = function (authentication, connectionFactory, audioConfig, recognizerConfig) {
        var audioImpl = audioConfig;
        return new Exports_1.IntentServiceRecognizer(authentication, connectionFactory, audioImpl, recognizerConfig, this, this.privIntentDataSent);
    };
    IntentRecognizer.prototype.dispose = function (disposing) {
        if (this.privDisposedIntentRecognizer) {
            return;
        }
        if (disposing) {
            this.privDisposedIntentRecognizer = true;
            _super.prototype.dispose.call(this, disposing);
        }
    };
    IntentRecognizer.prototype.implCloseExistingRecognizer = function () {
        if (this.privReco) {
            this.privReco.audioSource.turnOff();
            this.privReco.dispose();
            this.privReco = undefined;
        }
    };
    IntentRecognizer.prototype.buildSpeechContext = function () {
        var appId;
        var region;
        var subscriptionKey;
        var refGrammers = [];
        if (undefined !== this.privUmbrellaIntent) {
            appId = this.privUmbrellaIntent.modelImpl.appId;
            region = this.privUmbrellaIntent.modelImpl.region;
            subscriptionKey = this.privUmbrellaIntent.modelImpl.subscriptionKey;
        }
        // Build the reference grammer array.
        for (var _i = 0, _a = Object.keys(this.privAddedLmIntents); _i < _a.length; _i++) {
            var intentId = _a[_i];
            var addedLmIntent = this.privAddedLmIntents[intentId];
            // validate all the same model, region, and key...
            if (appId === undefined) {
                appId = addedLmIntent.modelImpl.appId;
            }
            else {
                if (appId !== addedLmIntent.modelImpl.appId) {
                    throw new Error("Intents must all be from the same LUIS model");
                }
            }
            if (region === undefined) {
                region = addedLmIntent.modelImpl.region;
            }
            else {
                if (region !== addedLmIntent.modelImpl.region) {
                    throw new Error("Intents must all be from the same LUIS model in a single region");
                }
            }
            if (subscriptionKey === undefined) {
                subscriptionKey = addedLmIntent.modelImpl.subscriptionKey;
            }
            else {
                if (subscriptionKey !== addedLmIntent.modelImpl.subscriptionKey) {
                    throw new Error("Intents must all use the same subscription key");
                }
            }
            var grammer = "luis/" + appId + "-PRODUCTION#" + intentId;
            refGrammers.push(grammer);
        }
        return JSON.stringify({
            dgi: {
                ReferenceGrammars: (undefined === this.privUmbrellaIntent) ? refGrammers : ["luis/" + appId + "-PRODUCTION"],
            },
            intent: {
                id: appId,
                key: (subscriptionKey === undefined) ? this.privProperties.getProperty(Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_Key]) : subscriptionKey,
                provider: "LUIS",
            },
        });
    };
    return IntentRecognizer;
}(Exports_2.Recognizer));
exports.IntentRecognizer = IntentRecognizer;

//# sourceMappingURL=IntentRecognizer.js.map
