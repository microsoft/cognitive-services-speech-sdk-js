// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    CognitiveSubscriptionKeyAuthentication,
    CognitiveTokenAuthentication,
    Context,
    IAuthentication,
    IConnectionFactory,
    OS,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig,
} from "../common.speech/Exports";
import {
    marshalPromiseToCallbacks
} from "../common/Exports";
import {
    Contracts
} from "./Contracts";
import {
    AudioConfig,
    PropertyCollection,
    PropertyId,
    RecognitionEventArgs,
    SessionEventArgs
} from "./Exports";

/**
 * Defines the base class Client which mainly contains common client/recognizer methods and instantiations.
 * @class Client
 */
export abstract class Client {
    protected privDisposed: boolean;
    protected audioConfig: AudioConfig;
    protected privReco: ServiceRecognizerBase;
    protected privProperties: PropertyCollection;
    private privConnectionFactory: IConnectionFactory;

    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {AudioConfig} audioInput - An optional audio input stream associated with the recognizer
     */
    protected constructor(audioConfig: AudioConfig, properties: PropertyCollection, connectionFactory: IConnectionFactory) {
        this.audioConfig = (audioConfig !== undefined) ? audioConfig : AudioConfig.fromDefaultMicrophoneInput();
        this.privDisposed = false;
        this.privProperties = properties.clone();
        this.privConnectionFactory = connectionFactory;
        this.implCommonSetup();
    }

    /**
     * Dispose of associated resources.
     * @member Client.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, errorCb?: (error: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposed);
        marshalPromiseToCallbacks(this.dispose(true), cb, errorCb);
    }

    /**
     * @Internal
     * Internal data member to support fromRecognizer* pattern methods on other classes.
     * Do not use externally, object returned will change without warning or notice.
     */
    public get internalData(): object {
        return this.privReco;
    }

    /**
     * This method performs cleanup of resources.
     * The Boolean parameter disposing indicates whether the method is called
     * from Dispose (if disposing is true) or from the finalizer (if disposing is false).
     * Derived classes should override this method to dispose resource if needed.
     * @member Client.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - Flag to request disposal.
     */
    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposed) {
            return;
        }

        this.privDisposed = true;

        if (disposing) {
            if (this.privReco) {
                await this.privReco.audioSource.turnOff();
                await this.privReco.dispose();
            }
        }
    }

    /**
     * This method returns the current state of the telemetry setting.
     * @member Client.prototype.telemetryEnabled
     * @function
     * @public
     * @returns true if the telemetry is enabled, false otherwise.
     */
    public static get telemetryEnabled(): boolean {
        return ServiceRecognizerBase.telemetryDataEnabled;
    }

    /**
     * This method globally enables or disables telemetry.
     * @member Client.prototype.enableTelemetry
     * @function
     * @public
     * @param enabled - Global setting for telemetry collection.
     * If set to true, telemetry information like microphone errors,
     * recognition errors are collected and sent to Microsoft.
     * If set to false, no telemetry is sent to Microsoft.
     */
    public static enableTelemetry(enabled: boolean): void {
        ServiceRecognizerBase.telemetryDataEnabled = enabled;
    }

    /**
     * Defines event handler for session started events.
     * @member Client.prototype.sessionStarted
     * @function
     * @public
     */
    public sessionStarted: (sender: Client, event: SessionEventArgs) => void;

    /**
     * Defines event handler for session stopped events.
     * @member Recognizer.prototype.sessionStopped
     * @function
     * @public
     */
    public sessionStopped: (sender: Client, event: SessionEventArgs) => void;

    /**
     * Defines event handler for speech started events.
     * @member Client.prototype.speechStartDetected
     * @function
     * @public
     */
    public speechStartDetected: (sender: Client, event: RecognitionEventArgs) => void;

    /**
     * Defines event handler for speech stopped events.
     * @member Client.prototype.speechEndDetected
     * @function
     * @public
     */
    public speechEndDetected: (sender: Client, event: RecognitionEventArgs) => void;

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // Move to independent class
    // ################################################################################################################
    //
    protected createConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(speechConfig, this.privProperties);
    }

    // Creates the correct service recognizer for the type
    protected abstract createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase;

    // Does the generic recognizer setup that is common across all recognizer types.
    protected implCommonSetup(): void {

        let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        let osName = "unknown";
        let osVersion = "unknown";

        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }

        const clientConfig = this.createConfig(
            new SpeechServiceConfig(
                new Context(new OS(osPlatform, osName, osVersion))));

        this.privReco = this.createServiceRecognizer(
            Client.getAuthFromProperties(this.privProperties),
            this.privConnectionFactory,
            this.audioConfig,
            clientConfig);
    }

    protected static getAuthFromProperties(properties: PropertyCollection): IAuthentication {
        const subscriptionKey = properties.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        const authentication = (subscriptionKey && subscriptionKey !== "") ?
            new CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new CognitiveTokenAuthentication(
                (): Promise<string> => {
                    const authorizationToken = properties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                },
                (): Promise<string> => {
                    const authorizationToken = properties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return Promise.resolve(authorizationToken);
                });

        return authentication;
    }
}
