// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports.js";
import {
    Deferred,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    MessageType,
} from "../common/Exports.js";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat.js";
import { SpeakerRecognitionModel } from "../sdk/SpeakerRecognitionModel.js";
import {
    CancellationErrorCode,
    CancellationReason,
    SpeakerRecognitionResult,
    SpeakerRecognizer,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SessionEventArgs,
} from "../sdk/Exports.js";
import {
    CancellationErrorCodePropertyName,
    ISpeechConfigAudioDevice,
    SpeakerResponse,
    ServiceRecognizerBase,
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";
import { IConnectionFactory } from "./IConnectionFactory.js";
import { RecognizerConfig } from "./RecognizerConfig.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

interface SpeakerContext {
    scenario: string;
    profileIds: string[];
    features: {
        interimResult: string;
        progressiveDetection: string;
    };
}

// eslint-disable-next-line max-classes-per-file
export class SpeakerServiceRecognizer extends ServiceRecognizerBase {
    private privSpeakerRecognizer: SpeakerRecognizer;
    private privSpeakerAudioSource: IAudioSource;
    private privResultDeferral: Deferred<SpeakerRecognitionResult>;
    private privSpeakerModel: SpeakerRecognitionModel;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: SpeakerRecognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.privSpeakerRecognizer = recognizer;
        this.privSpeakerAudioSource = audioSource;
        this.recognizeSpeaker = (model: SpeakerRecognitionModel): Promise<SpeakerRecognitionResult> => this.recognizeSpeakerOnce(model);
        this.sendPrePayloadJSONOverride = (): Promise<void> => this.noOp();
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let processed: boolean = false;

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        switch (connectionMessage.path.toLowerCase()) {
            case "speaker.response":
                const response: SpeakerResponse = JSON.parse(connectionMessage.textBody) as SpeakerResponse;
                let result: SpeakerRecognitionResult;
                if (response.status.statusCode.toLowerCase() !== "success") {
                    result = new SpeakerRecognitionResult(
                        response,
                        ResultReason.Canceled,
                        CancellationErrorCode.ServiceError,
                        response.status.reason
                        );
                } else {
                    result = new SpeakerRecognitionResult(
                        response,
                        ResultReason.RecognizedSpeaker,
                        );
                }
                if (!!this.privResultDeferral) {
                    this.privResultDeferral.resolve(result);
                }
                processed = true;
                break;
            default:
                break;
        }
        const defferal = new Deferred<boolean>();
        defferal.resolve(processed);
        return defferal.promise;
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {

        const properties: PropertyCollection = new PropertyCollection();
        properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

        if (!!this.privResultDeferral) {
            const result: SpeakerRecognitionResult = new SpeakerRecognitionResult(
                {
                    scenario: this.privSpeakerModel.scenario,
                    status: { statusCode: error, reason: error }
                },
                ResultReason.Canceled,
                errorCode,
                error
                );
            try {
                this.privResultDeferral.resolve(result);
            } catch (error) {
                this.privResultDeferral.reject(error as string);
            }
        }
    }

    public async recognizeSpeakerOnce(model: SpeakerRecognitionModel): Promise<SpeakerRecognitionResult> {
        this.privSpeakerModel = model;
        this.voiceProfileType = model.scenario;
        if (!this.privResultDeferral) {
            this.privResultDeferral = new Deferred<SpeakerRecognitionResult>();
        }
        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privSpeakerAudioSource.events);

        this.privRecognizerConfig.parameters.setProperty(PropertyId.Speech_SessionId, this.privRequestSession.sessionId);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();

        const preAudioPromise: Promise<void> = this.sendPreAudioMessages(this.extractSpeakerContext(model));

        const node: IAudioStreamNode = await this.privSpeakerAudioSource.attach(this.privRequestSession.audioNodeId);
        const format: AudioStreamFormatImpl = await this.privSpeakerAudioSource.format;
        const deviceInfo: ISpeechConfigAudioDevice = await this.privSpeakerAudioSource.deviceInfo;

        const audioNode = new ReplayableAudioNode(node, format.avgBytesPerSec);
        await this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);

        this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

        try {
            await conPromise;
            await preAudioPromise;
        } catch (err) {
            this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.ConnectionFailure, err as string);
        }

        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);

        if (!!this.privRecognizer.sessionStarted) {
            this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
        }

        void this.receiveMessage();
        const audioSendPromise = this.sendAudio(audioNode);

        // /* eslint-disable no-empty */
        audioSendPromise.then((): void => { /* add? return true;*/ }, (error: string): void => {
            this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        });

        return this.privResultDeferral.promise;
    }

    private async sendPreAudioMessages(context: SpeakerContext): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        await this.sendSpeakerRecognition(connection, context);
        // await this.sendWaveHeader(connection);
    }

    private async sendSpeakerRecognition(connection: IConnection, context: SpeakerContext): Promise<void> {
        const speakerContextJson = JSON.stringify(context);
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "speaker.context",
            this.privRequestSession.requestId,
            "application/json; charset=utf-8",
            speakerContextJson));
    }

    private extractSpeakerContext(model: SpeakerRecognitionModel): SpeakerContext {
        return {
            features: {
                interimResult: "enabled",
                progressiveDetection: "disabled",
            },
            profileIds: model.profileIds,
            scenario: model.scenario,
        };
    }
}
