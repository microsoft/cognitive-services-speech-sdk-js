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
 * Speech translation configuration.
 * @class SpeechTranslationConfig
 */
var SpeechTranslationConfig = /** @class */ (function (_super) {
    __extends(SpeechTranslationConfig, _super);
    /**
     * Creates an instance of recognizer config.
     */
    function SpeechTranslationConfig() {
        return _super.call(this) || this;
    }
    /**
     * Static instance of SpeechTranslationConfig returned by passing a subscription key and service region.
     * @member SpeechTranslationConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    SpeechTranslationConfig.fromSubscription = function (subscriptionKey, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var ret = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    };
    /**
     * Static instance of SpeechTranslationConfig returned by passing authorization token and service region.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     *       expires, the caller needs to refresh it by setting the property authorizationToken with a new
     *       valid token. Otherwise, all the recognizers created by this SpeechTranslationConfig instance
     *      will encounter errors during recognition.
     * @member SpeechTranslationConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    SpeechTranslationConfig.fromAuthorizationToken = function (authorizationToken, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(authorizationToken, "authorizationToken");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var ret = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, authorizationToken);
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    };
    /**
     * Creates an instance of the speech translation config with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * Note: The query properties specified in the endpoint URL are not changed, even if they are
     *       set by any other APIs. For example, if language is defined in the uri as query parameter
     *       "language=de-DE", and also set by the speechRecognitionLanguage property, the language
     *       setting in uri takes precedence, and the effective language is "de-DE".
     * Only the properties that are not specified in the endpoint URL can be set by other APIs.
     * @member SpeechTranslationConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechTranslationConfig} A speech config instance.
     */
    SpeechTranslationConfig.fromEndpoint = function (endpoint, subscriptionKey) {
        Contracts_1.Contracts.throwIfNull(endpoint, "endpoint");
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        var ret = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint, endpoint.href);
        ret.properties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        return ret;
    };
    return SpeechTranslationConfig;
}(Exports_2.SpeechConfig));
exports.SpeechTranslationConfig = SpeechTranslationConfig;
/**
 * @private
 * @class SpeechTranslationConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
var SpeechTranslationConfigImpl = /** @class */ (function (_super) {
    __extends(SpeechTranslationConfigImpl, _super);
    function SpeechTranslationConfigImpl() {
        var _this = _super.call(this) || this;
        _this.privSpeechProperties = new Exports_2.PropertyCollection();
        _this.outputFormat = Exports_2.OutputFormat.Simple;
        return _this;
    }
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "authorizationToken", {
        /**
         * Sets the authorization token.
         * If this is set, subscription key is ignored.
         * User needs to make sure the provided authorization token is valid and not expired.
         * @member SpeechTranslationConfigImpl.prototype.authorizationToken
         * @function
         * @public
         * @param {string} value - The authorization token.
         */
        set: function (value) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "speechRecognitionLanguage", {
        /**
         * Sets the authorization token.
         * If this is set, subscription key is ignored.
         * User needs to make sure the provided authorization token is valid and not expired.
         * @member SpeechTranslationConfigImpl.prototype.speechRecognitionLanguage
         * @function
         * @public
         * @param {string} value - The authorization token.
         */
        set: function (value) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "subscriptionKey", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.subscriptionKey
         * @function
         * @public
         */
        get: function () {
            return this.privSpeechProperties.getProperty(Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_Key]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "outputFormat", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.outputFormat
         * @function
         * @public
         */
        get: function () {
            return Exports_2.OutputFormat[this.privSpeechProperties.getProperty(Exports_1.OutputFormatPropertyName, undefined)];
        },
        /**
         * @member SpeechTranslationConfigImpl.prototype.outputFormat
         * @function
         * @public
         */
        set: function (value) {
            this.privSpeechProperties.setProperty(Exports_1.OutputFormatPropertyName, Exports_2.OutputFormat[value]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "endpointId", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.endpointId
         * @function
         * @public
         */
        get: function () {
            return this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId);
        },
        /**
         * @member SpeechTranslationConfigImpl.prototype.endpointId
         * @function
         * @public
         */
        set: function (value) {
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint, value);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfigImpl.prototype.addTargetLanguage
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    SpeechTranslationConfigImpl.prototype.addTargetLanguage = function (value) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
        var languages = this.targetLanguages;
        languages.push(value);
        this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages, languages.join(","));
    };
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "targetLanguages", {
        /**
         * Add a (text) target language to translate into.
         * @member SpeechTranslationConfigImpl.prototype.targetLanguages
         * @function
         * @public
         * @param {string} value - The language such as de-DE
         */
        get: function () {
            if (this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages, undefined) !== undefined) {
                return this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
            }
            else {
                return [];
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "voiceName", {
        /**
         * @member SpeechTranslationConfigImpl.prototype.voiceName
         * @function
         * @public
         */
        get: function () {
            return this.getProperty(Exports_2.PropertyId[Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice]);
        },
        /**
         * Sets voice of the translated language, enable voice synthesis output.
         * @member SpeechTranslationConfigImpl.prototype.voiceName
         * @function
         * @public
         * @param {string} value - The name of the voice.
         */
        set: function (value) {
            Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
            this.privSpeechProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_TranslationVoice, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "region", {
        /**
         * Provides the region.
         * @member SpeechTranslationConfigImpl.prototype.region
         * @function
         * @public
         * @returns {string} The region.
         */
        get: function () {
            return this.privSpeechProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Region);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Allows for setting arbitrary properties.
     * @member SpeechTranslationConfigImpl.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} value - The value of the property.
     */
    SpeechTranslationConfigImpl.prototype.setProperty = function (name, value) {
        this.privSpeechProperties.setProperty(name, value);
    };
    /**
     * Allows for retrieving arbitrary property values.
     * @member SpeechTranslationConfigImpl.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} def - The default value of the property in case it is not set.
     * @returns {string} The value of the property.
     */
    SpeechTranslationConfigImpl.prototype.getProperty = function (name, def) {
        return this.privSpeechProperties.getProperty(name, def);
    };
    Object.defineProperty(SpeechTranslationConfigImpl.prototype, "properties", {
        /**
         * Provides access to custom properties.
         * @member SpeechTranslationConfigImpl.prototype.properties
         * @function
         * @public
         * @returns {PropertyCollection} The properties.
         */
        get: function () {
            return this.privSpeechProperties;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Dispose of associated resources.
     * @member SpeechTranslationConfigImpl.prototype.close
     * @function
     * @public
     */
    SpeechTranslationConfigImpl.prototype.close = function () {
        return;
    };
    return SpeechTranslationConfigImpl;
}(SpeechTranslationConfig));
exports.SpeechTranslationConfigImpl = SpeechTranslationConfigImpl;

//# sourceMappingURL=SpeechTranslationConfig.js.map
