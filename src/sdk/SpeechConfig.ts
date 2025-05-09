// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
/* eslint-disable max-classes-per-file */

import { TokenCredential } from "@azure/core-auth";
import {
    ForceDictationPropertyName,
    OutputFormatPropertyName,
    ServicePropertiesPropertyName
} from "../common.speech/Exports.js";
import { IStringDictionary } from "../common/Exports.js";
import { Contracts } from "./Contracts.js";
import {
    OutputFormat,
    ProfanityOption,
    PropertyCollection,
    PropertyId,
    ServicePropertyChannel,
    SpeechSynthesisOutputFormat,
} from "./Exports.js";

/**
 * Speech configuration.
 * @class SpeechConfig
 */
export abstract class SpeechConfig {
    /**
     * Creates and initializes an instance.
     * @constructor
     */
    protected constructor() {
        return;
    }

    /**
     * Gets the TokenCredential instance if configured.
     * Only available if using AAD-based authentication via TokenCredential.
     * @returns {TokenCredential | undefined}
     */
    public abstract get tokenCredential(): TokenCredential | undefined;

    /**
     * Static instance of SpeechConfig returned by passing subscriptionKey and service region.
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} The speech factory
     */
    public static fromSubscription(subscriptionKey: string, region: string): SpeechConfig {
        Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const speechImpl: SpeechConfigImpl = new SpeechConfigImpl();
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_IntentRegion, region);
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);

        return speechImpl;
    }

    /**
     * Creates an instance of the speech config with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or parameters.
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * Note: The query parameters specified in the endpoint URL are not changed, even if they are set by any other APIs.
     * For example, if language is defined in the uri as query parameter "language=de-DE", and also set by
     * SpeechConfig.speechRecognitionLanguage = "en-US", the language setting in uri takes precedence,
     * and the effective language is "de-DE". Only the parameters that are not specified in the
     * endpoint URL can be set by other APIs.
     * Note: To use authorization token with fromEndpoint, pass an empty string to the subscriptionKey in the
     * fromEndpoint method, and then set authorizationToken="token" on the created SpeechConfig instance to
     * use the authorization token.
     * @member SpeechConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key. If a subscription key is not specified, an authorization token must be set.
     * @returns {SpeechConfig} A speech factory instance.
     */
    public static fromEndpoint(endpoint: URL, subscriptionKey?: string): SpeechConfig;

    /**
     * Creates a speech configuration instance using a specified endpoint and Azure Active Directory (AAD) token credential.
     * This API supports **SpeechRecognizer** and **ConversationTranscriber**.
     * Intended for use with **non-standard resource paths** or **custom parameter overrides**.
     * Query parameters specified in the endpoint URL **are not overridden** by other APIs.
     * For example, if the URL includes "language=de-DE" but "speechRecognitionLanguage" is set to "en-US",
     * the value from the URL "de-DE" takes precedence — if the parameter is supported by the scenario.
     * Parameters **not present in the URL** can still be updated via other APIs.
     * To authenticate with a **subscription key**, use SpeechConfig.fromEndpoint with a key argument.
     * @member SpeechConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The full service endpoint URL (e.g., for custom domains or private links).
     * See: https://learn.microsoft.com/azure/ai-services/speech-service/speech-services-private-link?tabs=portal#create-a-custom-domain-name.
     * @param {TokenCredential} tokenCredential - The AAD token credential used for authentication and token requests.
     * @returns {SpeechConfig} A speech factory instance.
     */
    public static fromEndpoint(endpoint: URL, tokenCredential: TokenCredential): SpeechConfig;

    /**
     * Internal implementation of fromEndpoint() overloads. Accepts either a subscription key or a TokenCredential.
     * @private
     */
    public static fromEndpoint(endpoint: URL, auth: string | TokenCredential): SpeechConfig {
        Contracts.throwIfNull(endpoint, "endpoint");
        const isValidString = typeof auth === "string" && auth.trim().length > 0;
        const isTokenCredential = typeof auth === "object" && auth !== null && typeof auth.getToken === "function";
        if (auth !== undefined && !isValidString && !isTokenCredential) {
            throw new Error("Invalid 'auth' parameter: must be a non-empty key string or a valid TokenCredential object.");
        }

        const speechImpl: SpeechConfigImpl = typeof auth === "object"
            ? new SpeechConfigImpl(auth)
            : new SpeechConfigImpl();

        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Endpoint, endpoint.href);

        if (typeof auth === "string" && auth.trim().length > 0) {
            speechImpl.setProperty(PropertyId.SpeechServiceConnection_Key, auth);
        }

        return speechImpl;
    }

    /**
     * Creates an instance of the speech config with specified host and subscription key.
     * This method is intended only for users who use a non-default service host. Standard resource path will be assumed.
     * For services with a non-standard resource path or no path at all, use fromEndpoint instead.
     * Note: Query parameters are not allowed in the host URI and must be set by other APIs.
     * Note: To use an authorization token with fromHost, use fromHost(URL),
     * and then set the AuthorizationToken property on the created SpeechConfig instance.
     * Note: Added in version 1.9.0.
     * @member SpeechConfig.fromHost
     * @function
     * @public
     * @param {URL} host - The service endpoint to connect to. Format is "protocol://host:port" where ":port" is optional.
     * @param {string} subscriptionKey - The subscription key. If a subscription key is not specified, an authorization token must be set.
     * @returns {SpeechConfig} A speech factory instance.
     */
    public static fromHost(hostName: URL, subscriptionKey?: string): SpeechConfig {
        Contracts.throwIfNull(hostName, "hostName");

        const speechImpl: SpeechConfigImpl = new SpeechConfigImpl();
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Host, hostName.protocol + "//" + hostName.hostname + (hostName.port === "" ? "" : ":" + hostName.port));

        // Containers do not yet have /stt/speech/universal/v2 routes.
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, "1");

        if (undefined !== subscriptionKey) {
            speechImpl.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        }
        return speechImpl;
    }

    /**
     * Creates an instance of the speech factory with specified initial authorization token and region.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     * expires, the caller needs to refresh it by calling this setter with a new valid token.
     * Note: Please use a token derived from your LanguageUnderstanding subscription key in case you want
     * to use the Intent recognizer. As configuration values are copied when creating a new recognizer,
     * the new token value will not apply to recognizers that have already been created. For recognizers
     * that have been created before, you need to set authorization token of the corresponding recognizer
     * to refresh the token. Otherwise, the recognizers will encounter errors during recognition.
     * @member SpeechConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The initial authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} A speech factory instance.
     */
    public static fromAuthorizationToken(authorizationToken: string, region: string): SpeechConfig {
        Contracts.throwIfNull(authorizationToken, "authorizationToken");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const speechImpl: SpeechConfigImpl = new SpeechConfigImpl();
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_IntentRegion, region);
        speechImpl.authorizationToken = authorizationToken;
        return speechImpl;
    }

    /**
     * Sets the proxy configuration.
     * Only relevant in Node.js environments.
     * Added in version 1.4.0.
     * @param proxyHostName The host name of the proxy server.
     * @param proxyPort The port number of the proxy server.
     */
    public abstract setProxy(proxyHostName: string, proxyPort: number): void;

    /**
     * Sets the proxy configuration.
     * Only relevant in Node.js environments.
     * Added in version 1.4.0.
     * @param proxyHostName The host name of the proxy server, without the protocol scheme (http://)
     * @param proxyPort The port number of the proxy server.
     * @param proxyUserName The username of the proxy server.
     * @param proxyPassword The password of the proxy server.
     */
    public abstract setProxy(proxyHostName: string, proxyPort: number, proxyUserName: string, proxyPassword: string): void;

    /**
     * Gets the authorization token.
     * @member SpeechConfig.prototype.authorizationToken
     * @function
     * @public
     */
    public abstract get authorizationToken(): string;

    /**
     * Gets/Sets the authorization token.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     * expires, the caller needs to refresh it by calling this setter with a new valid token.
     * @member SpeechConfig.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    public abstract set authorizationToken(value: string);

    /**
     * Returns the configured language.
     * @member SpeechConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     */
    public abstract get speechRecognitionLanguage(): string;

    /**
     * Gets/Sets the input language.
     * @member SpeechConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    public abstract set speechRecognitionLanguage(value: string);

    /**
     * Sets an arbitrary property.
     * @member SpeechConfig.prototype.setProperty
     * @function
     * @public
     * @param {string | PropertyId} name - The name of the property to set.
     * @param {string} value - The new value of the property.
     */
    public abstract setProperty(name: string | PropertyId, value: string): void;

    /**
     * Returns the current value of an arbitrary property.
     * @member SpeechConfig.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property to query.
     * @param {string} def - The value to return in case the property is not known.
     * @returns {string} The current value, or provided default, of the given property.
     */
    public abstract getProperty(name: string, def?: string): string;

    /**
     * Gets speech recognition output format (simple or detailed).
     * Note: This output format is for speech recognition result, use [SpeechConfig.speechSynthesisOutputFormat] to
     * get synthesized audio output format.
     * @member SpeechConfig.prototype.outputFormat
     * @function
     * @public
     * @returns {OutputFormat} Returns the output format.
     */
    public abstract get outputFormat(): OutputFormat;

    /**
     * Gets/Sets speech recognition output format (simple or detailed).
     * Note: This output format is for speech recognition result, use [SpeechConfig.speechSynthesisOutputFormat] to
     * set synthesized audio output format.
     * @member SpeechConfig.prototype.outputFormat
     * @function
     * @public
     */
    public abstract set outputFormat(format: OutputFormat);

    /**
     * Gets the endpoint ID of a customized speech model that is used for speech recognition.
     * @member SpeechConfig.prototype.endpointId
     * @function
     * @public
     * @return {string} The endpoint ID
     */
    public abstract get endpointId(): string;

    /**
     * Gets/Sets the endpoint ID of a customized speech model that is used for speech recognition.
     * @member SpeechConfig.prototype.endpointId
     * @function
     * @public
     * @param {string} value - The endpoint ID
     */
    public abstract set endpointId(value: string);

    /**
     * Closes the configuration.
     * @member SpeechConfig.prototype.close
     * @function
     * @public
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public close(): void { }

    /**
     * @member SpeechConfig.prototype.subscriptionKey
     * @function
     * @public
     * @return {string} The subscription key set on the config.
     */
    public abstract get subscriptionKey(): string;

    /**
     * @member SpeechConfig.prototype.region
     * @function
     * @public
     * @return {region} The region set on the config.
     */
    public abstract get region(): string;

    /**
     * Sets a property value that will be passed to service using the specified channel.
     * Added in version 1.7.0.
     * @member SpeechConfig.prototype.setServiceProperty
     * @function
     * @public
     * @param {name} The name of the property.
     * @param {value} Value to set.
     * @param {channel} The channel used to pass the specified property to service.
     */
    public abstract setServiceProperty(name: string, value: string, channel: ServicePropertyChannel): void;

    /**
     * Sets profanity option.
     * Added in version 1.7.0.
     * @member SpeechConfig.prototype.setProfanity
     * @function
     * @public
     * @param {profanity} Profanity option to set.
     */
    public abstract setProfanity(profanity: ProfanityOption): void;

    /**
     * Enable audio logging in service.
     * Audio and content logs are stored either in Microsoft-owned storage, or in your own storage account linked
     * to your Cognitive Services subscription (Bring Your Own Storage (BYOS) enabled Speech resource).
     * The logs will be removed after 30 days.
     * Added in version 1.7.0.
     * @member SpeechConfig.prototype.enableAudioLogging
     * @function
     * @public
     */
    public abstract enableAudioLogging(): void;

    /**
     * Includes word-level timestamps.
     * Added in version 1.7.0.
     * @member SpeechConfig.prototype.requestWordLevelTimestamps
     * @function
     * @public
     */
    public abstract requestWordLevelTimestamps(): void;

    /**
     * Enable dictation. Only supported in speech continuous recognition.
     * Added in version 1.7.0.
     * @member SpeechConfig.prototype.enableDictation
     * @function
     * @public
     */
    public abstract enableDictation(): void;

    /**
     * Gets the language of the speech synthesizer.
     * Added in version 1.11.0.
     * @member SpeechConfig.prototype.speechSynthesisLanguage
     * @function
     * @public
     * @returns {string} Returns the speech synthesis language.
     */
    public abstract get speechSynthesisLanguage(): string;

    /**
     * Sets the language of the speech synthesizer.
     * Added in version 1.11.0.
     * @member SpeechConfig.prototype.speechSynthesisLanguage
     * @function
     * @public
     */
    public abstract set speechSynthesisLanguage(language: string);

    /**
     * Gets the voice of the speech synthesizer.
     * Added in version 1.11.0.
     * @member SpeechConfig.prototype.speechSynthesisVoiceName
     * @function
     * @public
     * @returns {string} Returns the speech synthesis voice.
     */
    public abstract get speechSynthesisVoiceName(): string;

    /**
     * Sets the voice of the speech synthesizer. (see <a href="https://aka.ms/speech/tts-languages">available voices</a>).
     * Added in version 1.11.0.
     * @member SpeechConfig.prototype.speechSynthesisVoiceName
     * @function
     * @public
     */
    public abstract set speechSynthesisVoiceName(voice: string);

    /**
     * Gets the speech synthesis output format.
     * Added in version 1.11.0.
     * @member SpeechConfig.prototype.speechSynthesisOutputFormat
     * @function
     * @public
     * @returns {SpeechSynthesisOutputFormat} Returns the speech synthesis output format
     */
    public abstract get speechSynthesisOutputFormat(): SpeechSynthesisOutputFormat;

    /**
     * Sets the speech synthesis output format (e.g. Riff16Khz16BitMonoPcm).
     * The default format is Audio16Khz64KBitRateMonoMp3 for browser and Riff16Khz16BitMonoPcm for Node.JS.
     * Added in version 1.11.0.
     * @member SpeechConfig.prototype.speechSynthesisOutputFormat
     * @function
     * @public
     */
    public abstract set speechSynthesisOutputFormat(format: SpeechSynthesisOutputFormat);
}

