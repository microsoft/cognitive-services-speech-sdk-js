// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
// We'll use dynamic require instead of static import for fetch
import * as sdk from "../microsoft.cognitiveservices.speech.sdk";
import { Settings } from "./Settings";
import { SpeechConnectionType } from "./SpeechConnectionTypes";
import { SpeechServiceType } from "./SpeechServiceTypes";
import { ConfigLoader } from "./ConfigLoader";
import { SubscriptionRegion, SubscriptionsRegionsKeys } from "./SubscriptionRegion";
import { CogSvcsTokenCredential } from "./CogSvcsTokenCredential";

/**
 * Defines the speech configuration types that can be created by the factory.
 * This allows us to use a generic approach similar to the C# implementation.
 */
type ConfigType = sdk.SpeechConfig | sdk.SpeechTranslationConfig;

/**
 * Helper class for creating speech configurations based on different connection types.
 * This provides functionality similar to the C# implementation in Carbon's end-to-end tests.
 */
export class SpeechConfigConnectionFactory {
    /**
     * Gets a speech configuration of the specified type using the given connection type.
     * This is a generic method that can create different types of speech configurations.
     *
     * @param connectionType The connection type to create a config for.
     * @param serviceType The speech service type (SR, TTS, LID).
     * @param isTranslationConfig Whether to create a SpeechTranslationConfig instead of SpeechConfig.
     * @returns A Promise that resolves to the created speech config of the specified type.
     */
    public static async getSpeechConfig<T extends ConfigType>(
        connectionType: SpeechConnectionType,
        serviceType: SpeechServiceType = SpeechServiceType.SpeechRecognition,
        isTranslationConfig: boolean = false
    ): Promise<T> {
        const config = await this.createConfig<T>(connectionType, serviceType, isTranslationConfig);
        return config;
    }

    /**
     * Gets a speech configuration specifically for text-to-speech
     * Convenience method that calls getSpeechConfig with TextToSpeech serviceType
     */
    public static async getSpeechSynthesisConfig(
        connectionType: SpeechConnectionType = SpeechConnectionType.Subscription
    ): Promise<sdk.SpeechConfig> {
        return this.getSpeechConfig(connectionType, SpeechServiceType.TextToSpeech, false);
    }

    /**
     * Gets a speech configuration specifically for speech recognition
     * Convenience method that calls getSpeechConfig with SpeechRecognition serviceType
     */
    public static async getSpeechRecognitionConfig(
        connectionType: SpeechConnectionType = SpeechConnectionType.Subscription
    ): Promise<sdk.SpeechConfig> {
        return this.getSpeechConfig(connectionType, SpeechServiceType.SpeechRecognition, false);
    }

    /**
     * Gets a speech configuration specifically for language identification
     * Convenience method that calls getSpeechConfig with LanguageIdentification serviceType
     */
    public static async getLanguageIdentificationConfig(
        connectionType: SpeechConnectionType = SpeechConnectionType.Subscription
    ): Promise<sdk.SpeechConfig> {
        return this.getSpeechConfig(connectionType, SpeechServiceType.LanguageIdentification, false);
    }

