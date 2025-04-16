// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AccessToken, TokenCredential, GetTokenOptions } from "@azure/identity";
// We'll use dynamic require instead of static import for fetch

/**
 * Represents a token credential for Cognitive Services that can be used to authenticate with Speech services.
 * This implements the TokenCredential interface from @azure/identity.
 */
export class CogSvcsTokenCredential implements TokenCredential {
    private subscriptionKey: string;
    private region: string;
    private cachedToken: string | null = null;
    private tokenExpirationTime: number = 0;
    
    /**
     * Creates a new instance of the CogSvcsTokenCredential class.
     * @param subscriptionKey The Cognitive Services subscription key.
     * @param region The region for the Cognitive Services resource.
     */
    constructor(subscriptionKey: string, region: string) {
        this.subscriptionKey = subscriptionKey;
        this.region = region;
    }
    
    /**
     * Gets a token for the specified resource.
     * @param scopes The scopes for which the token is requested.
     * @param options The options for the token request.
     * @returns A promise that resolves to the access token.
     */
    async getToken(scopes: string | string[], options?: GetTokenOptions): Promise<AccessToken> {
        // Check if we have a cached token that's still valid
        const now = Date.now();
        if (this.cachedToken && now < this.tokenExpirationTime - 30000) { // 30-second buffer
            return {
                token: this.cachedToken,
                expiresOnTimestamp: this.tokenExpirationTime
            };
        }
        
        try {
            // Get a new token
            const token = await this.fetchToken();
            
            // Cognitive Services tokens typically expire in 10 minutes (600 seconds)
            const expiresIn = 600;
            this.tokenExpirationTime = now + expiresIn * 1000;
            this.cachedToken = token;
            
            return {
                token: token,
                expiresOnTimestamp: this.tokenExpirationTime
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Error getting Cognitive Services token: ${errorMessage}`);
        }
    }
    
    /**
     * Fetches a token from the Cognitive Services token endpoint.
     * @returns A promise that resolves to the token.
     */
    private async fetchToken(): Promise<string> {
        try {
            // Import fetch dynamically to handle various environments
            const nodeFetch = require("node-fetch");
            
            const endpoint = `https://${this.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
            const response = await nodeFetch(endpoint, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': this.subscriptionKey,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Error getting Cognitive Services token: ${errorMessage}`);
        }
    }
}