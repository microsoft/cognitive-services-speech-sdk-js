// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {
    TokenCredential
} from "@azure/core-auth";
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
} from "../common.speech/Exports.js";
import { RecognitionMode } from "../common.speech/ServiceMessages/PhraseDetection/PhraseDetectionContext.js";
import {
    Deferred,
    marshalPromiseToCallbacks
} from "../common/Exports.js";
import {
    Contracts
} from "./Contracts.js";
import {
    AudioConfig,
    PropertyCollection,
    PropertyId,
    RecognitionEventArgs,
    SessionEventArgs,
    SpeechRecognitionResult,
} from "./Exports.js";

/**
 * Defines the base class Recognizer which mainly contains common event handlers.
 * @class Recognizer
 */
export abstract class Recognizer {
    private privDisposed: boolean;
    protected audioConfig: AudioConfig;
    protected privReco: ServiceRecognizerBase;
    protected privProperties: PropertyCollection;
    protected tokenCredential?: TokenCredential;
    private privConnectionFactory: IConnectionFactory;

    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {AudioConfig} audioInput - An optional audio input stream associated with the recognizer
     * @param {PropertyCollection} properties - A set of properties to set on the recognizer
     * @param {IConnectionFactory} connectionFactory - The factory class used to create a custom IConnection for the recognizer
     */
    protected constructor(audioConfig: AudioConfig, properties: PropertyCollection, connectionFactory: IConnectionFactory, tokenCredential?: TokenCredential) {
        this.audioConfig = (audioConfig !== undefined) ? audioConfig : AudioConfig.fromDefaultMicrophoneInput();
        this.privDisposed = false;
        this.privProperties = properties.clone();
        this.privConnectionFactory = connectionFactory;
        this.tokenCredential = tokenCredential;
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
     * @member Recognizer.prototype.dispose
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
    public static enableTelemetry(enabled: boolean): void {
        ServiceRecognizerBase.telemetryDataEnabled = enabled;
    }

    //
    // ################################################################################################################
    // IMPLEMENTATION.
    // Move to independent class
    // ################################################################################################################
    //
    protected abstract createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig;

    // Creates the correct service recognizer for the type
    protected abstract createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase;

    // Does the generic recognizer setup that is common across all recognizer types.
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

        this.privReco = this.createServiceRecognizer(
            Recognizer.getAuth(this.privProperties, this.tokenCredential),
            this.privConnectionFactory,
            this.audioConfig,
            recognizerConfig);
    }

    protected async recognizeOnceAsyncImpl(recognitionMode: RecognitionMode): Promise<SpeechRecognitionResult> {
        Contracts.throwIfDisposed(this.privDisposed);
        const ret: Deferred<SpeechRecognitionResult> = new Deferred<SpeechRecognitionResult>();

        await this.implRecognizerStop();
        await this.privReco.recognize(recognitionMode, ret.resolve, ret.reject);
        const result: SpeechRecognitionResult = await ret.promise;
        await this.implRecognizerStop();

        return result;

    }

    protected async startContinuousRecognitionAsyncImpl(recognitionMode: RecognitionMode): Promise<void> {
        Contracts.throwIfDisposed(this.privDisposed);

        await this.implRecognizerStop();
        await this.privReco.recognize(recognitionMode, undefined, undefined);
    }

    protected async stopContinuousRecognitionAsyncImpl(): Promise<void> {
        Contracts.throwIfDisposed(this.privDisposed);
        await this.implRecognizerStop();
    }

    protected async implRecognizerStop(): Promise<void> {
        if (this.privReco) {
            await this.privReco.stopRecognizing();
        }
        return;
    }

    protected static getAuth(properties: PropertyCollection, tokenCredential?: TokenCredential): IAuthentication {
        const subscriptionKey = properties.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        if (subscriptionKey && subscriptionKey !== "") {
            return new CognitiveSubscriptionKeyAuthentication(subscriptionKey);
        }

        if (tokenCredential) {
            return new CognitiveTokenAuthentication(
                async (): Promise<string> => {
                    try {
                        const tokenResponse = await tokenCredential.getToken("https://cognitiveservices.azure.com/.default");
                        return tokenResponse?.token ?? "";
                    } catch (err) {
                        throw err;
                    }
                },
                async (): Promise<string> => {
                    try {
                        const tokenResponse = await tokenCredential.getToken("https://cognitiveservices.azure.com/.default");
                        return tokenResponse?.token ?? "";
                    } catch (err) {
                        throw err;
                    }
                }
            );
        }

        return new CognitiveTokenAuthentication(
            (): Promise<string> => {
                const authorizationToken = properties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                return Promise.resolve(authorizationToken);
            },
            (): Promise<string> => {
                const authorizationToken = properties.getProperty(PropertyId.SpeechServiceAuthorization_Token, undefined);
                return Promise.resolve(authorizationToken);
            }
        );
    }
}
