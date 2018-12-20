"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var RecognitionMode;
(function (RecognitionMode) {
    RecognitionMode[RecognitionMode["Interactive"] = 0] = "Interactive";
    RecognitionMode[RecognitionMode["Conversation"] = 1] = "Conversation";
    RecognitionMode[RecognitionMode["Dictation"] = 2] = "Dictation";
})(RecognitionMode = exports.RecognitionMode || (exports.RecognitionMode = {}));
var SpeechResultFormat;
(function (SpeechResultFormat) {
    SpeechResultFormat[SpeechResultFormat["Simple"] = 0] = "Simple";
    SpeechResultFormat[SpeechResultFormat["Detailed"] = 1] = "Detailed";
})(SpeechResultFormat = exports.SpeechResultFormat || (exports.SpeechResultFormat = {}));
var RecognizerConfig = /** @class */ (function () {
    function RecognizerConfig(platformConfig, recognitionMode, speechConfig) {
        if (recognitionMode === void 0) { recognitionMode = RecognitionMode.Interactive; }
        this.privRecognitionMode = RecognitionMode.Interactive;
        this.privPlatformConfig = platformConfig ? platformConfig : new PlatformConfig(new Context(null));
        this.privRecognitionMode = recognitionMode;
        this.privRecognitionActivityTimeout = recognitionMode === RecognitionMode.Interactive ? 8000 : 25000;
        this.privSpeechConfig = speechConfig;
    }
    Object.defineProperty(RecognizerConfig.prototype, "parameters", {
        get: function () {
            return this.privSpeechConfig;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "recognitionMode", {
        get: function () {
            return this.privRecognitionMode;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "platformConfig", {
        get: function () {
            return this.privPlatformConfig;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "recognitionActivityTimeout", {
        get: function () {
            return this.privRecognitionActivityTimeout;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RecognizerConfig.prototype, "isContinuousRecognition", {
        get: function () {
            return this.privRecognitionMode !== RecognitionMode.Interactive;
        },
        enumerable: true,
        configurable: true
    });
    return RecognizerConfig;
}());
exports.RecognizerConfig = RecognizerConfig;
// tslint:disable-next-line:max-classes-per-file
var PlatformConfig = /** @class */ (function () {
    function PlatformConfig(context) {
        var _this = this;
        this.serialize = function () {
            return JSON.stringify(_this, function (key, value) {
                if (value && typeof value === "object") {
                    var replacement = {};
                    for (var k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            replacement[k && k.charAt(0).toLowerCase() + k.substring(1)] = value[k];
                        }
                    }
                    return replacement;
                }
                return value;
            });
        };
        this.context = context;
    }
    Object.defineProperty(PlatformConfig.prototype, "Context", {
        get: function () {
            return this.context;
        },
        enumerable: true,
        configurable: true
    });
    return PlatformConfig;
}());
exports.PlatformConfig = PlatformConfig;
// tslint:disable-next-line:max-classes-per-file
var Context = /** @class */ (function () {
    function Context(os) {
        this.system = new System();
        this.os = os;
    }
    return Context;
}());
exports.Context = Context;
// tslint:disable-next-line:max-classes-per-file
var System = /** @class */ (function () {
    function System() {
        // Note: below will be patched for official builds.
        var SPEECHSDK_CLIENTSDK_VERSION = "1.1.0-alpha.0.1";
        this.name = "SpeechSDK";
        this.version = SPEECHSDK_CLIENTSDK_VERSION;
        this.build = "JavaScript";
        this.lang = "JavaScript";
    }
    return System;
}());
exports.System = System;
// tslint:disable-next-line:max-classes-per-file
var OS = /** @class */ (function () {
    function OS(platform, name, version) {
        this.platform = platform;
        this.name = name;
        this.version = version;
    }
    return OS;
}());
exports.OS = OS;
// tslint:disable-next-line:max-classes-per-file
var Device = /** @class */ (function () {
    function Device(manufacturer, model, version) {
        this.manufacturer = manufacturer;
        this.model = model;
        this.version = version;
    }
    return Device;
}());
exports.Device = Device;

//# sourceMappingURL=RecognizerConfig.js.map
