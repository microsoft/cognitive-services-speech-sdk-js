// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ArgumentNullError,
} from "../common/Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import {
    AuthInfo,
    IAuthentication
} from "./IAuthentication.js";

/**
 * @class
 */
export class CognitiveSubscriptionKeyAuthentication implements IAuthentication {
    private privAuthInfo: AuthInfo;

    /**
     * Creates and initializes an instance of the CognitiveSubscriptionKeyAuthentication class.
     * @constructor
     * @param {string} subscriptionKey - The subscription key
     */
    public constructor(subscriptionKey: string) {
        if (!subscriptionKey) {
            throw new ArgumentNullError("subscriptionKey");
        }

        this.privAuthInfo = new AuthInfo(HeaderNames.AuthKey, subscriptionKey);
    }

    /**
     * Fetches the subscription key.
     * @member
     * @function
     * @public
     * @param {string} authFetchEventId - The id to fetch.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public fetch(authFetchEventId: string): Promise<AuthInfo> {
        return Promise.resolve(this.privAuthInfo);
    }

    /**
     * Fetches the subscription key.
     * @member
     * @function
     * @public
     * @param {string} authFetchEventId - The id to fetch.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public fetchOnExpiry(authFetchEventId: string): Promise<AuthInfo> {
        return Promise.resolve(this.privAuthInfo);
    }
}
