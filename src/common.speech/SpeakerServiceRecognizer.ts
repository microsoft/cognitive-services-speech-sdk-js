// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    Deferred,
    IAudioSource,
    MessageType,
} from "../common/Exports";
import {
    CancellationErrorCode,
    CancellationReason,
    SpeakerRecognitionCanceledEventArgs,
    SpeakerRecognitionEventArgs,
    SpeakerRecognitionResult,
    SpeakerRecognizer,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SessionEventArgs,
    SpeakerIdentificationModel,
    SpeakerRecognitionResultType,
    SpeakerVerificationModel,
} from "../sdk/Exports";
import {
    CancellationErrorCodePropertyName,
    EnumTranslation,
    SpeakerResponse,
    ServiceRecognizerBase,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

// eslint-disable-next-line max-classes-per-file
export class SpeakerServiceRecognizer extends ServiceRecognizerBase {
    private privSpeakerRecognizer: SpeakerRecognizer;
    private privSpeakerDataSent: boolean;
    private privPendingSpeakerArgs: SpeakerRecognitionEventArgs;
    private privResultDeferral: Deferred<SpeakerRecognitionResult>;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: SpeakerRecognizer) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.privSpeakerRecognizer = recognizer;
        this.privSpeakerDataSent = false;
        this.recognizeSpeaker = (model: SpeakerIdentificationModel | SpeakerVerificationModel): Promise<SpeakerRecognitionResult> => this.recognizeSpeakerOnce(model);
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let result: SpeakerRecognitionResult;
        let ev: SpeakerRecognitionEventArgs;
        let processed: boolean = false;

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        switch (connectionMessage.path.toLowerCase()) {
            case "speaker.response":
                const response = SpeakerResponse.fromJSON(connectionMessage.textBody);
                result = new SpeakerRecognitionResult(
                    SpeakerRecognitionResultType.Identify,
                    connectionMessage.textBody,
                    // response.identificationResult ? response.identificationResult.identifiedProfile.profileId : response.verificationResult.profileId,
                    // response.identificationResult ? response.identificationResult.identifiedProfile.score : response.verificationResult.score,
                    "foo",
                    ResultReason.RecognizedSpeaker,
                    );
                if(!!this.privResultDeferral) {
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

        /*
        if (!!this.privSpeakerRecognizer.canceled) {

            const cancelEvent: RecognitionCanceledEventArgs = new SpeakerRecognitionCanceledEventArgs(
                cancellationReason,
                error,
                errorCode,
                undefined,
                undefined,
                sessionId);
            try {
                this.privSpeakerRecognizer.canceled(this.privIntentRecognizer, cancelEvent);
            } catch { }
        }
        */

        if (!!this.privResultDeferral) {
            const result: SpeakerRecognitionResult = new SpeakerRecognitionResult(
                SpeakerRecognitionResultType.Identify,
                error,
                "",
                ResultReason.Canceled,
                );
            try {
                this.privResultDeferral.resolve(result);
                this.privResultDeferral = undefined;
                /* eslint-disable no-empty */
            } catch { }
        }
    }

    public async recognizeSpeakerOnce(model: SpeakerIdentificationModel | SpeakerVerificationModel): Promise<SpeakerRecognitionResult> {
        if (!this.privResultDeferral) {
            this.privResultDeferral = new Deferred<SpeakerRecognitionResult>();
        }
        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privDialogAudioSource.events);

        this.privRecognizerConfig.parameters.setProperty(PropertyId.Speech_SessionId, this.privRequestSession.sessionId);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();

        const preAudioPromise: Promise<void> = this.sendPreAudioMessages();

        const node: IAudioStreamNode = await this.privDialogAudioSource.attach(this.privRequestSession.audioNodeId);
        const format: AudioStreamFormatImpl = await this.privDialogAudioSource.format;
        const deviceInfo: ISpeechConfigAudioDevice = await this.privDialogAudioSource.deviceInfo;

        const audioNode = new ReplayableAudioNode(node, format.avgBytesPerSec);
        await this.privRequestSession.onAudioSourceAttachCompleted(audioNode, false);

        this.privRecognizerConfig.SpeechServiceConfig.Context.audio = { source: deviceInfo };

        try {
            await conPromise;
            await preAudioPromise;
        } catch (error) {
            this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.ConnectionFailure, error as string);
            this.privResultDeferral.reject(error as string);
        }

        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privRequestSession.sessionId);

        if (!!this.privRecognizer.sessionStarted) {
            this.privRecognizer.sessionStarted(this.privRecognizer, sessionStartEventArgs);
        }

        const audioSendPromise = this.sendAudio(audioNode);

        // /* eslint-disable no-empty */
        audioSendPromise.then((): void => { /* add? return true;*/ }, (error: string): void => {
            this.cancelRecognition(this.privRequestSession.sessionId, this.privRequestSession.requestId, CancellationReason.Error, CancellationErrorCode.RuntimeError, error);
        });

        return this.privResultDeferral.promise;
    }

}