    /**
     * Creates the appropriate configuration based on the connection type.
     */
    private static async createConfig<T extends ConfigType>(
        connectionType: SpeechConnectionType,
        serviceType: SpeechServiceType,
        isTranslationConfig: boolean
    ): Promise<T> {
        switch (connectionType) {
            case SpeechConnectionType.Subscription:
                return this.buildSubscriptionConfig<T>(isTranslationConfig);

            case SpeechConnectionType.LegacyCogSvcsTokenAuth:
                const cogSvcsToken = await this.getToken(
                    Settings.SpeechSubscriptionKey,
                    Settings.SpeechRegion
                );
                return this.buildAuthorizationConfig<T>(cogSvcsToken, Settings.SpeechRegion, isTranslationConfig);

            case SpeechConnectionType.LegacyEntraIdTokenAuth:
                const aadToken = await this.getAadToken(
                    SubscriptionsRegionsKeys.AAD_SPEECH_CLIENT_SECRET
                );
                return this.buildAuthorizationConfig<T>(
                    aadToken,
                    this.getSubscriptionRegion(SubscriptionsRegionsKeys.AAD_SPEECH_CLIENT_SECRET).Region,
                    isTranslationConfig
                );

            case SpeechConnectionType.CloudFromHost:
                const hostSuffix = this.getSpeechHostSuffix(serviceType);
                return this.buildHostConfig<T>(
                    new URL(`wss://${Settings.SpeechRegion}.${hostSuffix}`),
                    Settings.SpeechSubscriptionKey,
                    isTranslationConfig
                );

            case SpeechConnectionType.CloudFromEndpointWithKeyAuth:
                return this.buildCloudEndpointKeyConfig<T>(isTranslationConfig);

            case SpeechConnectionType.CloudFromEndpointWithCogSvcsTokenAuth:
                return this.buildCloudEndpointConfigWithCogSvcsToken<T>(isTranslationConfig);

            case SpeechConnectionType.CloudFromEndpointWithEntraIdTokenAuth:
                return this.buildCloudEndpointConfigWithEntraId<T>(isTranslationConfig);

            case SpeechConnectionType.ContainerFromHost:
                return this.buildContainerSpeechConfig<T>(serviceType, isTranslationConfig);

            case SpeechConnectionType.ContainerFromEndpoint:
                return this.buildContainerEndpointSpeechConfig<T>(serviceType, isTranslationConfig);

            case SpeechConnectionType.PrivateLinkWithKeyAuth:
                return this.buildPrivateLinkWithKeyConfig<T>(undefined, isTranslationConfig);

            case SpeechConnectionType.PrivateLinkWithEntraIdTokenAuth:
                return this.buildPrivateLinkEndpointWithEntraId<T>(isTranslationConfig);

            case SpeechConnectionType.LegacyPrivateLinkWithKeyAuth:
                return this.buildLegacyPrivateLinkWithKeyConfig<T>(isTranslationConfig, serviceType);

            case SpeechConnectionType.LegacyPrivateLinkWithEntraIdTokenAuth:
                return this.buildLegacyPrivateLinkEndpointWithEntraId<T>(isTranslationConfig, serviceType);

            default:
                throw new Error(`Unsupported connection type: ${SpeechConnectionType[connectionType]}`);
        }
    }

    /**
     * Gets the appropriate host suffix based on the speech service type.
     */
    private static getSpeechHostSuffix(serviceType: SpeechServiceType): string {
        switch (serviceType) {
            case SpeechServiceType.TextToSpeech:
                return "tts.speech.microsoft.com";
            case SpeechServiceType.SpeechRecognition:
            case SpeechServiceType.LanguageIdentification:
            default:
                return "stt.speech.microsoft.com";
        }
    }

    /**
     * Gets the appropriate container URL environment variable based on the service type.
     */
    private static getContainerUrlEnvVar(serviceType: SpeechServiceType): string {
        switch (serviceType) {
            case SpeechServiceType.TextToSpeech:
                return "TTS_CONTAINER_URL";
            case SpeechServiceType.LanguageIdentification:
                return "LID_CONTAINER_URL";
            case SpeechServiceType.SpeechRecognition:
            default:
                return "SR_CONTAINER_URL";
        }
    }

    /**
     * Gets a Cognitive Services token for the specified subscription key and region.
     */
    private static async getToken(subscriptionKey: string, region: string): Promise<string> {
        try {
            // Import fetch dynamically to handle various environments
            const nodeFetch = require("node-fetch");

            const endpoint = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
            const response = await nodeFetch(endpoint, {
                headers: {
                    "Content-Type": "application/json",
                    "Ocp-Apim-Subscription-Key": subscriptionKey,
                },
                method: "POST"
            });

            if (!response.ok) {
                throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Error getting token: ${errorMessage}`);
        }
    }

    /**
     * Gets an Azure AD token for the specified subscription key from the SubscriptionsRegionsMap.
     * Uses the DefaultAzureCredential from @azure/identity to acquire tokens.
     * 
     * @param subscriptionKey The key in the SubscriptionsRegionsMap that contains AAD configuration
     * @returns A promise that resolves to the access token
     */
    private static async getAadToken(subscriptionKey: string): Promise<string> {
        try {
            // Get the subscription region details
            const subscriptionRegion = this.getSubscriptionRegion(subscriptionKey);

            if (!subscriptionRegion.ResourceId) {
                throw new Error(`No ResourceId found for subscription key: ${subscriptionKey}`);
            }

            const scope = "https://cognitiveservices.azure.com/.default";

            // Create DefaultAzureCredential to handle various authentication scenarios
            const credential = new DefaultAzureCredential();

            // Get token from the credential
            const tokenResponse = await credential.getToken(scope);

            if (!tokenResponse || !tokenResponse.token) {
                throw new Error("Failed to acquire token from Azure AD");
            }

            return "aad#" + subscriptionRegion.ResourceId + "#" + tokenResponse.token;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Error getting AAD token: ${errorMessage}`);
        }
    }

