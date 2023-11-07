// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { Contracts } from "./Contracts.js";
import { PropertyCollection, PropertyId, ServicePropertyChannel, SpeechConfigImpl } from "./Exports.js";
import { OutputFormat } from "./OutputFormat.js";

/**
 * Class that defines base configurations for dialog service connector
 * @class DialogServiceConfig
 */
export abstract class DialogServiceConfig {

    /**
     * Creates an instance of DialogService config.
     * @constructor
     */
    protected constructor() {
        return;
    }

    /**
     * Sets an arbitrary property.
     * @member DialogServiceConfig.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property to set.
     * @param {string} value - The new value of the property.
     */
    public abstract setProperty(name: string | PropertyId, value: string): void;

    /**
     * Returns the current value of an arbitrary property.
     * @member DialogServiceConfig.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property to query.
     * @param {string} def - The value to return in case the property is not known.
     * @returns {string} The current value, or provided default, of the given property.
     */
    public abstract getProperty(name: string | PropertyId, def?: string): string;

    /**
     * @member DialogServiceConfig.prototype.setServiceProperty
     * @function
     * @public
     * @param {name} The name of the property.
     * @param {value} Value to set.
     * @param {channel} The channel used to pass the specified property to service.
     * @summary Sets a property value that will be passed to service using the specified channel.
     */
    public abstract setServiceProperty(name: string, value: string, channel: ServicePropertyChannel): void;

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
     * @param porxyPort The port number of the proxy server.
     * @param proxyUserName The user name of the proxy server.
     * @param proxyPassword The password of the proxy server.
     */
    public abstract setProxy(proxyHostName: string, proxyPort: number, proxyUserName: string, proxyPassword: string): void;

    /**
     * Returns the configured language.
     * @member DialogServiceConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     */
    public abstract get speechRecognitionLanguage(): string;

    /**
     * Gets/Sets the input language.
     * @member DialogServiceConfig.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The language to use for recognition.
     */
    public abstract set speechRecognitionLanguage(value: string);

    /**
     * Sets the corresponding backend application identifier.
     * @member DialogServiceConfig.prototype.Conversation_ApplicationId
     * @function
     * @public
     * @param {string} value - The application identifier to set.
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public set applicationId(value: string) { }

    public static get DialogTypes(): { BotFramework: string; CustomCommands: string } {
        return {
            BotFramework: "bot_framework",
            CustomCommands: "custom_commands"
        };
    }
}

/**
 * Dialog Service configuration.
 * @class DialogServiceConfigImpl
 */
export class DialogServiceConfigImpl extends DialogServiceConfig {

    private privSpeechConfig: SpeechConfigImpl;

    /**
     * Creates an instance of dialogService config.
     */
    public constructor() {
        super();
        this.privSpeechConfig = new SpeechConfigImpl();
    }

    /**
     * Provides access to custom properties.
     * @member DialogServiceConfigImpl.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The properties.
     */
    public get properties(): PropertyCollection {
        return this.privSpeechConfig.properties;
    }

    /**
     * Gets the speech recognition language.
     * @member DialogServiceConfigImpl.prototype.speechRecognitionLanguage
     * @function
     * @public
     */
    public get speechRecognitionLanguage(): string {
        return this.privSpeechConfig.speechRecognitionLanguage;
    }

    /**
     * Sets the speech recognition language.
     * @member DialogServiceConfigImpl.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @param {string} value - The language to set.
     */
    public set speechRecognitionLanguage(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "value");
        this.privSpeechConfig.speechRecognitionLanguage = value;
    }

    public get outputFormat(): OutputFormat {
        return this.privSpeechConfig.outputFormat;
    }

    public set outputFormat(value: OutputFormat) {
        this.privSpeechConfig.outputFormat = value;
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
        this.privSpeechConfig.setProperty(name, value);
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
        void def;
        return this.privSpeechConfig.getProperty(name);
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

    public setServiceProperty(name: string, value: string, channel: ServicePropertyChannel): void {
        void channel;
        this.privSpeechConfig.setServiceProperty(name, value);
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