/**
 * @public
 * @class SpeechConfigImpl
 */
export class SpeechConfigImpl extends SpeechConfig {

    private privProperties: PropertyCollection;
    private readonly privTokenCredential?: TokenCredential;

    public constructor(tokenCredential?: TokenCredential) {
        super();
        this.privProperties = new PropertyCollection();
        this.speechRecognitionLanguage = "en-US"; // Should we have a default?
        this.outputFormat = OutputFormat.Simple;
        this.privTokenCredential = tokenCredential;
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public get endPoint(): URL {
        return new URL(this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Endpoint));
    }

    public get subscriptionKey(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Key);
    }

    public get region(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Region);
    }

    public get authorizationToken(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    public set authorizationToken(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechServiceAuthorization_Token, value);
    }

    public get speechRecognitionLanguage(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    public set speechRecognitionLanguage(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, value);
    }

    public get autoDetectSourceLanguages(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages);
    }

    public set autoDetectSourceLanguages(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, value);
    }

    public get outputFormat(): OutputFormat {
        return OutputFormat[this.privProperties.getProperty(OutputFormatPropertyName, undefined) as keyof typeof OutputFormat];
    }

    public set outputFormat(value: OutputFormat) {
        this.privProperties.setProperty(OutputFormatPropertyName, OutputFormat[value]);
    }

    public get endpointId(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_EndpointId);
    }

    public set endpointId(value: string) {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_EndpointId, value);
    }

    public get tokenCredential(): TokenCredential | undefined {
        return this.privTokenCredential;
    }

    public setProperty(name: string | PropertyId, value: string): void {
        Contracts.throwIfNull(value, "value");

        this.privProperties.setProperty(name, value);
    }

    public getProperty(name: string | PropertyId, def?: string): string {

        return this.privProperties.getProperty(name, def);
    }

    public setProxy(proxyHostName: string, proxyPort: number): void;
    public setProxy(proxyHostName: string, proxyPort: number, proxyUserName: string, proxyPassword: string): void;
    public setProxy(proxyHostName: any, proxyPort: any, proxyUserName?: any, proxyPassword?: any): void {
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyHostName], proxyHostName as string);
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyPort], proxyPort as string);
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyUserName], proxyUserName as string);
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyPassword], proxyPassword as string);
    }

    public setServiceProperty(name: string, value: string): void {
        const currentProperties: IStringDictionary<string> = JSON.parse(this.privProperties.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;

        currentProperties[name] = value;

        this.privProperties.setProperty(ServicePropertiesPropertyName, JSON.stringify(currentProperties));
    }

    public setProfanity(profanity: ProfanityOption): void {
        this.privProperties.setProperty(PropertyId.SpeechServiceResponse_ProfanityOption, ProfanityOption[profanity]);
    }

    public enableAudioLogging(): void {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_EnableAudioLogging, "true");
    }
    public requestWordLevelTimestamps(): void {
        this.privProperties.setProperty(PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true");
        this.privProperties.setProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Detailed]);
    }
    public enableDictation(): void {
        this.privProperties.setProperty(ForceDictationPropertyName, "true");
    }

    public clone(): SpeechConfigImpl {
        const ret: SpeechConfigImpl = new SpeechConfigImpl(this.tokenCredential);
        ret.privProperties = this.privProperties.clone();
        return ret;
    }

    public get speechSynthesisLanguage(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_SynthLanguage);
    }

    public set speechSynthesisLanguage(language: string) {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_SynthLanguage, language);
    }

    public get speechSynthesisVoiceName(): string {
        return this.privProperties.getProperty(PropertyId.SpeechServiceConnection_SynthVoice);
    }

    public set speechSynthesisVoiceName(voice: string) {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_SynthVoice, voice);
    }

    public get speechSynthesisOutputFormat(): SpeechSynthesisOutputFormat {
        return SpeechSynthesisOutputFormat[this.privProperties.getProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, undefined) as keyof typeof SpeechSynthesisOutputFormat];
    }

    public set speechSynthesisOutputFormat(format: SpeechSynthesisOutputFormat) {
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, SpeechSynthesisOutputFormat[format]);
    }
}
