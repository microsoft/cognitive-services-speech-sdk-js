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
    SpeechConfig,
    SpeechSynthesisOutputFormat,
} from "./Exports.js";

/**
 * Speech translation configuration.
 * @class SpeechTranslationConfig
 */
export abstract class SpeechTranslationConfig extends SpeechConfig {

    /**
     * Creates an instance of recognizer config.
     */
    protected constructor() {
        super();
    }

    /**
     * Static instance of SpeechTranslationConfig returned by passing a subscription key and service region.
     * @member SpeechTranslationConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    public static fromSubscription(subscriptionKey: string, region: string): SpeechTranslationConfig {
        Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const ret: SpeechTranslationConfigImpl = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        ret.properties.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    }

    /**
     * Static instance of SpeechTranslationConfig returned by passing authorization token and service region.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     * expires, the caller needs to refresh it by setting the property authorizationToken with a new
     * valid token. Otherwise, all the recognizers created by this SpeechTranslationConfig instance
     * will encounter errors during recognition.
     * As configuration values are copied when creating a new recognizer, the new token value will not apply
     * to recognizers that have already been created.
     * For recognizers that have been created before, you need to set authorization token of the corresponding recognizer
     * to refresh the token. Otherwise, the recognizers will encounter errors during recognition.
     * @member SpeechTranslationConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    public static fromAuthorizationToken(authorizationToken: string, region: string): SpeechTranslationConfig {
        Contracts.throwIfNullOrWhitespace(authorizationToken, "authorizationToken");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const ret: SpeechTranslationConfigImpl = new SpeechTranslationConfigImpl();
        ret.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, authorizationToken);
        ret.properties.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return ret;
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
    public static fromHost(hostName: URL, subscriptionKey?: string): SpeechTranslationConfig {
        Contracts.throwIfNull(hostName, "hostName");

        const speechImpl: SpeechTranslationConfigImpl = new SpeechTranslationConfigImpl();
        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Host, hostName.protocol + "//" + hostName.hostname + (hostName.port === "" ? "" : ":" + hostName.port));

        if (undefined !== subscriptionKey) {
            speechImpl.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        }
        return speechImpl;
    }

    /**
     * Creates an instance of the speech translation config with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * Note: The query properties specified in the endpoint URL are not changed, even if they are
     * set by any other APIs. For example, if language is defined in the uri as query parameter
     * "language=de-DE", and also set by the speechRecognitionLanguage property, the language
     * setting in uri takes precedence, and the effective language is "de-DE".
     * Only the properties that are not specified in the endpoint URL can be set by other APIs.
     * Note: To use authorization token with fromEndpoint, pass an empty string to the subscriptionKey in the
     * fromEndpoint method, and then set authorizationToken="token" on the created SpeechConfig instance to
     * use the authorization token.
     * @member SpeechTranslationConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechTranslationConfig} A speech translation config instance.
     */
    public static fromEndpoint(endpoint: URL, subscriptionKey?: string): SpeechTranslationConfig;

    /**
     * Creates a speech configuration instance using a specified endpoint and Azure Active Directory (AAD) token credential.
     * This API is available for **TranslationRecognizer**.
     * Intended for use with **non-standard resource paths** or **custom parameter overrides**.
     * Query parameters specified in the endpoint URL **are not overridden** by other APIs.
     * For example, if the URL includes "language=de-DE" but "speechRecognitionLanguage" is set to "en-US",
     * the value from the URL "de-DE" takes precedence — if the parameter is supported by the scenario.
     * Parameters **not present in the URL** can still be updated via other APIs.
     * To authenticate with a **subscription key**, use SpeechTranslationConfig.fromEndpoint with a key argument.
     * @member SpeechTranslationConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The full service endpoint URL (e.g., for custom domains or private links).
     * See: https://learn.microsoft.com/azure/ai-services/speech-service/speech-services-private-link?tabs=portal#create-a-custom-domain-name.
     * @param {TokenCredential} tokenCredential - The AAD token credential used for authentication and token requests.
     * @returns {SpeechTranslationConfig} A speech translation config instance.
     */
    public static fromEndpoint(endpoint: URL, tokenCredential: TokenCredential): SpeechTranslationConfig;

