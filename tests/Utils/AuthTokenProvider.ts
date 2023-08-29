// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as http from "http";
import * as https from "https";

type CachedAuthToken = {
    key: string,
    region: string,
    authToken: string,
    expiry: number
};

/**
 * Helper class to get and cache authentication tokens for the cognitive services.
 */
export class AuthTokenProvider {
    private static readonly MIN_VALIDITY_IN_SECS: number = 5 * 60;
    private static readonly DEFAULT_VALIDITY_IN_SECS: number = 30 * 60;

    private static _entries: { [Name: string]: CachedAuthToken } = {};

    /**
     * Gets the authentication token for the specified subscription key and region. If there is already
     * an existing authentication token, that is valid for at least 5 minutes, then it will be returned.
     * Otherwise a new authentication token will be requested.
     * @member AuthTokenProvider.getOrCreateTokenAsync
     * @function
     * @public
     * @param {string} string - The cognitive subscription key.
     * @param {string} region - The region for the cognitive subscription key.
     * @returns {Promise<string>} The promise that returns the auth token.
     */
    public static async getOrCreateTokenAsync(key: string, region: string): Promise<string> {
        if (key === undefined || key === null || key.length === 0) {
            throw new Error("Invalid subscription key");
        }
        else if (region === undefined || region === null || region.length === 0) {
            throw new Error("Invalid region");
        }

        const cachedKey = AuthTokenProvider.generateKey(key, region);
        let cached: CachedAuthToken = AuthTokenProvider._entries[cachedKey];
        if (cached !== undefined) {
            const minValidity = Date.now() + (this.MIN_VALIDITY_IN_SECS * 1000);
            if (minValidity <= cached.expiry) {
                return cached.authToken;
            }
        }

        return await AuthTokenProvider.createAuthTokenAsync(key, region, AuthTokenProvider.DEFAULT_VALIDITY_IN_SECS);
    };

    /**
     * Creates a new authentication token for the specified subscription key and region and may cache it.
     * @member AuthTokenProvider.createAuthTokenAsync
     * @function
     * @public
     * @param {string} string - The cognitive subscription key.
     * @param {string} region - The region for the cognitive subscription key.
     * @param {number} validityInSecs - The max validity of the auth token in seconds.
     * @returns {Promise<string>} The promise that returns the auth token.
     */
    public static async createAuthTokenAsync(key: string, region: string, validityInSecs: number): Promise<string> {
        if (key === undefined || key === null || key.length === 0) {
            throw new Error("Invalid subscription key");
        }
        else if (region === undefined || region === null || region.length === 0) {
            throw new Error("Invalid region");
        }
        else if (validityInSecs < 0) {
            throw new Error("Invalid validityInSecs");
        }

        const cacheKey = AuthTokenProvider.generateKey(key, region);
        let cached: CachedAuthToken = {
            key: key,
            region: region,
            authToken: undefined,
            expiry: Date.now() + (validityInSecs * 1000)
        };

        cached.authToken = await AuthTokenProvider._createAuthTokenAsync(key, region, validityInSecs);

        const existing = AuthTokenProvider._entries[cacheKey];
        if (existing == null || existing.expiry < cached.expiry) {
            AuthTokenProvider._entries[cacheKey] = cached;
        }

        return cached.authToken;
    }

    private static generateKey(key: string, region: string): string {
        return `${key}-${region}`;
    }

    private static async _createAuthTokenAsync(subsKey: string, region: string, validityInSecs: number = 0): Promise<string>
    {
        let url = new URL(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`);
        if (validityInSecs > 0) {
            url.search = `expiredTime=${validityInSecs}`;
        }

        const method = "POST";
        let authToken: string = undefined;

        if (typeof(XMLHttpRequest) !== "undefined") {
            return await AuthTokenProvider.createAuthTokenXHRAsync(url, method, subsKey);
        }
        else if (typeof(http) !== "undefined" && typeof(http.request) === "function") {
            return await AuthTokenProvider.createAuthTokenHttpAsync(url, method, subsKey);
        }
        else {
            throw new Error("No valid http client found");
        }
    }
    
    private static createAuthTokenXHRAsync(url: URL, method: string, subsKey: string): Promise<string> {
        return new Promise<string>((resolve: (authToken: string) => void, reject: (error: any) => void): void => {
            let xhr = new XMLHttpRequest();
            xhr.open(method, url.href, true);
            xhr.setRequestHeader("Ocp-Apim-Subscription-Key", subsKey);
            xhr.onreadystatechange = (ev: Event): void => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        let authToken = xhr.responseText;
                        resolve(authToken);
                    }
                    else {
                        reject(`Failed to retrieve auth token: ${xhr.status} - ${xhr.statusText}\n${xhr.responseText}`);
                    }
                }
            };
            xhr.send();
        });
    }
    
    private static createAuthTokenHttpAsync(url: URL, method: string, subsKey: string): Promise<string> {
        return new Promise<string>((resolve: (authToken: string) => void, reject: (error: any) => void): void => {
            var opt: https.RequestOptions = {
                protocol: url.protocol,
                host: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    "Ocp-Apim-Subscription-Key": subsKey
                }
            };
    
            let func: (opt: any, cb: (res: http.IncomingMessage) => void) => http.ClientRequest = undefined;
            if (url.protocol === "https:")
                func = https.request;
            else if (url.protocol === "http:")
                func = http.request;
            else
                reject(`Unsupported protocol ${url.protocol}`);
    
            let req = func(opt, (response: http.IncomingMessage): void => {
                if (response.statusCode != 200) {
                    reject(`Failed to retrieve auth token: ${response.statusCode} - ${response.statusMessage}`);
                    return;
                }
    
                let bodyString: string = "";
    
                response.setEncoding('utf8');
                response.on('data', (chunk: string) => { bodyString += chunk; });
                response.on('end', () => { resolve(bodyString); });
            });
    
            req.on('error', (err: any) => { reject(err); });
            req.end();
        });
    }
};