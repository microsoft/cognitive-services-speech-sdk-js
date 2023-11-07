// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// eslint-disable-next-line max-classes-per-file
import { Contracts } from "./Contracts.js";

/**
 * Language understanding model
 * @class LanguageUnderstandingModel
 */
export class LanguageUnderstandingModel {
    /**
     * Creates and initializes a new instance
     * @constructor
     */
    protected constructor() {
        return;
    }

    /**
     * Creates an language understanding model using the specified endpoint.
     * @member LanguageUnderstandingModel.fromEndpoint
     * @function
     * @public
     * @param {URL} uri - A String that represents the endpoint of the language understanding model.
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    public static fromEndpoint(uri: URL): LanguageUnderstandingModel {
        Contracts.throwIfNull(uri, "uri");
        Contracts.throwIfNullOrWhitespace(uri.hostname, "uri");

        const langModelImp: LanguageUnderstandingModelImpl = new LanguageUnderstandingModelImpl();
        // Need to extract the app ID from the URL.
        // URL is in the format: https://<region>.api.cognitive.microsoft.com/luis/v2.0/apps/<Guid>?subscription-key=<key>&timezoneOffset=-360

        // Start tearing the string apart.

        // region can be extracted from the host name.
        const firstDot: number = uri.host.indexOf(".");
        if (-1 === firstDot) {
            throw new Error("Could not determine region from endpoint");
        }
        langModelImp.region = uri.host.substr(0, firstDot);

        // Now the app ID.

        const lastSegment: number = uri.pathname.lastIndexOf("/") + 1;
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
    }

    /**
     * Creates an language understanding model using the application id of Language Understanding service.
     * @member LanguageUnderstandingModel.fromAppId
     * @function
     * @public
     * @param {string} appId - A String that represents the application id of Language Understanding service.
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    public static fromAppId(appId: string): LanguageUnderstandingModel {
        Contracts.throwIfNullOrWhitespace(appId, "appId");

        const langModelImp: LanguageUnderstandingModelImpl = new LanguageUnderstandingModelImpl();
        langModelImp.appId = appId;
        return langModelImp;
    }

    /**
     * Creates a language understanding model using hostname, subscription key and application
     * id of Language Understanding service.
     * @member LanguageUnderstandingModel.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - A String that represents the subscription key of
     * Language Understanding service.
     * @param {string} appId - A String that represents the application id of Language
     * Understanding service.
     * @param {LanguageUnderstandingModel} region - A String that represents the region
     * of the Language Understanding service (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {LanguageUnderstandingModel} The language understanding model being created.
     */
    public static fromSubscription(subscriptionKey: string, appId: string, region: string): LanguageUnderstandingModel {
        Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts.throwIfNullOrWhitespace(appId, "appId");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const langModelImp: LanguageUnderstandingModelImpl = new LanguageUnderstandingModelImpl();
        langModelImp.appId = appId;
        langModelImp.region = region;
        langModelImp.subscriptionKey = subscriptionKey;
        return langModelImp;
    }
}

/**
 * @private
 * @class LanguageUnderstandingModelImpl
 */
export class LanguageUnderstandingModelImpl extends LanguageUnderstandingModel {
    public appId: string;
    public region: string;
    public subscriptionKey: string;
}