    /**
     * Internal implementation of fromEndpoint() overloads. Accepts either a subscription key or a TokenCredential.
     * @private
     */
    public static fromEndpoint(endpoint: URL, auth: string | TokenCredential): SpeechTranslationConfig {
        Contracts.throwIfNull(endpoint, "endpoint");
        const isValidString = typeof auth === "string" && auth.trim().length > 0;
        const isTokenCredential = typeof auth === "object" && auth !== null && typeof auth.getToken === "function";
        if (auth !== undefined && !isValidString && !isTokenCredential) {
            throw new Error("Invalid 'auth' parameter: must be a non-empty key string or a valid TokenCredential object.");
        }

        const speechImpl: SpeechTranslationConfigImpl = typeof auth === "object"
            ? new SpeechTranslationConfigImpl(auth)
            : new SpeechTranslationConfigImpl();

        speechImpl.setProperty(PropertyId.SpeechServiceConnection_Endpoint, endpoint.href);

        if (typeof auth === "string" && auth.trim().length > 0) {
            speechImpl.setProperty(PropertyId.SpeechServiceConnection_Key, auth);
        }

        return speechImpl;
    }

    /**
     * Gets/Sets the authorization token.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     * expires, the caller needs to refresh it by calling this setter with a new valid token.
     * @member SpeechTranslationConfig.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    public abstract set authorizationToken(value: string);

    /**
     * Gets/Sets the speech recognition language.
     * @member SpeechTranslationConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    public abstract set speechRecognitionLanguage(value: string);

    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfig.prototype.addTargetLanguage
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    public abstract addTargetLanguage(value: string): void;

    /**
     * Gets the (text) target language to translate into.
     * @member SpeechTranslationConfig.prototype.targetLanguages
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    public abstract get targetLanguages(): string[];

    /**
     * Gets the selected voice name.
     * @member SpeechTranslationConfig.prototype.voiceName
     * @function
     * @public
     * @returns {string} The voice name.
     */
    public abstract get voiceName(): string;

    /**
     * Gets/Sets voice of the translated language, enable voice synthesis output.
     * @member SpeechTranslationConfig.prototype.voiceName
     * @function
     * @public
     * @param {string} value - The name of the voice.
     */
    public abstract set voiceName(value: string);

    /**
     * Sets a named property as value
     * @member SpeechTranslationConfig.prototype.setProperty
     * @function
     * @public
     * @param {string | PropertyId} name - The name of the property to set.
     * @param {string} value - The new value of the property.
     */
    public abstract setProperty(name: string | PropertyId, value: string): void;

    /**
     * Dispose of associated resources.
     * @member SpeechTranslationConfig.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;
}

/**
 * @private
 * @class SpeechTranslationConfigImpl
 */
export class SpeechTranslationConfigImpl extends SpeechTranslationConfig {

    private privSpeechProperties: PropertyCollection;
    private readonly privTokenCredential?: TokenCredential;

    public constructor(tokenCredential?: TokenCredential) {
        super();
        this.privSpeechProperties = new PropertyCollection();
        this.outputFormat = OutputFormat.Simple;
        this.privTokenCredential = tokenCredential;
    }
    /**
     * Gets/Sets the authorization token.
     * If this is set, subscription key is ignored.
     * User needs to make sure the provided authorization token is valid and not expired.
     * @member SpeechTranslationConfigImpl.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    public set authorizationToken(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "value");

        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceAuthorization_Token, value);
    }

    /**
     * Sets the speech recognition language.
     * @member SpeechTranslationConfigImpl.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    public set speechRecognitionLanguage(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "value");
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, value);
    }

    /**
     * Gets the speech recognition language.
     * @member SpeechTranslationConfigImpl.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @return {string} The speechRecognitionLanguage.
     */
    public get speechRecognitionLanguage(): string {
        return this.privSpeechProperties.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);
    }

