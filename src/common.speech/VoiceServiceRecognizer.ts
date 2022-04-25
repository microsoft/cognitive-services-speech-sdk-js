// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports";
import {
    Deferred,
    IAudioSource,
    IAudioStreamNode,
    IConnection,
    MessageType,
} from "../common/Exports";
import { AudioStreamFormatImpl } from "../sdk/Audio/AudioStreamFormat";
import { SpeakerRecognitionModel } from "../sdk/SpeakerRecognitionModel";
import {
    CancellationErrorCode,
    CancellationReason,
    SpeakerRecognitionResult,
    VoiceProfileClient,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SessionEventArgs,
    SpeakerRecognitionResultType,
    VoiceProfilePhraseResult,
    VoiceProfileResult,
    VoiceProfileType
} from "../sdk/Exports";
import {
    CancellationErrorCodePropertyName,
    ISpeechConfigAudioDevice,
    ProfilePhraseResponse,
    ProfileResponse,
    ServiceRecognizerBase,
} from "./Exports";
import { IAuthentication } from "./IAuthentication";
import { IConnectionFactory } from "./IConnectionFactory";
import { RecognizerConfig } from "./RecognizerConfig";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal";

interface CreateProfile {
    scenario: string;
    locale: string;
}

interface PhraseRequest {
    scenario: string;
    locale: string;
}

interface SpeakerContext {
    scenario: string;
    profileIds: string[];
    features: {
        interimResult: string;
        progressiveDetection: string;
    };
}

