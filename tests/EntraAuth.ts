// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { execFileSync } from "child_process";
import * as path from "path";
import { AccessToken, TokenCredential } from "@azure/core-auth";
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { ConfigLoader } from "./ConfigLoader";
import { Settings } from "./Settings";
import { SubscriptionRegion, SubscriptionsRegionsKeys } from "./SubscriptionRegion";

/**
 * Microsoft Entra ID authentication for the tests.
 *
 * Local (key) authentication is off on the Speech resources that the tests use, so the tests connect with a
 * Microsoft Entra ID token instead of a subscription key. In Azure Pipelines the token comes from workload
 * identity federation (service connection Speedme-Dev-Carbon); locally it comes from DefaultAzureCredential
 * (for example, `az login`). See tests/CONFIGURATION.md.
 */
export class EntraAuth {
    private static readonly DefaultTenantId: string = "72f988bf-86f1-41af-91ab-2d7cd011db47";
    private static readonly RefreshMarginMs: number = 5 * 60 * 1000;
    private static cachedToken: AccessToken;

    /**
     * True when the subscriptions JSON has a key for the unified Speech resource. Tests of the key APIs
     * (subscription key, key credential, token from key, containers) need it.
     */
    public static get hasUnifiedKey(): boolean {
        const entry: SubscriptionRegion = ConfigLoader.instance.getSubscriptionRegion(SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION);
        return !!entry && !!entry.Key && entry.Key.trim().length > 0;
    }

    /**
     * Runs the test only when the unified Speech resource key is available; otherwise skips it.
     */
    public static get testIfUnifiedKey(): jest.It {
        return EntraAuth.hasUnifiedKey ? test : test.skip;
    }

    /**
     * Gets a Microsoft Entra ID access token for the Cognitive Services scope. The token is cached and
     * refreshed 5 minutes before it expires.
     */
    public static getAccessToken(): AccessToken {
        if (!EntraAuth.cachedToken || EntraAuth.cachedToken.expiresOnTimestamp - Date.now() < EntraAuth.RefreshMarginMs) {
            const script: string = path.resolve(__dirname, "..", "scripts", "get-entra-token.cjs");
            const output: string = execFileSync(process.execPath, [script, EntraAuth.tenantId()], {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "inherit"],
            });
            EntraAuth.cachedToken = JSON.parse(output) as AccessToken;
        }

        return EntraAuth.cachedToken;
    }

    /**
     * Gets a Speech authorization token ("aad#<resourceId>#<accessToken>") for a resource of the
     * subscriptions JSON.
     * @param entryName The entry of the subscriptions JSON. Default: the unified Speech resource.
     */
    public static getSpeechToken(entryName: string = SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION): string {
        const entry: SubscriptionRegion = ConfigLoader.instance.getSubscriptionRegion(entryName);
        if (!entry || !entry.ResourceId) {
            throw new Error(`ResourceId is not set for ${entryName} in the subscriptions JSON.`);
        }

        return `aad#${entry.ResourceId}#${EntraAuth.getAccessToken().token}`;
    }

    /**
     * Gets a TokenCredential that uses the same Microsoft Entra ID token source as the other helpers.
     */
    public static getCredential(): TokenCredential {
        return {
            getToken: (): Promise<AccessToken> => Promise.resolve(EntraAuth.getAccessToken()),
        };
    }

    /**
     * Creates a SpeechConfig for the unified Speech resource region with a Microsoft Entra ID token.
     */
    public static speechConfig(): sdk.SpeechConfig {
        return sdk.SpeechConfig.fromAuthorizationToken(EntraAuth.getSpeechToken(), Settings.SpeechRegion);
    }

    /**
     * Creates a SpeechTranslationConfig for the unified Speech resource region with a Microsoft Entra ID token.
     */
    public static translationConfig(): sdk.SpeechTranslationConfig {
        return sdk.SpeechTranslationConfig.fromAuthorizationToken(EntraAuth.getSpeechToken(), Settings.SpeechRegion);
    }

    /**
     * Creates a SpeechConfig for an endpoint of the unified Speech resource with a Microsoft Entra ID token.
     */
    public static speechConfigFromEndpoint(endpoint: URL): sdk.SpeechConfig {
        const config: sdk.SpeechConfig = sdk.SpeechConfig.fromEndpoint(endpoint);
        config.authorizationToken = EntraAuth.getSpeechToken();
        return config;
    }

    /**
     * Creates a SpeechTranslationConfig for an endpoint of the unified Speech resource with a Microsoft Entra ID token.
     */
    public static translationConfigFromEndpoint(endpoint: URL): sdk.SpeechTranslationConfig {
        const config: sdk.SpeechTranslationConfig = sdk.SpeechTranslationConfig.fromEndpoint(endpoint);
        config.authorizationToken = EntraAuth.getSpeechToken();
        return config;
    }

    private static tenantId(): string {
        const aadEntry: SubscriptionRegion = ConfigLoader.instance.getSubscriptionRegion(SubscriptionsRegionsKeys.AAD_SPEECH_CLIENT_SECRET);
        return (aadEntry && aadEntry.TenantId) || EntraAuth.DefaultTenantId;
    }
}