    /**
     * Gets the subscription region details from the config loader.
     */
    private static getSubscriptionRegion(key: string): SubscriptionRegion {
        const configLoader = ConfigLoader.instance;
        const subscriptionRegion = configLoader.getSubscriptionRegion(key);

        if (!subscriptionRegion) {
            throw new Error(`Could not find subscription region for key: ${key}`);
        }

        return subscriptionRegion;
    }

    /**
     * Builds a speech config from a subscription key and region.
     */
    private static buildSubscriptionConfig<T extends ConfigType>(isTranslationConfig: boolean): T {
        const subscriptionRegion = this.getSubscriptionRegion(SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION);
        const key = subscriptionRegion.Key;
        const region = subscriptionRegion.Region;

        if (isTranslationConfig) {
            return sdk.SpeechTranslationConfig.fromSubscription(key, region) as unknown as T;
        } else {
            const config: T = sdk.SpeechConfig.fromSubscription(key, region) as unknown as T;
            return config;
        }
    }

    /**
     * Builds a speech config from an authorization token and region.
     */
    private static buildAuthorizationConfig<T extends ConfigType>(
        token: string,
        region: string,
        isTranslationConfig: boolean
    ): T {
        if (isTranslationConfig) {
            return sdk.SpeechTranslationConfig.fromAuthorizationToken(token, region) as unknown as T;
        } else {
            return sdk.SpeechConfig.fromAuthorizationToken(token, region) as unknown as T;
        }
    }

    /**
     * Builds a speech config from a host URL and key.
     */
    private static buildHostConfig<T extends ConfigType>(
        host: URL,
        key: string,
        isTranslationConfig: boolean
    ): T {
        if (isTranslationConfig) {
            return sdk.SpeechTranslationConfig.fromHost(host, key) as unknown as T;
        } else {
            return sdk.SpeechConfig.fromHost(host, key) as unknown as T;
        }
    }

    /**
     * Builds a cloud endpoint config with key authentication.
     */
    private static buildCloudEndpointKeyConfig<T extends ConfigType>(isTranslationConfig: boolean): T {
        const subscriptionRegion = this.getSubscriptionRegion(SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION);
        const key = subscriptionRegion.Key;
        const endpoint = subscriptionRegion.Endpoint;

        if (!endpoint) {
            throw new Error("Endpoint is not defined for the subscription");
        }

        if (isTranslationConfig) {
            return sdk.SpeechTranslationConfig.fromEndpoint(new URL(endpoint), key) as unknown as T;
        } else {
            return sdk.SpeechConfig.fromEndpoint(new URL(endpoint), key) as unknown as T;
        }
    }

    /**
     * Builds a cloud endpoint config with Cognitive Services token authentication.
     */
    private static buildCloudEndpointConfigWithCogSvcsToken<T extends ConfigType>(
        isTranslationConfig: boolean
    ): T {
        const subscriptionRegion = this.getSubscriptionRegion(SubscriptionsRegionsKeys.UNIFIED_SPEECH_SUBSCRIPTION);
        const endpoint = subscriptionRegion.Endpoint;

        if (!endpoint) {
            throw new Error("Endpoint is not defined for the subscription");
        }

        const cred: TokenCredential = new CogSvcsTokenCredential(
            subscriptionRegion.Key,
            subscriptionRegion.Region
        );

        return this.buildEndpointWithTokenCredential<T>(cred, endpoint, isTranslationConfig);
    }

