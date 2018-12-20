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
var IntentConnectionFactory = /** @class */ (function () {
    function IntentConnectionFactory() {
        var _this = this;
        this.create = function (config, authInfo, connectionId) {
            var endpoint = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Endpoint);
            if (!endpoint) {
                var region = config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_IntentRegion);
                endpoint = _this.host() + Exports_2.Storage.local.getOrAdd("TranslationRelativeUri", "/speech/" + _this.getSpeechRegionFromIntentRegion(region) + "/recognition/interactive/cognitiveservices/v1");
            }
            var queryParams = {
                format: "simple",
                language: config.parameters.getProperty(Exports_3.PropertyId.SpeechServiceConnection_RecoLanguage),
            };
            if (_this.isDebugModeEnabled) {
                queryParams[TestHooksParamName] = "1";
            }
            var headers = {};
            headers[authInfo.headerName] = authInfo.token;
            headers[ConnectionIdHeader] = connectionId;
            return new Exports_1.WebsocketConnection(endpoint, queryParams, headers, new Exports_4.WebsocketMessageFormatter(), connectionId);
        };
    }
    IntentConnectionFactory.prototype.host = function () {
        return Exports_2.Storage.local.getOrAdd("Host", "wss://speech.platform.bing.com");
    };
    Object.defineProperty(IntentConnectionFactory.prototype, "isDebugModeEnabled", {
        get: function () {
            var value = Exports_2.Storage.local.getOrAdd("IsDebugModeEnabled", "false");
            return value.toLowerCase() === "true";
        },
        enumerable: true,
        configurable: true
    });
    IntentConnectionFactory.prototype.getSpeechRegionFromIntentRegion = function (intentRegion) {
        switch (intentRegion) {
            case "West US":
            case "US West":
            case "westus":
                return "uswest";
            case "West US 2":
            case "US West 2":
            case "westus2":
                return "uswest2";
            case "South Central US":
            case "US South Central":
            case "southcentralus":
                return "ussouthcentral";
            case "West Central US":
            case "US West Central":
            case "westcentralus":
                return "uswestcentral";
            case "East US":
            case "US East":
            case "eastus":
                return "useast";
            case "East US 2":
            case "US East 2":
            case "eastus2":
                return "useast2";
            case "West Europe":
            case "Europe West":
            case "westeurope":
                return "europewest";
            case "North Europe":
            case "Europe North":
            case "northeurope":
                return "europenorth";
            case "Brazil South":
            case "South Brazil":
            case "southbrazil":
                return "brazilsouth";
            case "Australia East":
            case "East Australia":
            case "eastaustralia":
                return "australiaeast";
            case "Southeast Asia":
            case "Asia Southeast":
            case "southeastasia":
                return "asiasoutheast";
            case "East Asia":
            case "Asia East":
            case "eastasia":
                return "asiaeast";
            default:
                return intentRegion;
        }
    };
    return IntentConnectionFactory;
}());
exports.IntentConnectionFactory = IntentConnectionFactory;

//# sourceMappingURL=IntentConnectionFactory.js.map
