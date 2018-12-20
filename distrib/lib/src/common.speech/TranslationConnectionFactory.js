"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common.browser/Exports");
var Exports_2 = require("../common/Exports");
var Exports_3 = require("../sdk/Exports");
var Exports_4 = require("./Exports");
var TestHooksParamName = "testhooks";
var ConnectionIdHeader = "X-ConnectionId";
var TranslationConnectionFactory = /** @class */ (function () {
    function TranslationConnectionFactory() {
        var _this = this;
        this.create = function (config, authInfo, connectionId) {
            var endpoint = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Endpoint, undefined);
            if (!endpoint) {
                var region = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Region, undefined);
                endpoint = _this.host(region) + Exports_2.Storage.local.getOrAdd("TranslationRelativeUri", "/speech/translation/cognitiveservices/v1");
            }
            var queryParams = {
                from: config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_RecoLanguage),
                to: config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_TranslationToLanguages),
            };
            if (_this.isDebugModeEnabled) {
                queryParams[TestHooksParamName] = "1";
            }
            var voiceName = "voice";
            var featureName = "features";
            if (config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_TranslationVoice, undefined) !== undefined) {
                queryParams[voiceName] = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_TranslationVoice);
                queryParams[featureName] = "texttospeech";
            }
            var headers = {};
            headers[authInfo.headerName] = authInfo.token;
            headers[ConnectionIdHeader] = connectionId;
            return new Exports_1.WebsocketConnection(endpoint, queryParams, headers, new Exports_4.WebsocketMessageFormatter(), connectionId);
        };
    }
    TranslationConnectionFactory.prototype.host = function (region) {
        return Exports_2.Storage.local.getOrAdd("Host", "wss://" + region + ".s2s.speech.microsoft.com");
    };
    Object.defineProperty(TranslationConnectionFactory.prototype, "isDebugModeEnabled", {
        get: function () {
            var value = Exports_2.Storage.local.getOrAdd("IsDebugModeEnabled", "false");
            return value.toLowerCase() === "true";
        },
        enumerable: true,
        configurable: true
    });
    return TranslationConnectionFactory;
}());
exports.TranslationConnectionFactory = TranslationConnectionFactory;

//# sourceMappingURL=TranslationConnectionFactory.js.map
