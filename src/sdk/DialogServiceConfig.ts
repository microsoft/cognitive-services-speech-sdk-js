// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { OutputFormatPropertyName } from "../common.speech/Exports";
import { Contracts } from "./Contracts";
import { OutputFormat, PropertyCollection, PropertyId, SpeechConfig } from "./Exports";

/**
 * Dialog Service configuration.
 * @class DialogServiceConfig
 */
export class DialogServiceConfig extends SpeechConfig {
    /**
     * Not used in DialogServiceConfig
     * @member DialogServiceConfig.authorizationToken
     */
    public authorizationToken: string;

    /**
     * Not used in DialogServiceConfig
     * @member DialogServiceConfig.endpointId
     */
    public endpointId: string;

    private privSpeechProperties: PropertyCollection;
    /**
     * Creates an instance of recognizer config.
     */
    protected constructor() {
        super();
        this.privSpeechProperties = new PropertyCollection();
    }

    /**
     * Creates a DialogServiceConfig instance from a direct line speech bot secret.
     * @member DialogServiceConfig.fromBotSecret
     * @function
     * @public
     * @param {string} botSecret - Speech channel bot secret key.
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {DialogServiceConfig} The dialog service config.
     */
    public static fromBotSecret(botSecret: string, subscriptionKey: string, region: string): DialogServiceConfig {
        Contracts.throwIfNullOrWhitespace(botSecret, "botSecret");
        Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const ret: DialogServiceConfig = new DialogServiceConfig();
        ret.setProperty(PropertyId.Conversation_ApplicationId, botSecret);
        ret.setProperty(PropertyId.Conversation_DialogType, "botframework");
        ret.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        ret.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    }

    /**
     * Creates a DialogServiceConfig instance from a speech commands app id.
     * @member DialogServiceConfig.fromSpeechCommandsAppId
     * @function
     * @public
     * @param {string} appId - Speech Commands app id.
     * @param {string} subscriptionKey - The subscription key.
     * @param {string} region - The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {DialogServiceConfig} The dialog service config.
     */
    public static fromSpeechCommandsAppId(appId: string, subscriptionKey: string, region: string): DialogServiceConfig {
        Contracts.throwIfNullOrWhitespace(appId, "appId");
        Contracts.throwIfNullOrWhitespace(subscriptionKey, "subscriptionKey");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const ret: DialogServiceConfig = new DialogServiceConfig();
        ret.setProperty(PropertyId.Conversation_ApplicationId, appId);
        ret.setProperty(PropertyId.Conversation_DialogType, "botframework");
        ret.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        ret.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return ret;
    }

    /**
     * Gets/Sets the corresponding backend application identifier.
     * @member DialogServiceConfig.prototype.Conversation_ApplicationId
     * @function
     * @public
     * @param {string} value - The application identifier to set.
     */
    public set applicationId(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "value");
        this.setProperty(PropertyId.Conversation_ApplicationId, value);
    }

    /**
     * Gets/Sets the speech recognition language.
     * @member DialogServiceConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The language to set.
     */
    public set speechRecognitionLanguage(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "value");
        this.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, value);
    }

    /**
     * Sets output format.
     * @member SpeechConfig.prototype.outputFormat
     * @function
     * @public
     * @param {OutputFormat} - The output format to set.
     */
    public set outputFormat(value: OutputFormat) {
        this.setProperty(OutputFormatPropertyName, `${value}`);
    }

    /**
     * Sets a named property as value
     * @member SpeechTranslationConfig.prototype.setProperty
     * @function
     * @public
     * @param {PropertyId | string} name - The property to set.
     * @param {string} value - The value.
     */
    public setProperty(name: string | PropertyId, value: string): void {
        this.privSpeechProperties.setProperty(name, value);
    }

    /**
     * Sets a named property as value
     * @member SpeechTranslationConfig.prototype.setProperty
     * @function
     * @public
     * @param {PropertyId | string} name - The property to get.
     * @param {string} def - The value to return in case the property is not known.
     * @returns {string} The current value, or provided default, of the given property.
     */
    public getProperty(name: string | PropertyId, def?: string): string {
        return this.privSpeechProperties.getProperty(name, def);
    }

    /**
     * Sets the proxy configuration.
     * Only relevant in Node.js environments.
     * Added in version 1.4.0.
     * @param proxyHostName The host name of the proxy server, without the protocol scheme (http://)
     * @param porxyPort The port number of the proxy server.
     * @param proxyUserName The user name of the proxy server.
     * @param proxyPassword The password of the proxy server.
     */
    public setProxy(proxyHostName: string, proxyPort: number, proxyUserName?: string, proxyPassword?: string): void {
        this.setProperty(PropertyId.SpeechServiceConnection_ProxyHostName, proxyHostName);
        this.setProperty(PropertyId.SpeechServiceConnection_ProxyPort, `${proxyPort}`);
        if (proxyUserName) {
            this.setProperty(PropertyId.SpeechServiceConnection_ProxyUserName, proxyUserName);
        }
        if (proxyPassword) {
            this.setProperty(PropertyId.SpeechServiceConnection_ProxyPassword, proxyPassword);
        }
    }

    /**
     * Provides access to custom properties.
     * @member DialogServiceConfig.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The properties.
     */
    public get properties(): PropertyCollection {
        return this.privSpeechProperties;
    }

    /**
     * Dispose of associated resources.
     * @member DialogServiceConfig.prototype.close
     * @function
     * @public
     */
    public close(): void {
        return;
    }
}