    /**
     * @member SpeechTranslationConfigImpl.prototype.subscriptionKey
     * @function
     * @public
     */
    public get subscriptionKey(): string {
        return this.privSpeechProperties.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key]);
    }

    /**
     * Gets the output format
     * @member SpeechTranslationConfigImpl.prototype.outputFormat
     * @function
     * @public
     */
    public get outputFormat(): OutputFormat {
        // eslint-disable-next-line
        return (OutputFormat as any)[this.privSpeechProperties.getProperty(OutputFormatPropertyName, undefined)];
    }

    /**
     * Gets/Sets the output format
     * @member SpeechTranslationConfigImpl.prototype.outputFormat
     * @function
     * @public
     */
    public set outputFormat(value: OutputFormat) {
        this.privSpeechProperties.setProperty(OutputFormatPropertyName, OutputFormat[value]);
    }

    /**
     * Gets the endpoint id.
     * @member SpeechTranslationConfigImpl.prototype.endpointId
     * @function
     * @public
     */
    public get endpointId(): string {
        return this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_EndpointId);
    }

    /**
     * Gets/Sets the endpoint id.
     * @member SpeechTranslationConfigImpl.prototype.endpointId
     * @function
     * @public
     */
    public set endpointId(value: string) {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_EndpointId, value);
    }

    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfigImpl.prototype.addTargetLanguage
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    public addTargetLanguage(value: string): void {
        Contracts.throwIfNullOrWhitespace(value, "value");

        const languages: string[] = this.targetLanguages;
        if (!languages.includes(value)) {
            languages.push(value);
            this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, languages.join(","));
        }
    }

    /**
     * Gets the (text) target language to translate into.
     * @member SpeechTranslationConfigImpl.prototype.targetLanguages
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    public get targetLanguages(): string[] {

        if (this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, undefined) !== undefined) {
            return this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
        } else {
            return [];
        }

    }

    /**
     * Gets the voice name.
     * @member SpeechTranslationConfigImpl.prototype.voiceName
     * @function
     * @public
     */
    public get voiceName(): string {
        return this.getProperty(PropertyId[PropertyId.SpeechServiceConnection_TranslationVoice]);
    }

    /**
     * Gets/Sets the voice of the translated language, enable voice synthesis output.
     * @member SpeechTranslationConfigImpl.prototype.voiceName
     * @function
     * @public
     * @param {string} value - The name of the voice.
     */
    public set voiceName(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "value");

        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_TranslationVoice, value);
    }

    /**
     * Provides the region.
     * @member SpeechTranslationConfigImpl.prototype.region
     * @function
     * @public
     * @returns {string} The region.
     */
    public get region(): string {
        return this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_Region);
    }

    public get tokenCredential(): TokenCredential | undefined {
        return this.privTokenCredential;
    }

    public setProxy(proxyHostName: string, proxyPort: number): void;
    public setProxy(proxyHostName: string, proxyPort: number, proxyUserName: string, proxyPassword: string): void;
    public setProxy(proxyHostName: any, proxyPort: any, proxyUserName?: any, proxyPassword?: any): void {
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyHostName], proxyHostName as string);
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyPort], proxyPort as string);
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyUserName], proxyUserName as string);
        this.setProperty(PropertyId[PropertyId.SpeechServiceConnection_ProxyPassword], proxyPassword as string);
    }

    /**
     * Gets an arbitrary property value.
     * @member SpeechTranslationConfigImpl.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} def - The default value of the property in case it is not set.
     * @returns {string} The value of the property.
     */
    public getProperty(name: string, def?: string): string {
        return this.privSpeechProperties.getProperty(name, def);
    }

    /**
     * Gets/Sets an arbitrary property value.
     * @member SpeechTranslationConfigImpl.prototype.setProperty
     * @function
     * @public
     * @param {string | PropertyId} name - The name of the property to set.
     * @param {string} value - The value of the property.
     */
    public setProperty(name: string | PropertyId, value: string): void {
        this.privSpeechProperties.setProperty(name, value);
    }

    /**
     * Provides access to custom properties.
     * @member SpeechTranslationConfigImpl.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The properties.
     */
    public get properties(): PropertyCollection {
        return this.privSpeechProperties;
    }

    /**
     * Dispose of associated resources.
     * @member SpeechTranslationConfigImpl.prototype.close
     * @function
     * @public
     */
    public close(): void {
        return;
    }

    public setServiceProperty(name: string, value: string): void {
        const currentProperties: IStringDictionary<string> = JSON.parse(this.privSpeechProperties.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;

        currentProperties[name] = value;

        this.privSpeechProperties.setProperty(ServicePropertiesPropertyName, JSON.stringify(currentProperties));
    }

    public setProfanity(profanity: ProfanityOption): void {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceResponse_ProfanityOption, ProfanityOption[profanity]);
    }

    public enableAudioLogging(): void {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_EnableAudioLogging, "true");
    }
    public requestWordLevelTimestamps(): void {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "true");
    }
    public enableDictation(): void {
        this.privSpeechProperties.setProperty(ForceDictationPropertyName, "true");
    }

    public get speechSynthesisLanguage(): string {
        return this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_SynthLanguage);
    }

    public set speechSynthesisLanguage(language: string) {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_SynthLanguage, language);
    }

    public get speechSynthesisVoiceName(): string {
        return this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_SynthVoice);
    }

    public set speechSynthesisVoiceName(voice: string) {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_SynthVoice, voice);
    }

    public get speechSynthesisOutputFormat(): SpeechSynthesisOutputFormat {
        // eslint-disable-next-line
        return (SpeechSynthesisOutputFormat as any)[this.privSpeechProperties.getProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, undefined)];
    }

    public set speechSynthesisOutputFormat(format: SpeechSynthesisOutputFormat) {
        this.privSpeechProperties.setProperty(PropertyId.SpeechServiceConnection_SynthOutputFormat, SpeechSynthesisOutputFormat[format]);
    }
}
