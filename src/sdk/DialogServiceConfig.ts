// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { OutputFormatPropertyName } from "../common.speech/Exports";
import { Contracts } from "./Contracts";
import { OutputFormat, PropertyCollection, PropertyId, SpeechConfig } from "./Exports";

/**
 * Dialog Service configuration.
 * @class DialogServiceConfig
 */
export abstract class DialogServiceConfig extends SpeechConfig {

    /**
     * Creates an instance of DialogService config.
     * @constructor
     */
    protected constructor() {
        super();
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

        const configImpl: DialogServiceConfigImpl = new DialogServiceConfigImpl();
        configImpl.setProperty(PropertyId.Conversation_ApplicationId, botSecret);
        configImpl.setProperty(PropertyId.Conversation_DialogType, "bot_framework");
        configImpl.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        configImpl.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return configImpl;
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

        const configImpl: DialogServiceConfigImpl = new DialogServiceConfigImpl();
        configImpl.setProperty(PropertyId.Conversation_ApplicationId, appId);
        configImpl.setProperty(PropertyId.Conversation_DialogType, "bot_framework");
        configImpl.setProperty(PropertyId.SpeechServiceConnection_Key, subscriptionKey);
        configImpl.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return configImpl;
    }

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

}

/**
 * Dialog Service configuration.
 * @class DialogServiceConfigImpl
 */
// tslint:disable-next-line:max-classes-per-file
export class DialogServiceConfigImpl extends DialogServiceConfig {

    private privSpeechProperties: PropertyCollection;

    /**
     * Creates an instance of dialogService config.
     */
    public constructor() {
        super();
        this.privSpeechProperties = new PropertyCollection();
    }

    /**
     * Provides access to custom properties.
     * @member DialogServiceConfigImpl.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The properties.
     */
    public get properties(): PropertyCollection {
        return this.privSpeechProperties;
    }

    /**
     * Gets/Sets the corresponding backend application identifier.
     * @member DialogServiceConfigImpl.prototype.Conversation_ApplicationId
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
     * @member DialogServiceConfigImpl.prototype.speechRecognitionLanguage
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
     * @member DialogServiceConfigImpl.prototype.outputFormat
     * @function
     * @public
     * @param {OutputFormat} - The output format to set.
     */
    public set outputFormat(value: OutputFormat) {
        this.setProperty(OutputFormatPropertyName, `${value}`);
    }

    /**
     * Sets a named property as value
     * @member DialogServiceConfigImpl.prototype.setProperty
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
     * @member DialogServiceConfigImpl.prototype.getProperty
     * @function
     * @public
     * @param {PropertyId | string} name - The property to get.
     * @param {string} def - The default value to return in case the property is not known.
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
     * @param proxyPort The port number of the proxy server.
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

    public get subscriptionKey(): string {
        throw new Error("Method not implemented.");
    }
    public get region(): string {
        throw new Error("Method not implemented.");
    }
    public setServiceProperty(name: string, value: string, channel: import("./ServicePropertyChannel").ServicePropertyChannel): void {
        throw new Error("Method not implemented.");
    }
    public setProfanity(profanity: import("./ProfanityOption").ProfanityOption): void {
        throw new Error("Method not implemented.");
    }
    public enableAudioLogging(): void {
        throw new Error("Method not implemented.");
    }
    public requestWordLevelTimestamps(): void {
        throw new Error("Method not implemented.");
    }
    public enableDictation(): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Dispose of associated resources.
     * @member DialogServiceConfigImpl.prototype.close
     * @function
     * @public
     */
    public close(): void {
        return;
    }

}
