// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArgumentNullError } from "../common/Exports.js";
import { AuthInfo, IAuthentication } from "./IAuthentication.js";
import { HeaderNames } from "./HeaderNames.js";

export class CognitiveTokenAuthentication implements IAuthentication {
    private static privTokenPrefix: string = "Bearer ";
    private privFetchCallback: (authFetchEventId: string) => Promise<string>;
    private privFetchOnExpiryCallback: (authFetchEventId: string) => Promise<string>;

    public constructor(fetchCallback: (authFetchEventId: string) => Promise<string>, fetchOnExpiryCallback: (authFetchEventId: string) => Promise<string>) {
        if (!fetchCallback) {
            throw new ArgumentNullError("fetchCallback");
        }

        if (!fetchOnExpiryCallback) {
            throw new ArgumentNullError("fetchOnExpiryCallback");
        }

        this.privFetchCallback = fetchCallback;
        this.privFetchOnExpiryCallback = fetchOnExpiryCallback;
    }

    public fetch(authFetchEventId: string): Promise<AuthInfo> {
        return this.privFetchCallback(authFetchEventId).then((token: string): AuthInfo => new AuthInfo(HeaderNames.Authorization, token === undefined ? undefined : CognitiveTokenAuthentication.privTokenPrefix + token));
    }

    public fetchOnExpiry(authFetchEventId: string): Promise<AuthInfo> {
        return this.privFetchOnExpiryCallback(authFetchEventId).then((token: string): AuthInfo => new AuthInfo(HeaderNames.Authorization, token === undefined ? undefined : CognitiveTokenAuthentication.privTokenPrefix + token));
    }
}
