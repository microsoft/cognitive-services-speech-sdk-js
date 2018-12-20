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
 * Speech configuration.
 * @class SpeechConfig
 */
var SpeechConfig = /** @class */ (function () {
    /**
     * Creates and initializes an instance.
     * @constructor
     */
    function SpeechConfig() {
    }
    /**
     * Static instance of SpeechConfig returned by passing subscriptionKey and service region.
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} The speech factory
     */
    SpeechConfig.fromSubscription = function (subscriptionKey, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var speechImpl = new SpeechConfigImpl();
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_IntentRegion, region);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        return speechImpl;
    };
    /**
     * Creates an instance of the speech factory with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * the language setting in uri takes precedence, and the effective language is "de-DE".
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechConfig} A speech factory instance.
     */
    SpeechConfig.fromEndpoint = function (endpoint, subscriptionKey) {
        Contracts_1.Contracts.throwIfNull(endpoint, "endpoint");
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        var speechImpl = new SpeechConfigImpl();
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint, endpoint.href);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        return speechImpl;
    };
    /**
     * Creates an instance of the speech factory with specified initial authorization token and region.
     * Note: Please use a token derived from your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The initial authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} A speech factory instance.
     */
    SpeechConfig.fromAuthorizationToken = function (authorizationToken, region) {
        Contracts_1.Contracts.throwIfNull(authorizationToken, "authorizationToken");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var speechImpl = new SpeechConfigImpl();
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_Region, region);
        speechImpl.setProperty(Exports_2.PropertyId.SpeechServiceConnection_IntentRegion, region);
        speechImpl.authorizationToken = authorizationToken;
        return speechImpl;
    };
    /**
     * Closes the configuration.
     * @member SpeechConfig.prototype.close
     * @function
     * @public
     */
    /* tslint:disable:no-empty */
    SpeechConfig.prototype.close = function () { };
    return SpeechConfig;
}());
exports.SpeechConfig = SpeechConfig;
/**
 * @private
 * @class SpeechConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
var SpeechConfigImpl = /** @class */ (function (_super) {
    __extends(SpeechConfigImpl, _super);
    function SpeechConfigImpl() {
        var _this = _super.call(this) || this;
        _this.privProperties = new Exports_2.PropertyCollection();
        _this.speechRecognitionLanguage = "en-US"; // Should we have a default?
        _this.outputFormat = Exports_2.OutputFormat.Simple;
        return _this;
    }
    Object.defineProperty(SpeechConfigImpl.prototype, "properties", {
        get: function () {
            return this.privProperties;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "endPoint", {
        get: function () {
            return new URL(this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Endpoint));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "subscriptionKey", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Key);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "region", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_Region);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "authorizationToken", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token);
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_2.PropertyId.SpeechServiceAuthorization_Token, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "speechRecognitionLanguage", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage);
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_RecoLanguage, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "outputFormat", {
        get: function () {
            return Exports_2.OutputFormat[this.privProperties.getProperty(Exports_1.OutputFormatPropertyName, undefined)];
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_1.OutputFormatPropertyName, Exports_2.OutputFormat[value]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConfigImpl.prototype, "endpointId", {
        get: function () {
            return this.privProperties.getProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId);
        },
        set: function (value) {
            this.privProperties.setProperty(Exports_2.PropertyId.SpeechServiceConnection_EndpointId, value);
        },
        enumerable: true,
        configurable: true
    });
    SpeechConfigImpl.prototype.setProperty = function (name, value) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(value, "value");
        this.privProperties.setProperty(name, value);
    };
    SpeechConfigImpl.prototype.getProperty = function (name, def) {
        return this.privProperties.getProperty(name, def);
    };
    SpeechConfigImpl.prototype.clone = function () {
        var ret = new SpeechConfigImpl();
        ret.privProperties = this.privProperties.clone();
        return ret;
    };
    return SpeechConfigImpl;
}(SpeechConfig));
exports.SpeechConfigImpl = SpeechConfigImpl;

//# sourceMappingURL=SpeechConfig.js.map
