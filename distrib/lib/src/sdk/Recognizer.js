"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
Object.defineProperty(exports, "__esModule", { value: true });
var Exports_1 = require("../common.speech/Exports");
var Exports_2 = require("../common/Exports");
var Contracts_1 = require("./Contracts");
var Exports_3 = require("./Exports");
/**
 * Defines the base class Recognizer which mainly contains common event handlers.
 * @class Recognizer
 */
var Recognizer = /** @class */ (function () {
    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {AudioConfig} audioInput - An optional audio input stream associated with the recognizer
     */
    function Recognizer(audioConfig) {
        this.audioConfig = (audioConfig !== undefined) ? audioConfig : Exports_3.AudioConfig.fromDefaultMicrophoneInput();
        this.privDisposed = false;
    }
    /**
     * Dispose of associated resources.
     * @member Recognizer.prototype.close
     * @function
     * @public
     */
    Recognizer.prototype.close = function () {
        Contracts_1.Contracts.throwIfDisposed(this.privDisposed);
        this.dispose(true);
    };
    /**
     * This method performs cleanup of resources.
     * The Boolean parameter disposing indicates whether the method is called
     * from Dispose (if disposing is true) or from the finalizer (if disposing is false).
     * Derived classes should override this method to dispose resource if needed.
     * @member Recognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - Flag to request disposal.
     */
    Recognizer.prototype.dispose = function (disposing) {
        if (this.privDisposed) {
            return;
        }
        if (disposing) {
            // disconnect
        }
        this.privDisposed = true;
    };
    Object.defineProperty(Recognizer, "telemetryEnabled", {
        /**
         * This method returns the current state of the telemetry setting.
         * @member Recognizer.prototype.telemetryEnabled
         * @function
         * @public
         * @returns true if the telemetry is enabled, false otherwise.
         */
        get: function () {
            return Exports_1.ServiceRecognizerBase.telemetryDataEnabled;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * This method globally enables or disables telemetry.
     * @member Recognizer.prototype.enableTelemetry
     * @function
     * @public
     * @param enabled - Global setting for telemetry collection.
     * If set to true, telemetry information like microphone errors,
     * recognition errors are collected and sent to Microsoft.
     * If set to false, no telemetry is sent to Microsoft.
     */
    /* tslint:disable:member-ordering */
    Recognizer.enableTelemetry = function (enabled) {
        Exports_1.ServiceRecognizerBase.telemetryDataEnabled = enabled;
    };
    // Setup the recognizer
    Recognizer.prototype.implRecognizerSetup = function (recognitionMode, speechProperties, audioConfig, speechConnectionFactory) {
        var osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        var osName = "unknown";
        var osVersion = "unknown";
        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }
        var recognizerConfig = this.createRecognizerConfig(new Exports_1.PlatformConfig(new Exports_1.Context(new Exports_1.OS(osPlatform, osName, osVersion))), recognitionMode); // SDK.SpeechResultFormat.Simple (Options - Simple/Detailed)
        var subscriptionKey = speechProperties.getProperty(Exports_3.PropertyId.SpeechServiceConnection_Key, undefined);
        var authentication = subscriptionKey ?
            new Exports_1.CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new Exports_1.CognitiveTokenAuthentication(function (authFetchEventId) {
                var authorizationToken = speechProperties.getProperty(Exports_3.PropertyId.SpeechServiceAuthorization_Token, undefined);
                return Exports_2.PromiseHelper.fromResult(authorizationToken);
            }, function (authFetchEventId) {
                var authorizationToken = speechProperties.getProperty(Exports_3.PropertyId.SpeechServiceAuthorization_Token, undefined);
                return Exports_2.PromiseHelper.fromResult(authorizationToken);
            });
        return this.createServiceRecognizer(authentication, speechConnectionFactory, audioConfig, recognizerConfig);
    };
    // Start the recognition
    Recognizer.prototype.implRecognizerStart = function (recognizer, successCallback, errorCallback, speechContext) {
        recognizer.recognize(speechContext, successCallback, errorCallback).on(
        /* tslint:disable:no-empty */
        function (result) { }, function (error) {
            if (!!errorCallback) {
                // Internal error with service communication.
                errorCallback("Runtime error: " + error);
            }
        });
    };
    return Recognizer;
}());
exports.Recognizer = Recognizer;

//# sourceMappingURL=Recognizer.js.map
