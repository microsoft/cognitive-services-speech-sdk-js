// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { DialogConnectionFactory } from "../common.speech/DialogConnectorFactory";
import {
    DialogServiceAdapter,
    IAgentConfig,
    IAuthentication,
    IConnectionFactory,
    RecognitionMode,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig,
} from "../common.speech/Exports";
import { ActivityReceivedEventArgs } from "./ActivityReceivedEventArgs";
import { AudioConfigImpl } from "./Audio/AudioConfig";
import { Contracts } from "./Contracts";
import { DialogServiceConfig, DialogServiceConfigImpl } from "./DialogServiceConfig";
import {
    AudioConfig,
    Recognizer,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult
} from "./Exports";

/**
 * Dialog Service Connector
 * @class DialogServiceConnector
 */
export class DialogServiceConnector extends Recognizer {
    private privIsDisposed: boolean;

    /**
     * Initializes an instance of the DialogServiceConnector.
     * @constructor
     * @param {DialogServiceConfig} speechConfig - Set of properties to configure this recognizer.
     * @param {AudioConfig} audioConfig - An optional audio config associated with the recognizer
     */
    public constructor(dialogConfig: DialogServiceConfig, audioConfig?: AudioConfig) {
        const dialogServiceConfigImpl = dialogConfig as DialogServiceConfigImpl;
        Contracts.throwIfNull(dialogConfig, "dialogConfig");

        super(audioConfig, dialogServiceConfigImpl.properties, new DialogConnectionFactory());

        this.privIsDisposed = false;
        this.privProperties = dialogServiceConfigImpl.properties.clone();
    }

    /**
     * The event recognizing signals that an intermediate recognition result is received.
     * @member DialogServiceConnector.prototype.recognizing
     * @function
     * @public
     */
    public recognizing: (sender: DialogServiceConnector, event: SpeechRecognitionEventArgs) => void;

    /**
     * The event recognized signals that a final recognition result is received.
     * @member DialogServiceConfig.prototype.recognized
     * @function
     * @public
     */
    public recognized: (sender: DialogServiceConnector, event: SpeechRecognitionEventArgs) => void;

    /**
     * The event canceled signals that an error occurred during recognition.
     * @member DialogServiceConnector.prototype.canceled
     * @function
     * @public
     */
    public canceled: (sender: DialogServiceConnector, event: SpeechRecognitionCanceledEventArgs) => void;

    /**
     * The event activityReceived signals that an activity has been received.
     * @member DialogServiceConnector.prototype.activityReceived
     * @function
     * @public
     */
    public activityReceived: (sender: DialogServiceConnector, event: ActivityReceivedEventArgs) => void;

    /**
     * Starts a connection to the service.
     * Users can optionally call connect() to manually set up a connection in advance, before starting interactions.
     *
     * Note: On return, the connection might not be ready yet. Please subscribe to the Connected event to
     * be notified when the connection is established.
     * @member DialogServiceConnector.prototype.connect
     * @function
     * @public
     */
    public connect(): void {
        this.privReco.connect();
    }

    /**
     * Closes the connection the service.
     * Users can optionally call disconnect() to manually shutdown the connection of the associated DialogServiceConnector.
     *
     * If disconnect() is called during a recognition, recognition will fail and cancel with an error.
     */
    public disconnect(): void {
        this.privReco.disconnect();
    }

    /**
     * Starts recognition and stops after the first utterance is recognized.
     * @member DialogServiceConnector.prototype.listenOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the result when the reco has completed.
     * @param err - Callback invoked in case of an error.
     */
    public listenOnceAsync(cb?: (e: SpeechRecognitionResult) => void, err?: (e: string) => void): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);

            this.implRecognizerStop();

            const agentConfig = this.buildAgentConfig();
            this.privReco.agentConfig.set(agentConfig);

            this.implRecognizerStart(
                RecognitionMode.Conversation,
                (e: SpeechRecognitionResult) => {
                    this.implRecognizerStop();

                    if (!!cb) {
                        cb(e);
                    }
                },
                (e: string) => {
                    this.implRecognizerStop();
                    if (!!err) {
                        err(e);
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

    public sendActivity(activity: string, cb: (interactionId: string) => void): void {
        return;
    }

    /**
     * closes all external resources held by an instance of this class.
     * @member DialogServiceConnector.prototype.close
     * @function
     * @public
     */
    public close(): void {
        Contracts.throwIfDisposed(this.privIsDisposed);

        this.dispose(true);
    }

    protected dispose(disposing: boolean): boolean {
        if (this.privIsDisposed) {
            return;
        }

        if (disposing) {
            this.implRecognizerStop();
            this.privIsDisposed = true;
            super.dispose(disposing);
        }
}

    protected createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(speechConfig, this.privProperties);
    }

    protected createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase {

        const audioSource: AudioConfigImpl = audioConfig as AudioConfigImpl;

        return new DialogServiceAdapter(authentication, connectionFactory, audioSource, recognizerConfig, this);
    }

    private buildAgentConfig(): IAgentConfig {
        return {
            botInfo: {
                commType: "Default",
                connectionId: ""
            },
            version: 0.2
        };
    }
}
