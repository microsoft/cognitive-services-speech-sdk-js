// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    CognitiveSubscriptionKeyAuthentication,
    CognitiveTokenAuthentication,
    Context,
    IAuthentication,
    IConnectionFactory,
    OS,
    RecognitionMode,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig
} from "../common.speech/Exports";
import { Promise, PromiseHelper } from "../common/Exports";
import { Contracts } from "./Contracts";
import {
    AudioConfig,
    PropertyCollection,
    PropertyId,
    RecognitionEventArgs,
    SessionEventArgs,
    SpeechRecognitionResult
} from "./Exports";

/**
 * Defines the base class Recognizer which mainly contains common event handlers.
 * @class Recognizer
 */
export abstract class Recognizer {
    private privDisposed: boolean;
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
        this.implCommonRecognizerSetup();
    }

    /**
     * Defines event handler for session started events.
     * @member Recognizer.prototype.sessionStarted
     * @function
     * @public
     */
    public sessionStarted: (sender: Recognizer, event: SessionEventArgs) => void;

    /**
     * Defines event handler for session stopped events.
     * @member Recognizer.prototype.sessionStopped
     * @function
     * @public
     */
    public sessionStopped: (sender: Recognizer, event: SessionEventArgs) => void;

    /**
     * Defines event handler for speech started events.
     * @member Recognizer.prototype.speechStartDetected
     * @function
     * @public
     */
    public speechStartDetected: (sender: Recognizer, event: RecognitionEventArgs) => void;

    /**
     * Defines event handler for speech stopped events.
     * @member Recognizer.prototype.speechEndDetected
     * @function
     * @public
     */
    public speechEndDetected: (sender: Recognizer, event: RecognitionEventArgs) => void;

    /**
     * Dispose of associated resources.
     * @member Recognizer.prototype.close
     * @function
     * @public
     */
    public close(): void {
        Contracts.throwIfDisposed(this.privDisposed);

        this.dispose(true);
    }

    /**
     * Mutes audio input.
     * @member Recognizer.prototype.mute
     * @function
     * @public
     */
    public mute(): void {
        this.audioConfig.mute();
    }

    /**
     * Unmutes audio input.
     * @member Recognizer.prototype.unmute
     * @function
     * @public
     */
    public unmute(): void {
        this.audioConfig.unmute();
    }

    /**
     * @Internal
     * Internal data member to support fromRecognizer* pattern methods on other classes.
     * Do not use externally, object returned will change without warning or notive.
     */
    public get internalData(): object {
        return this.privReco;
    }

    /**
     * This method performs cleanup of resources.
     * The Boolean parameter disposing indicates whether the method is called
     * from Dispose (if disposing is true) or from the finalizer (if disposing is false).
     * Derived classes should override this method to dispose resource if needed.
     * @member Recognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - Flag to request disposal.
     */
    protected dispose(disposing: boolean): void {
        if (this.privDisposed) {
            return;
        }

        if (disposing) {
            if (this.privReco) {
                this.privReco.audioSource.turnOff();
                this.privReco.dispose();
            }
        }

        this.privDisposed = true;
    }

    /**
     * This method returns the current state of the telemetry setting.
     * @member Recognizer.prototype.telemetryEnabled
     * @function
     * @public
     * @returns true if the telemetry is enabled, false otherwise.
     */
    public static get telemetryEnabled(): boolean {
        return ServiceRecognizerBase.telemetryDataEnabled;
    }

    /**
     * This method globally enables or disables telemetry.
     * @member Recognizer.prototype.enableTelemetry
     * @function
     * @public
     * @param enabled - Global setting for telemetry collection.
     * If set to true, telemetry information like microphone errors,
     * recognition errors are collected and sent to Microsoft.
     * If set to false, no telemetry is sent to Microsoft.
     */
    /* tslint:disable:member-ordering */
    public static enableTelemetry(enabled: boolean): void {
        ServiceRecognizerBase.telemetryDataEnabled = enabled;
    }

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // Move to independent class
    // ################################################################################################################
    //
    protected abstract createRecognizerConfig(speecgConfig: SpeechServiceConfig): RecognizerConfig;

    // Creates the correct service recognizer for the type
    protected abstract createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase;

    // Does the generic recognizer setup that is common accross all recognizer types.
    protected implCommonRecognizerSetup(): void {
        let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        let osName = "unknown";
        let osVersion = "unknown";

        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }

        const recognizerConfig = this.createRecognizerConfig(
            new SpeechServiceConfig(
                new Context(new OS(osPlatform, osName, osVersion))));

        const subscriptionKey = this.privProperties.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        const authentication = (subscriptionKey && subscriptionKey !== "") ?
            new CognitiveSubscriptionKeyAuthentication(subscriptionKey) :
            new CognitiveTokenAuthentication(
                (authFetchEventId: string): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return PromiseHelper.fromResult(authorizationToken);
                },
                (authFetchEventId: string): Promise<string> => {
                    const authorizationToken = this.privProperties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                    return PromiseHelper.fromResult(authorizationToken);
                });

        this.privReco = this.createServiceRecognizer(
            authentication,
            this.privConnectionFactory,
            this.audioConfig,
            recognizerConfig);
    }

    // Start the recognition
    protected implRecognizerStart(
        recognitionMode: RecognitionMode,
        successCallback: (e: SpeechRecognitionResult) => void,
        errorCallback: (e: string) => void): void {
        this.privReco.recognize(recognitionMode, successCallback, errorCallback).on(
            /* tslint:disable:no-empty */
            (result: boolean): void => { },
            (error: string): void => {
                if (!!errorCallback) {
                    // Internal error with service communication.
                    errorCallback("Runtime error: " + error);
                }
            });
    }

    protected implRecognizerStop(): void {
        if (this.privReco) {
            this.privReco.stopRecognizing();
        }
    }
}
