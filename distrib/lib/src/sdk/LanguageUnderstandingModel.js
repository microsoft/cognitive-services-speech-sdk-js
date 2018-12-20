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
var Contracts_1 = require("./Contracts");
/**
 * Language understanding model
 * @class LanguageUnderstandingModel
 */
var LanguageUnderstandingModel = /** @class */ (function () {
    /**
     * Creates and initializes a new instance
     * @constructor
     */
    function LanguageUnderstandingModel() {
    }
    /**
     * Creates an language understanding model using the specified endpoint.
     * @member LanguageUnderstandingModel.fromEndpoint
     * @function
     * @public
     * @param {URL} uri - A String that represents the endpoint of the language understanding model.
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    LanguageUnderstandingModel.fromEndpoint = function (uri) {
        Contracts_1.Contracts.throwIfNull(uri, "uri");
        Contracts_1.Contracts.throwIfNullOrWhitespace(uri.hostname, "uri");
        var langModelImp = new LanguageUnderstandingModelImpl();
        // Need to extract the app ID from the URL.
        // URL is in the format: https://<region>.api.cognitive.microsoft.com/luis/v2.0/apps/<Guid>?subscription-key=<key>&timezoneOffset=-360
        // Start tearing the string apart.
        // region can be extracted from the host name.
        var firstDot = uri.host.indexOf(".");
        if (-1 === firstDot) {
            throw new Error("Could not determine region from endpoint");
        }
        langModelImp.region = uri.host.substr(0, firstDot);
        // Now the app ID.
        var lastSegment = uri.pathname.lastIndexOf("/") + 1;
        if (-1 === lastSegment) {
            throw new Error("Could not determine appId from endpoint");
        }
        langModelImp.appId = uri.pathname.substr(lastSegment);
        // And finally the key.
        langModelImp.subscriptionKey = uri.searchParams.get("subscription-key");
        if (undefined === langModelImp.subscriptionKey) {
            throw new Error("Could not determine subscription key from endpoint");
        }
        return langModelImp;
    };
    /**
     * Creates an language understanding model using the application id of Language Understanding service.
     * @member LanguageUnderstandingModel.fromAppId
     * @function
     * @public
     * @param {string} appId - A String that represents the application id of Language Understanding service.
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    LanguageUnderstandingModel.fromAppId = function (appId) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(appId, "appId");
        var langModelImp = new LanguageUnderstandingModelImpl();
        langModelImp.appId = appId;
        return langModelImp;
    };
    /**
     * Creates a language understanding model using hostname, subscription key and application
     * id of Language Understanding service.
     * @member LanguageUnderstandingModel.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - A String that represents the subscription key of
     *        Language Understanding service.
     * @param {string} appId - A String that represents the application id of Language
     *        Understanding service.
     * @param {LanguageUnderstandingModel} region - A String that represents the region
     *        of the Language Understanding service (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    LanguageUnderstandingModel.fromSubscription = function (subscriptionKey, appId, region) {
        Contracts_1.Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts_1.Contracts.throwIfNullOrWhitespace(appId, "appId");
        Contracts_1.Contracts.throwIfNullOrWhitespace(region, "region");
        var langModelImp = new LanguageUnderstandingModelImpl();
        langModelImp.appId = appId;
        langModelImp.region = region;
        langModelImp.subscriptionKey = subscriptionKey;
        return langModelImp;
    };
    return LanguageUnderstandingModel;
}());
exports.LanguageUnderstandingModel = LanguageUnderstandingModel;
/**
 * @private
 * @class LanguageUnderstandingModelImpl
 */
// tslint:disable-next-line:max-classes-per-file
var LanguageUnderstandingModelImpl = /** @class */ (function (_super) {
    __extends(LanguageUnderstandingModelImpl, _super);
    function LanguageUnderstandingModelImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return LanguageUnderstandingModelImpl;
}(LanguageUnderstandingModel));
exports.LanguageUnderstandingModelImpl = LanguageUnderstandingModelImpl;

//# sourceMappingURL=LanguageUnderstandingModel.js.map