    /**
     * Builds a cloud endpoint config with Entra ID token authentication.
     */
    private static buildCloudEndpointConfigWithEntraId<T extends ConfigType>(isTranslationConfig: boolean): T {
        const subscriptionRegion = this.getSubscriptionRegion(SubscriptionsRegionsKeys.AAD_SPEECH_CLIENT_SECRET);
        const endpoint = subscriptionRegion.Endpoint;

        if (!endpoint) {
            throw new Error("Endpoint is not defined for the AAD subscription");
        }

        const credential = new DefaultAzureCredential();
        return this.buildEndpointWithTokenCredential<T>(credential, endpoint, isTranslationConfig);
    }

    /**
     * Builds a container speech config.
     */
    private static buildContainerSpeechConfig<T extends ConfigType>(
        serviceType: SpeechServiceType,
        isTranslationConfig: boolean
    ): T {
        const containerEnvVar = this.getContainerUrlEnvVar(serviceType);
        const containerUrl = process.env[containerEnvVar];

        if (!containerUrl) {
            throw new Error(`${containerEnvVar} environment variable is not set`);
        }

        return this.buildHostConfig<T>(new URL(containerUrl), Settings.SpeechSubscriptionKey, isTranslationConfig);
    }

    /**
     * Builds a container endpoint speech config.
     */
    private static buildContainerEndpointSpeechConfig<T extends ConfigType>(
        serviceType: SpeechServiceType,
        isTranslationConfig: boolean
    ): T {
        const containerEnvVar = this.getContainerUrlEnvVar(serviceType);
        const containerUrl = process.env[containerEnvVar];

        if (!containerUrl) {
            throw new Error(`${containerEnvVar} environment variable is not set`);
        }

        throw new Error("Containers do not yet support /stt/ or /tts/ routes.");
    }

    /**
     * Builds a private link config with key authentication.
     */
    private static buildPrivateLinkWithKeyConfig<T extends ConfigType>(
        path?: string,
        isTranslationConfig: boolean = false
    ): T {
        if (!this.checkPrivateLinkTestsEnabled()) {
            throw new Error("Private link testing is not enabled");
        }

        const subscriptionRegion = this.getSubscriptionRegion("PrivateLinkSpeechResource");
        const key = subscriptionRegion.Key;
        const endpoint = subscriptionRegion.Endpoint || "";

        if (!endpoint) {
            throw new Error("Endpoint is not defined for the subscription");
        }

        const finalEndpoint = path ? `${endpoint}${path}` : endpoint;

        if (isTranslationConfig) {
            return sdk.SpeechTranslationConfig.fromEndpoint(new URL(finalEndpoint), key) as unknown as T;
        } else {
            return sdk.SpeechConfig.fromEndpoint(new URL(finalEndpoint), key) as unknown as T;
        }
    }

    /**
     * Builds a legacy private link config with key authentication.
     */
    private static buildLegacyPrivateLinkWithKeyConfig<T extends ConfigType>(isTranslationConfig: boolean, serviceType: SpeechServiceType = SpeechServiceType.SpeechRecognition): T {
        const pathSuffix = this.getPrivateLinkPathSuffix(serviceType);
        return this.buildPrivateLinkWithKeyConfig<T>(pathSuffix, isTranslationConfig);
    }
    /**
     * Builds a private link endpoint with Entra ID token.
     */
    private static async buildLegacyPrivateLinkEndpointWithEntraId<T extends ConfigType>(isTranslationConfig: boolean, serviceType: SpeechServiceType): Promise<T> {
        if (!this.checkPrivateLinkTestsEnabled()) {
            throw new Error("Private link testing is not enabled");
        }

        const pathSuffix = this.getPrivateLinkPathSuffix(serviceType);

        const subscriptionRegion = this.getSubscriptionRegion("PrivateLinkSpeechResource");
        const endpoint = subscriptionRegion.Endpoint + pathSuffix;

        if (!endpoint) {
            throw new Error("Endpoint is not defined for the AAD private link subscription");
        }

        const aadToken = await this.getAadToken(
            SubscriptionsRegionsKeys.AAD_SPEECH_CLIENT_SECRET
        );

        let config: T;
        if (isTranslationConfig) {
            config = sdk.SpeechTranslationConfig.fromEndpoint(new URL(endpoint), undefined) as unknown as T;
            config.authorizationToken = aadToken;
        } else {
            config = sdk.SpeechConfig.fromEndpoint(new URL(endpoint), aadToken) as unknown as T;
            config.authorizationToken = aadToken;
        }

        return config;
    }

