"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common.browser/Exports");
var Exports_2 = require("../common.speech/Exports");
var Exports_3 = require("../common/Exports");
var Exports_4 = require("../sdk/Exports");
var Exports_5 = require("./Exports");
var QueryParameterNames_1 = require("./QueryParameterNames");
var SpeechConnectionFactory = /** @class */ (function () {
    function SpeechConnectionFactory() {
        var _this = this;
        this.create = function (config, authInfo, connectionId) {
            var endpoint = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_Endpoint, undefined);
            var queryParams = {};
            var endpointId = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_EndpointId, undefined);
            var language = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_RecoLanguage, undefined);
            if (endpointId) {
                if (!endpoint || endpoint.search(QueryParameterNames_1.QueryParameterNames.DeploymentIdParamName) === -1) {
                    queryParams[QueryParameterNames_1.QueryParameterNames.DeploymentIdParamName] = endpointId;
                }
            }
            else if (language) {
                if (!endpoint || endpoint.search(QueryParameterNames_1.QueryParameterNames.LanguageParamName) === -1) {
                    queryParams[QueryParameterNames_1.QueryParameterNames.LanguageParamName] = language;
                }
            }
            if (!endpoint || endpoint.search(QueryParameterNames_1.QueryParameterNames.FormatParamName) === -1) {
                queryParams[QueryParameterNames_1.QueryParameterNames.FormatParamName] = config.parameters.getProperty(Exports_2.OutputFormatPropertyName, Exports_4.OutputFormat[Exports_4.OutputFormat.Simple]).toLowerCase();
            }
            if (_this.isDebugModeEnabled) {
                queryParams[QueryParameterNames_1.QueryParameterNames.TestHooksParamName] = "1";
            }
            if (!endpoint) {
                var region = config.parameters.getProperty(Exports_4.PropertyId.SpeechServiceConnection_Region, undefined);
                switch (config.recognitionMode) {
                    case Exports_5.RecognitionMode.Conversation:
                        endpoint = _this.host(region) + _this.conversationRelativeUri;
                        break;
                    case Exports_5.RecognitionMode.Dictation:
                        endpoint = _this.host(region) + _this.dictationRelativeUri;
                        break;
                    default:
                        endpoint = _this.host(region) + _this.interactiveRelativeUri; // default is interactive
                        break;
                }
            }
            var headers = {};
            headers[authInfo.headerName] = authInfo.token;
            headers[QueryParameterNames_1.QueryParameterNames.ConnectionIdHeader] = connectionId;
            return new Exports_1.WebsocketConnection(endpoint, queryParams, headers, new Exports_5.WebsocketMessageFormatter(), connectionId);
        };
    }
    SpeechConnectionFactory.prototype.host = function (region) {
        return Exports_3.Storage.local.getOrAdd("Host", "wss://" + region + ".stt.speech.microsoft.com");
    };
    Object.defineProperty(SpeechConnectionFactory.prototype, "interactiveRelativeUri", {
        get: function () {
            return Exports_3.Storage.local.getOrAdd("InteractiveRelativeUri", "/speech/recognition/interactive/cognitiveservices/v1");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionFactory.prototype, "conversationRelativeUri", {
        get: function () {
            return Exports_3.Storage.local.getOrAdd("ConversationRelativeUri", "/speech/recognition/conversation/cognitiveservices/v1");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionFactory.prototype, "dictationRelativeUri", {
        get: function () {
            return Exports_3.Storage.local.getOrAdd("DictationRelativeUri", "/speech/recognition/dictation/cognitiveservices/v1");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SpeechConnectionFactory.prototype, "isDebugModeEnabled", {
        get: function () {
            var value = Exports_3.Storage.local.getOrAdd("IsDebugModeEnabled", "false");
            return value.toLowerCase() === "true";
        },
        enumerable: true,
        configurable: true
    });
    return SpeechConnectionFactory;
}());
exports.SpeechConnectionFactory = SpeechConnectionFactory;

//# sourceMappingURL=SpeechConnectionFactory.js.map
