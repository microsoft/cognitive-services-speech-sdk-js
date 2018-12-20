import { OutputFormat, PropertyCollection, PropertyId } from "./Exports";
/**
 * Speech configuration.
 * @class SpeechConfig
 */
export declare abstract class SpeechConfig {
    /**
     * Creates and initializes an instance.
     * @constructor
     */
    protected constructor();
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
    static fromSubscription(subscriptionKey: string, region: string): SpeechConfig;
    /**
     * Creates an instance of the speech factory with specified endpoint and subscription key.
     * This method is intended only for users who use a non-standard service endpoint or paramters.
     * the language setting in uri takes precedence, and the effective language is "de-DE".
     * Note: Please use your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromEndpoint
     * @function
     * @public
     * @param {URL} endpoint - The service endpoint to connect to.
     * @param {string} subscriptionKey - The subscription key.
     * @returns {SpeechConfig} A speech factory instance.
     */
    static fromEndpoint(endpoint: URL, subscriptionKey: string): SpeechConfig;
    /**
     * Creates an instance of the speech factory with specified initial authorization token and region.
     * Note: Please use a token derived from your LanguageUnderstanding subscription key in case you want to use the Intent recognizer.
     * @member SpeechConfig.fromAuthorizationToken
     * @function
     * @public
     * @param {string} authorizationToken - The initial authorization token.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {SpeechConfig} A speech factory instance.
     */
    static fromAuthorizationToken(authorizationToken: string, region: string): SpeechConfig;
    /**
     * Returns the current authorization token.
     * @member SpeechConfig.prototype.authorizationToken
     * @function
     * @public
     */
    /**
    * Sets the authorization token.
    * If this is set, subscription key is ignored.
    * User needs to make sure the provided authorization token is valid and not expired.
    * @member SpeechConfig.prototype.authorizationToken
    * @function
    * @public
    * @param {string} value - The authorization token.
    */
    abstract authorizationToken: string;
    /**
     * Returns the configured language.
     * @member SpeechConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     */
    /**
    * Sets the input language.
    * @member SpeechConfig.prototype.speechRecognitionLanguage
    * @function
    * @public
    * @param {string} value - The authorization token.
    */
    abstract speechRecognitionLanguage: string;
    /**
     * Sets an arbitrary property.
     * @member SpeechConfig.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property to set.
     * @param {string} value - The new value of the property.
     */
    abstract setProperty(name: string, value: string): void;
    /**
     * Returns the current value of an arbitrary property.
     * @member SpeechConfig.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property to query.
     * @param {string} def - The value to return in case the property is not known.
     * @returns {string} The current value, or provided default, of the given property.
     */
    abstract getProperty(name: string, def?: string): string;
    /**
     * Sets output format.
     * @member SpeechConfig.prototype.outputFormat
     * @function
     * @public
     */
    /**
    * Gets output format.
    * @member SpeechConfig.prototype.outputFormat
    * @function
    * @public
    * @returns {OutputFormat} Returns the output format.
    */
    abstract outputFormat: OutputFormat;
    /**
     * Sets the endpoint ID of a customized speech model that is used for speech recognition.
     * @member SpeechConfig.prototype.endpointId
     * @function
     * @public
     * @param {string} value - The endpoint ID
     */
    /**
    * Gets the endpoint ID of a customized speech model that is used for speech recognition.
    * @member SpeechConfig.prototype.endpointId
    * @function
    * @public
    * @return {string} The endpoint ID
    */
    abstract endpointId: string;
    /**
     * Closes the configuration.
     * @member SpeechConfig.prototype.close
     * @function
     * @public
     */
    close(): void;
}
/**
 * @private
 * @class SpeechConfigImpl
 */
export declare class SpeechConfigImpl extends SpeechConfig {
    private privProperties;
    constructor();
    readonly properties: PropertyCollection;
    readonly endPoint: URL;
    readonly subscriptionKey: string;
    readonly region: string;
    authorizationToken: string;
    speechRecognitionLanguage: string;
    outputFormat: OutputFormat;
    endpointId: string;
    setProperty(name: string | PropertyId, value: string): void;
    getProperty(name: string | PropertyId, def?: string): string;
    clone(): SpeechConfigImpl;
}
