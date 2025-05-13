// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the different connection types that can be used for speech recognition.
 * This mirrors the C# implementation in Carbon's end-to-end tests.
 */
export enum SpeechConnectionType {
    /**
     * Connect using subscription key and region.
     */
    Subscription,

    /**
     * Connect using a cloud endpoint URL with key authentication.
     */
    CloudFromEndpointWithKeyAuth,

    /**
     * Connect using a cloud endpoint URL with Cognitive Services token authentication.
     */
    CloudFromEndpointWithCogSvcsTokenAuth,

    /**
     * Connect using a cloud endpoint URL with Entra ID (AAD) token authentication.
     */
    CloudFromEndpointWithEntraIdTokenAuth,

    /**
     * Connect using the legacy Cognitive Services token authentication.
     */
    LegacyCogSvcsTokenAuth,

    /**
     * Connect using the legacy Entra ID (AAD) token authentication.
     */
    LegacyEntraIdTokenAuth,

    /**
     * Connect using a host URL directly.
     */
    CloudFromHost,

    /**
     * Connect to a container using a host URL.
     */
    ContainerFromHost,

    /**
     * Connect to a container using an endpoint URL.
     */
    ContainerFromEndpoint,

    /**
     * Connect to a private link resource using key authentication.
     */
    PrivateLinkWithKeyAuth,

    /**
     * Connect to a private link resource using Cognitive Services token authentication.
     */
    PrivateLinkWithCogSvcsTokenAuth,

    /**
     * Connect to a private link resource using Entra ID (AAD) token authentication.
     */
    PrivateLinkWithEntraIdTokenAuth,

    /**
     * Connect to a private link resource using the legacy path with key authentication.
     */
    LegacyPrivateLinkWithKeyAuth,

    /**
     * Connect to a private link resource using the legacy path with Entra ID (AAD) token authentication.
     */
    LegacyPrivateLinkWithEntraIdTokenAuth,
}
