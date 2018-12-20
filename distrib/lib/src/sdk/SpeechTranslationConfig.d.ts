import { OutputFormat, PropertyCollection, SpeechConfig } from "./Exports";
/**
 * Speech translation configuration.
 * @class SpeechTranslationConfig
 */
export declare abstract class SpeechTranslationConfig extends SpeechConfig {
    /**
     * Creates an instance of recognizer config.
     */
    protected constructor();
    /**
     * Static instance of SpeechTranslationConfig returned by passing a subscription key and service region.
     * @member SpeechTranslationConfig.fromSubscription
     * @function
     * @public
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    static fromSubscription(subscriptionKey: string, region: string): SpeechTranslationConfig;
    /**
     * Static instance of SpeechTranslationConfig returned by passing authorization token and service region.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     *       expires, the caller needs to refresh it by setting the property authorizationToken with a new
     *       valid token. Otherwise, all the recognizers created by this SpeechTranslationConfig instance
     *      will encounter errors during recognition.
     * @member SpeechTranslationConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechTranslationConfig} The speech translation config.
     */
    static fromAuthorizationToken(authorizationToken: string, region: string): SpeechTranslationConfig;
    /**
     * Creates an instance of the speech translation config with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * Note: The query properties specified in the endpoint URL are not changed, even if they are
     *       set by any other APIs. For example, if language is defined in the uri as query parameter
     *       "language=de-DE", and also set by the speechRecognitionLanguage property, the language
     *       setting in uri takes precedence, and the effective language is "de-DE".
     * Only the properties that are not specified in the endpoint URL can be set by other APIs.
     * @member SpeechTranslationConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechTranslationConfig} A speech config instance.
     */
    static fromEndpoint(endpoint: URL, subscriptionKey: string): SpeechTranslationConfig;
    /**
     * Sets the authorization token.
     * If this is set, subscription key is ignored.
     * User needs to make sure the provided authorization token is valid and not expired.
     * @member SpeechTranslationConfig.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    abstract authorizationToken: string;
    /**
     * Sets the authorization token.
     * If this is set, subscription key is ignored.
     * User needs to make sure the provided authorization token is valid and not expired.
     * @member SpeechTranslationConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    abstract speechRecognitionLanguage: string;
    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfig.prototype.addTargetLanguage
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    abstract addTargetLanguage(value: string): void;
    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfig.prototype.targetLanguages
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    abstract readonly targetLanguages: string[];
    /**
     * Returns the selected voice name.
     * @member SpeechTranslationConfig.prototype.voiceName
     * @function
     * @public
     * @returns {string} The voice name.
     */
    /**
    * Sets voice of the translated language, enable voice synthesis output.
    * @member SpeechTranslationConfig.prototype.voiceName
    * @function
    * @public
    * @param {string} value - The name of the voice.
    */
    abstract voiceName: string;
    /**
     * Sets a named property as value
     * @member SpeechTranslationConfig.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} value - The value.
     */
    abstract setProperty(name: string, value: string): void;
    /**
     * Dispose of associated resources.
     * @member SpeechTranslationConfig.prototype.close
     * @function
     * @public
     */
    abstract close(): void;
}
/**
 * @private
 * @class SpeechTranslationConfigImpl
 */
export declare class SpeechTranslationConfigImpl extends SpeechTranslationConfig {
    private privSpeechProperties;
    constructor();
    /**
     * Sets the authorization token.
     * If this is set, subscription key is ignored.
     * User needs to make sure the provided authorization token is valid and not expired.
     * @member SpeechTranslationConfigImpl.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    authorizationToken: string;
    /**
     * Sets the authorization token.
     * If this is set, subscription key is ignored.
     * User needs to make sure the provided authorization token is valid and not expired.
     * @member SpeechTranslationConfigImpl.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The authorization token.
     */
    speechRecognitionLanguage: string;
    /**
     * @member SpeechTranslationConfigImpl.prototype.subscriptionKey
     * @function
     * @public
     */
    readonly subscriptionKey: string;
    /**
     * @member SpeechTranslationConfigImpl.prototype.outputFormat
     * @function
     * @public
     */
    /**
    * @member SpeechTranslationConfigImpl.prototype.outputFormat
    * @function
    * @public
    */
    outputFormat: OutputFormat;
    /**
     * @member SpeechTranslationConfigImpl.prototype.endpointId
     * @function
     * @public
     */
    /**
    * @member SpeechTranslationConfigImpl.prototype.endpointId
    * @function
    * @public
    */
    endpointId: string;
    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfigImpl.prototype.addTargetLanguage
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    addTargetLanguage(value: string): void;
    /**
     * Add a (text) target language to translate into.
     * @member SpeechTranslationConfigImpl.prototype.targetLanguages
     * @function
     * @public
     * @param {string} value - The language such as de-DE
     */
    readonly targetLanguages: string[];
    /**
     * @member SpeechTranslationConfigImpl.prototype.voiceName
     * @function
     * @public
     */
    /**
    * Sets voice of the translated language, enable voice synthesis output.
    * @member SpeechTranslationConfigImpl.prototype.voiceName
    * @function
    * @public
    * @param {string} value - The name of the voice.
    */
    voiceName: string;
    /**
     * Provides the region.
     * @member SpeechTranslationConfigImpl.prototype.region
     * @function
     * @public
     * @returns {string} The region.
     */
    readonly region: string;
    /**
     * Allows for setting arbitrary properties.
     * @member SpeechTranslationConfigImpl.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} value - The value of the property.
     */
    setProperty(name: string, value: string): void;
    /**
     * Allows for retrieving arbitrary property values.
     * @member SpeechTranslationConfigImpl.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property.
     * @param {string} def - The default value of the property in case it is not set.
     * @returns {string} The value of the property.
     */
    getProperty(name: string, def?: string): string;
    /**
     * Provides access to custom properties.
     * @member SpeechTranslationConfigImpl.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The properties.
     */
    readonly properties: PropertyCollection;
    /**
     * Dispose of associated resources.
     * @member SpeechTranslationConfigImpl.prototype.close
     * @function
     * @public
     */
    close(): void;
}