    /**
     * Builds a private link endpoint with Entra ID token.
     */
    private static buildPrivateLinkEndpointWithEntraId<T extends ConfigType>(isTranslationConfig: boolean): T {
        if (!this.checkPrivateLinkTestsEnabled()) {
            throw new Error("Private link testing is not enabled");
        }

        const subscriptionRegion = this.getSubscriptionRegion("PrivateLinkSpeechResource");
        const endpoint = subscriptionRegion.Endpoint;

        if (!endpoint) {
            throw new Error("Endpoint is not defined for the AAD private link subscription");
        }

        const credential = new DefaultAzureCredential();
        return this.buildEndpointWithTokenCredential<T>(credential, endpoint, isTranslationConfig);
    }

    /**
     * Helper method to build an endpoint configuration with a token credential.
     * @param cred The token credential to use for authentication.
     * @param endpoint The endpoint URL string.
     * @param isTranslationConfig Whether to create a SpeechTranslationConfig instead of SpeechConfig.
     * @returns A speech configuration of the requested type.
     */
    private static buildEndpointWithTokenCredential<T extends ConfigType>(
        cred: TokenCredential | undefined,
        endpoint: string,
        isTranslationConfig: boolean
    ): T {

        let config: T;

        if (isTranslationConfig) {
            return cred
                ? sdk.SpeechTranslationConfig.fromEndpoint(new URL(endpoint), cred) as unknown as T
                : sdk.SpeechTranslationConfig.fromEndpoint(new URL(endpoint), "") as unknown as T;
        } else {
            return cred
                ? sdk.SpeechConfig.fromEndpoint(new URL(endpoint), cred) as unknown as T
                : sdk.SpeechConfig.fromEndpoint(new URL(endpoint), "") as unknown as T;
        }

        return config;
    }

    /**
     * Checks if private link tests are enabled.
     */
    private static checkPrivateLinkTestsEnabled(): boolean {
        const plEnabled = process.env.ENABLE_PRIVATE_LINK_TESTS;
        if (!plEnabled || plEnabled.toLowerCase() !== "true") {
            return false;
        }
        return true;
    }

    /**
     * Gets the appropriate path suffix for private link paths based on service type
     */
    private static getPrivateLinkPathSuffix(serviceType: SpeechServiceType): string {
        switch (serviceType) {
            case SpeechServiceType.TextToSpeech:
                return "/tts/cognitiveservices/websocket/v1";
            case SpeechServiceType.SpeechRecognition:
            case SpeechServiceType.LanguageIdentification:
            default:
                return "/stt/speech/universal/v2";
        }
    }

    /**
     * For backward compatibility - these methods will be deprecated in favor of the generic approach.
     */
    public static runConnectionTest(connectionType: SpeechConnectionType): jest.It {
        if (process.env.RUN_CONNECTION_TYPE_TESTS !== "true") {
            return test.skip;
        }

        if ((process.env.SR_CONTAINER_URL === undefined || process.env.SR_CONTAINER_URL === "" ||
            process.env.LID_CONTAINER_URL === undefined || process.env.LID_CONTAINER_URL === "" ||
            process.env.TTS_CONTAINER_URL === undefined || process.env.TTS_CONTAINER_URL === "") &&
            (connectionType === SpeechConnectionType.ContainerFromHost ||
                connectionType === SpeechConnectionType.ContainerFromEndpoint)) {
            return test.skip;
        }

        if (process.env.RUN_PRIVAETE_LINK_TESTS !== "true" &&
            (connectionType === SpeechConnectionType.PrivateLinkWithKeyAuth ||
                connectionType === SpeechConnectionType.LegacyPrivateLinkWithKeyAuth ||
                connectionType === SpeechConnectionType.PrivateLinkWithCogSvcsTokenAuth ||
                connectionType === SpeechConnectionType.PrivateLinkWithEntraIdTokenAuth ||
                connectionType === SpeechConnectionType.LegacyPrivateLinkWithEntraIdTokenAuth)) {
            return test.skip;
        }

        return test;
    }
}
