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
    SpeechServiceConfig,
} from "../common.speech/Exports";
import { Promise, PromiseHelper } from "../common/Exports";
import { Contracts } from "./Contracts";
import {
    AudioConfig,
    Connection,
    PropertyCollection,
    PropertyId,
    RecognitionEventArgs,
    SessionEventArgs,
    SpeechRecognitionResult,
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

    protected recognizeOnceAsyncImpl(recognitionMode: RecognitionMode, cb?: (e: SpeechRecognitionResult) => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privDisposed);

            this.implRecognizerStop().on((_: boolean): void => {
                try {
                    this.privReco.recognize(recognitionMode, (e: SpeechRecognitionResult) => {
                        this.implRecognizerStop().on((_: boolean): void => {
                            if (!!cb) {
                                cb(e);
                            }
                        }, (error: string): void => {
                            if (!!err) {
                                err(error);
                            }
                        });

                    }, (e: string) => {
                        this.implRecognizerStop(); // We're already in an error path so best effort here.
                        if (!!err) {
                            err(e);
                        }
                    /* tslint:disable:no-empty */
                    }).on((_: boolean): void => { },
                        (error: string) => {
                            if (!!err) {
                                err(error);
                            }
                        });
                } catch (error) {
                    if (!!err) {
                        if (error instanceof Error) {
                            const typedError: Error = error as Error;
                            err(typedError.name + ": " + typedError.message);
                        } else {
                            err(error);
                        }
                    }

                    // Destroy the recognizer.
                    this.dispose(true);
                }
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
            });
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the recognizer.
            this.dispose(true);
        }
    }

    public startContinuousRecognitionAsyncImpl(recognitionMode: RecognitionMode, cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privDisposed);

            this.implRecognizerStop().on((_: boolean): void => {
                this.privReco.recognize(recognitionMode, undefined, undefined).on((_: boolean): void => {
                    // report result to promise.
                    if (!!cb) {
                        try {
                            cb();
                        } catch (e) {
                            if (!!err) {
                                err(e);
                            }
                        }
                        cb = undefined;
                    }
                }, (error: string): void => {
                    if (!!err) {
                        err(error);
                    }
                    // Destroy the recognizer.
                    this.dispose(true);
                });
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
                // Destroy the recognizer.
                this.dispose(true);
            });
        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the recognizer.
            this.dispose(true);
        }
    }

    protected stopContinuousRecognitionAsyncImpl(cb?: () => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privDisposed);

            this.implRecognizerStop().on((_: boolean) => {
                if (!!cb) {
                    try {
                        cb();
                    } catch (e) {
                        if (!!err) {
                            err(e);
                        }
                    }
                }
            }, (error: string) => {
                if (!!err) {
                    err(error);
                }
            });

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);
                } else {
                    err(error);
                }
            }

            // Destroy the recognizer.
            this.dispose(true);
        }
    }

    protected implRecognizerStop(): Promise<boolean> {
        if (this.privReco) {
            return this.privReco.stopRecognizing();
        }
        return PromiseHelper.fromResult(true);
    }
}