// eslint-disable-next-line max-classes-per-file
export class VoiceServiceRecognizer extends ServiceRecognizerBase {
    private privVoiceProfileClient: VoiceProfileClient;
    private privSpeakerAudioSource: IAudioSource;
    private privResultDeferral: Deferred<SpeakerRecognitionResult>;
    private privSpeakerModel: SpeakerRecognitionModel;
    private  privCreateProfileDeferralMap: { [id: string]: Deferred<string> } = {};
    private  privPhraseRequestDeferralMap: { [id: string]: Deferred<VoiceProfilePhraseResult> } = {};
    private  privProfileResultDeferralMap: { [id: string]: Deferred<VoiceProfileResult> } = {};

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: VoiceProfileClient) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.privVoiceProfileClient = recognizer;
        this.privSpeakerAudioSource = audioSource;
        this.recognizeSpeaker = (model: SpeakerRecognitionModel): Promise<SpeakerRecognitionResult> => this.recognizeSpeakerOnce(model);
        this.sendPrePayloadJSONOverride = (): Promise<void> => this.noOp();
    }

    public set SpeakerAudioSource(audioSource: IAudioSource) {
        this.privSpeakerAudioSource = audioSource;
    }

    protected processTypeSpecificMessages(connectionMessage: SpeechConnectionMessage): Promise<boolean> {

        let processed: boolean = false;

        const resultProps: PropertyCollection = new PropertyCollection();
        if (connectionMessage.messageType === MessageType.Text) {
            resultProps.setProperty(PropertyId.SpeechServiceResponse_JsonResult, connectionMessage.textBody);
        }

        switch (connectionMessage.path.toLowerCase()) {
            // Profile management response for create, fetch, delete, reset
            case "speaker.profiles":
                const response: ProfileResponse = JSON.parse(connectionMessage.textBody) as ProfileResponse;
                if (response.status.statusCode.toLowerCase() !== "success") {
                    throw new Error(`Voice Profile ${response.operation.toLowerCase()} failed with code: ${response.status.statusCode}, message: ${response.status.reason}`);
                }
                switch (response.operation.toLowerCase()) {
                    case "create":
                        this.handleCreateResponse(response, connectionMessage.requestId);
                        break;

                    case "delete":
                    case "reset":
                        this.handleResultResponse(response, connectionMessage.requestId);
                        break;

                    default:
                        break;
                }
                processed = true;
                break;
            // Activation and authorization phrase response
            case "speaker.phrases":
                const phraseResponse: ProfilePhraseResponse = JSON.parse(connectionMessage.textBody) as ProfilePhraseResponse;
                if (phraseResponse.status.statusCode.toLowerCase() !== "success") {
                    throw new Error(`Voice Profile get activation phrases failed with code: ${phraseResponse.status.statusCode}, message: ${phraseResponse.status.reason}`);
                }
                this.handlePhrasesResponse(phraseResponse, connectionMessage.requestId);
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
            } catch (error) {
                this.privResultDeferral.reject(error as string);
            }
        }
        */

        if (!!this.privResultDeferral) {
            const resultType = this.privSpeakerModel.scenario === "TextIndependentIdentification" ? SpeakerRecognitionResultType.Identify : SpeakerRecognitionResultType.Verify;
            const result: SpeakerRecognitionResult = new SpeakerRecognitionResult(
                resultType,
                error,
                this.privSpeakerModel.profileIds[0],
                ResultReason.Canceled,
                errorCode,
                );
            try {
                this.privResultDeferral.resolve(result);
            } catch (error) {
                this.privResultDeferral.reject(error as string);
            }
        }
    }

    public async createProfile(profileType: VoiceProfileType, locale: string): Promise<string> {
        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();
        try {
            const createProfileDeferral = new Deferred<string>();
            await conPromise;
            await this.sendCreateProfile(createProfileDeferral, profileType, locale);
            void this.receiveMessage();
            return createProfileDeferral.promise;
        } catch (err) {
            throw err;
        }
    }

    public async getActivationPhrases(profileType: VoiceProfileType, lang: string): Promise<VoiceProfilePhraseResult> {
        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();
        try {
            const getPhrasesDeferral = new Deferred<VoiceProfilePhraseResult>();
            await conPromise;
            await this.sendPhrasesRequest(getPhrasesDeferral, profileType, lang);
            void this.receiveMessage();
            return getPhrasesDeferral.promise;
        } catch (err) {
            throw err;
        }
    }

    public async recognizeSpeakerOnce(model: SpeakerRecognitionModel): Promise<SpeakerRecognitionResult> {
        this.privSpeakerModel = model;
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

        if (!!this.privClient.sessionStarted) {
            this.privClient.sessionStarted(this.privClient, sessionStartEventArgs);
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

    private async sendPhrasesRequest(getPhrasesDeferral: Deferred<VoiceProfilePhraseResult>, profileType: VoiceProfileType, locale: string): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        this.privRequestSession.onSpeechContext();
        this.privPhraseRequestDeferralMap[this.privRequestSession.requestId] = getPhrasesDeferral;
        const scenario = profileType === VoiceProfileType.TextIndependentIdentification ? "TextIndependentIdentification" :
            profileType === VoiceProfileType.TextIndependentVerification ? "TextIndependentVerification" : "TextDependentVerification";

        const profileCreateRequest: PhraseRequest = {
            locale,
            scenario,
        };
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "speaker.profile.phrases",
            this.privRequestSession.requestId,
            "application/json; charset=utf-8",
            JSON.stringify(profileCreateRequest)));
    }

    private async sendCreateProfile(createProfileDeferral: Deferred<string>, profileType: VoiceProfileType, locale: string): Promise<void> {

        const connection: IConnection = await this.fetchConnection();
        this.privRequestSession.onSpeechContext();
        this.privCreateProfileDeferralMap[this.privRequestSession.requestId] = createProfileDeferral;
        const scenario = profileType === VoiceProfileType.TextIndependentIdentification ? "TextIndependentIdentification" :
            profileType === VoiceProfileType.TextIndependentVerification ? "TextIndependentVerification" : "TextDependentVerification";

        const profileCreateRequest: CreateProfile = {
            locale,
            scenario,
        };
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "speaker.profile.create",
            this.privRequestSession.requestId,
            "application/json; charset=utf-8",
            JSON.stringify(profileCreateRequest)));
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

    private handlePhrasesResponse(response: ProfilePhraseResponse, requestId: string): void {
        if (!!response.phrases && response.phrases.length > 0) {
            if (!!this.privPhraseRequestDeferralMap[requestId]) {
                const reason: ResultReason = response.status.statusCode.toLowerCase() === "success" ? ResultReason.EnrollingVoiceProfile : ResultReason.Canceled;
                this.privPhraseRequestDeferralMap[requestId].resolve(new VoiceProfilePhraseResult(reason, response.status.statusCode, response.passPhraseType, response.phrases));
            } else {
                throw new Error(`Voice Profile get activation phrases request for requestID ${requestId} not found`);
            }
        } else {
            throw new Error("Voice Profile get activation phrases failed, no phrases received");
        }
    }

    private handleCreateResponse(response: ProfileResponse, requestId: string): void {
        if (!!response.profileId) {
            if (!!this.privCreateProfileDeferralMap[requestId]) {
                this.privCreateProfileDeferralMap[requestId].resolve(response.profileId);
            } else {
                throw new Error(`Voice Profile create request for requestID ${requestId} not found`);
            }
        } else {
            throw new Error("Voice Profile create failed, no profile id received");
        }
    }

    private handleResultResponse(response: ProfileResponse, requestId: string): void {
        if (!!this.privProfileResultDeferralMap[requestId]) {
            const successReason: ResultReason = response.operation.toLowerCase() === "delete" ? ResultReason.DeletedVoiceProfile : ResultReason.ResetVoiceProfile;
            const reason: ResultReason = response.status.statusCode.toLowerCase() === "success" ? successReason : ResultReason.Canceled;
            this.privProfileResultDeferralMap[requestId].resolve(new VoiceProfileResult(reason, `statusCode: ${response.status.statusCode}, errorDetails: ${response.status.reason}`));
        } else {
            throw new Error(`Voice Profile create request for requestID ${requestId} not found`);
        }
    }

}
