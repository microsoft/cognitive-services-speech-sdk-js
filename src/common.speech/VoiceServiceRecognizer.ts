// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ReplayableAudioNode } from "../common.browser/Exports.js";
import {
    DeferralMap,
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
    VoiceProfileClient,
    PropertyCollection,
    PropertyId,
    ResultReason,
    SessionEventArgs,
    VoiceProfileEnrollmentResult,
    VoiceProfilePhraseResult,
    VoiceProfileResult,
    VoiceProfileType,
    VoiceProfile
} from "../sdk/Exports.js";
import {
    CancellationErrorCodePropertyName,
    EnrollmentResponse,
    IProfile,
    ISpeechConfigAudioDevice,
    ProfilePhraseResponse,
    ProfileResponse,
    ServiceRecognizerBase,
} from "./Exports.js";
import { IAuthentication } from "./IAuthentication.js";
import { IConnectionFactory } from "./IConnectionFactory.js";
import { RecognizerConfig } from "./RecognizerConfig.js";
import { SpeechConnectionMessage } from "./SpeechConnectionMessage.Internal.js";

interface CreateProfile {
    scenario: string;
    locale: string;
    number: string;
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
    private privSpeakerAudioSource: IAudioSource;
    private privDeferralMap: DeferralMap = new DeferralMap();
    private privExpectedProfileId: string;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        recognizer: VoiceProfileClient) {
        super(authentication, connectionFactory, audioSource, recognizerConfig, recognizer);
        this.privSpeakerAudioSource = audioSource;
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
                switch (response.operation.toLowerCase()) {
                    case "create":
                        this.handleCreateResponse(response, connectionMessage.requestId);
                        break;

                    case "delete":
                    case "reset":
                        this.handleResultResponse(response, connectionMessage.requestId);
                        break;

                    case "fetch":
                        const enrollmentResponse: EnrollmentResponse = JSON.parse(connectionMessage.textBody) as EnrollmentResponse;
                        this.handleFetchResponse(enrollmentResponse, connectionMessage.requestId);
                        break;

                    default:
                        break;
                }
                processed = true;
                break;
            // Activation and authorization phrase response
            case "speaker.phrases":
                const phraseResponse: ProfilePhraseResponse = JSON.parse(connectionMessage.textBody) as ProfilePhraseResponse;
                this.handlePhrasesResponse(phraseResponse, connectionMessage.requestId);
                processed = true;
                break;
            // Enrollment response
            case "speaker.profile.enrollment":
                const enrollmentResponse: EnrollmentResponse = JSON.parse(connectionMessage.textBody) as EnrollmentResponse;
                const result: VoiceProfileEnrollmentResult = new VoiceProfileEnrollmentResult(
                    this.enrollmentReasonFrom(!!enrollmentResponse.enrollment ? enrollmentResponse.enrollment.enrollmentStatus : enrollmentResponse.status.statusCode),
                    !!enrollmentResponse.enrollment ? JSON.stringify(enrollmentResponse.enrollment) : undefined,
                    enrollmentResponse.status.reason,
                    );
                if (!!this.privDeferralMap.getId(connectionMessage.requestId)) {
                    this.privDeferralMap.complete<VoiceProfileEnrollmentResult>(connectionMessage.requestId, result);
                }
                this.privRequestSession.onSpeechEnded();
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
        // const enrollmentResponse: EnrollmentResponse = JSON.parse(connectionMessage.textBody) as EnrollmentResponse;
        properties.setProperty(CancellationErrorCodePropertyName, CancellationErrorCode[errorCode]);

            const result: VoiceProfileEnrollmentResult = new VoiceProfileEnrollmentResult(
                ResultReason.Canceled,
                error,
                error,
                );
            if (!!this.privDeferralMap.getId(requestId)) {
                this.privDeferralMap.complete<VoiceProfileEnrollmentResult>(requestId, result);
            }
    }

    public async createProfile(profileType: VoiceProfileType, locale: string): Promise<string[]> {
        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        this.voiceProfileType = profileType.toString();
        const conPromise: Promise<IConnection> = this.connectImpl();
        try {
            const createProfileDeferral = new Deferred<string[]>();
            await conPromise;
            await this.sendCreateProfile(createProfileDeferral, profileType, locale);
            void this.receiveMessage();
            return createProfileDeferral.promise;
        } catch (err) {
            throw err;
        }
    }

    public async resetProfile(profile: VoiceProfile): Promise<VoiceProfileResult> {
        this.voiceProfileType = profile.profileType.toString();
        return this.sendCommonRequest<VoiceProfileResult>("reset", profile.profileType, profile);
    }

    public async deleteProfile(profile: VoiceProfile): Promise<VoiceProfileResult> {
        this.voiceProfileType = profile.profileType.toString();
        return this.sendCommonRequest<VoiceProfileResult>("delete", profile.profileType, profile);
    }

    public async retrieveEnrollmentResult(profile: VoiceProfile): Promise<VoiceProfileEnrollmentResult> {
        this.voiceProfileType = profile.profileType.toString();
        this.privExpectedProfileId = profile.profileId;
        return this.sendCommonRequest<VoiceProfileEnrollmentResult>("fetch", profile.profileType, profile);
    }

    public async getAllProfiles(profileType: VoiceProfileType): Promise<VoiceProfileEnrollmentResult[]> {
        this.voiceProfileType = profileType.toString();
        return this.sendCommonRequest<VoiceProfileEnrollmentResult[]>("fetch", profileType);
    }

    public async getActivationPhrases(profileType: VoiceProfileType, lang: string): Promise<VoiceProfilePhraseResult> {
        this.voiceProfileType = profileType.toString();
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

    public async enrollProfile(profile: VoiceProfile): Promise<VoiceProfileEnrollmentResult> {
        this.voiceProfileType = profile.profileType.toString();
        const enrollmentDeferral = new Deferred<VoiceProfileEnrollmentResult>();
        this.privRequestSession.startNewRecognition();
        this.privRequestSession.listenForServiceTelemetry(this.privSpeakerAudioSource.events);

        this.privRecognizerConfig.parameters.setProperty(PropertyId.Speech_SessionId, this.privRequestSession.sessionId);

        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();

        const preAudioPromise: Promise<void> = this.sendPreAudioMessages(profile, enrollmentDeferral);

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

        return enrollmentDeferral.promise;
    }

    private async sendPreAudioMessages(profile: VoiceProfile, enrollmentDeferral: Deferred<VoiceProfileEnrollmentResult>): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        this.privRequestSession.onSpeechContext();
        this.privDeferralMap.add<VoiceProfileEnrollmentResult>(this.privRequestSession.requestId, enrollmentDeferral);
        await this.sendBaseRequest(connection, "enroll", this.scenarioFrom(profile.profileType), profile);
    }

    private async sendPhrasesRequest(getPhrasesDeferral: Deferred<VoiceProfilePhraseResult>, profileType: VoiceProfileType, locale: string): Promise<void> {
        const connection: IConnection = await this.fetchConnection();
        this.privRequestSession.onSpeechContext();
        this.privDeferralMap.add<VoiceProfilePhraseResult>(this.privRequestSession.requestId, getPhrasesDeferral);
        const scenario = this.scenarioFrom(profileType);

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

    private async sendCreateProfile(createProfileDeferral: Deferred<string[]>, profileType: VoiceProfileType, locale: string): Promise<void> {

        const connection: IConnection = await this.fetchConnection();
        this.privRequestSession.onSpeechContext();
        this.privDeferralMap.add<string[]>(this.privRequestSession.requestId, createProfileDeferral);
        const scenario = profileType === VoiceProfileType.TextIndependentIdentification ? "TextIndependentIdentification" :
            profileType === VoiceProfileType.TextIndependentVerification ? "TextIndependentVerification" : "TextDependentVerification";

        const profileCreateRequest: CreateProfile = {
            locale,
            number: "1",
            scenario,
        };
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            "speaker.profile.create",
            this.privRequestSession.requestId,
            "application/json; charset=utf-8",
            JSON.stringify(profileCreateRequest)));
    }

    private async sendCommonRequest<T>(operation: string, profileType: VoiceProfileType, profile: VoiceProfile = undefined): Promise<T> {
        // Start the connection to the service. The promise this will create is stored and will be used by configureConnection().
        const conPromise: Promise<IConnection> = this.connectImpl();
        try {
            const deferral = new Deferred<T>();
            this.privRequestSession.onSpeechContext();
            await conPromise;
            const connection: IConnection = await this.fetchConnection();
            this.privDeferralMap.add<T>(this.privRequestSession.requestId, deferral);
            await this.sendBaseRequest(connection, operation, this.scenarioFrom(profileType), profile);
            void this.receiveMessage();
            return deferral.promise;
        } catch (err) {
            throw err;
        }
    }

    private async sendBaseRequest(connection: IConnection, operation: string, scenario: string, profile: VoiceProfile): Promise<void> {
        const profileRequest: { maxPageSize?: number; profileIds?: string[]; scenario: string } = {
            scenario
        };
        if (!!profile) {
            profileRequest.profileIds = [ profile.profileId ];
        } else {
            profileRequest.maxPageSize = -1;
        }
        return connection.send(new SpeechConnectionMessage(
            MessageType.Text,
            `speaker.profile.${operation}`,
            this.privRequestSession.requestId,
            "application/json; charset=utf-8",
            JSON.stringify(profileRequest)));
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
        if (!!this.privDeferralMap.getId(requestId)) {
            if (response.status.statusCode.toLowerCase() !== "success") {
                const reason: ResultReason = ResultReason.Canceled;
                const result = new VoiceProfilePhraseResult(reason, response.status.statusCode, response.passPhraseType, []);
                this.privDeferralMap.complete<VoiceProfilePhraseResult>(requestId, result);
            } else if (!!response.phrases && response.phrases.length > 0) {
                const reason: ResultReason = ResultReason.EnrollingVoiceProfile;
                const result = new VoiceProfilePhraseResult(reason, response.status.statusCode, response.passPhraseType, response.phrases);
                this.privDeferralMap.complete<VoiceProfilePhraseResult>(requestId, result);
            } else {
                throw new Error("Voice Profile get activation phrases failed, no phrases received");
            }
        } else {
            throw new Error(`Voice Profile get activation phrases request for requestID ${requestId} not found`);
        }
    }

    private handleCreateResponse(response: ProfileResponse, requestId: string): void {
        if (!!response.profiles && response.profiles.length > 0) {
            if (!!this.privDeferralMap.getId(requestId)) {
                const profileIds: string[] = response.profiles.map((profile: IProfile): string => profile.profileId);
                this.privDeferralMap.complete<string[]>(requestId, profileIds);
            } else {
                throw new Error(`Voice Profile create request for requestID ${requestId} not found`);
            }
        } else {
            throw new Error("Voice Profile create failed, no profile id received");
        }
    }

    private handleResultResponse(response: ProfileResponse, requestId: string): void {
        if (!!this.privDeferralMap.getId(requestId)) {
            const successReason: ResultReason = response.operation.toLowerCase() === "delete" ? ResultReason.DeletedVoiceProfile : ResultReason.ResetVoiceProfile;
            const reason: ResultReason = response.status.statusCode.toLowerCase() === "success" ? successReason : ResultReason.Canceled;
            const result = new VoiceProfileResult(reason, `statusCode: ${response.status.statusCode}, errorDetails: ${response.status.reason}`);
            this.privDeferralMap.complete<VoiceProfileResult>(requestId, result);
        } else {
            throw new Error(`Voice Profile create request for requestID ${requestId} not found`);
        }
    }

    private handleFetchResponse(enrollmentResponse: EnrollmentResponse, requestId: string): void {
        if (!!this.privDeferralMap.getId(requestId) && !!enrollmentResponse.profiles[0]) {
            if (!!this.privExpectedProfileId && enrollmentResponse.profiles.length === 1 && enrollmentResponse.profiles[0].profileId === this.privExpectedProfileId) {
                this.privExpectedProfileId = undefined;
                const profileInfo: IProfile = enrollmentResponse.profiles[0];
                const result: VoiceProfileEnrollmentResult = new VoiceProfileEnrollmentResult(
                    this.enrollmentReasonFrom(profileInfo.enrollmentStatus),
                    JSON.stringify(profileInfo),
                    enrollmentResponse.status.reason,
                    );
                this.privDeferralMap.complete<VoiceProfileEnrollmentResult>(requestId, result);
            } else if (enrollmentResponse.profiles.length > 0) {
                const iProfiles: IProfile[] = enrollmentResponse.profiles;
                const profileResults: VoiceProfileEnrollmentResult[] = [];
                for (const profile of iProfiles) {
                    profileResults.push( new VoiceProfileEnrollmentResult(
                        this.enrollmentReasonFrom(profile.enrollmentStatus),
                        JSON.stringify(profile),
                        enrollmentResponse.status.reason,
                    ));
                }
                this.privDeferralMap.complete<VoiceProfileEnrollmentResult[]>(requestId, profileResults);
            }
        } else {
            throw new Error(`Voice Profile fetch request for requestID ${requestId} not found`);
        }
    }

    private enrollmentReasonFrom(statusCode: string): ResultReason {
        switch (statusCode.toLowerCase()) {
            case "enrolled":
                return ResultReason.EnrolledVoiceProfile;
            case "invalidlocale":
            case "invalidphrase":
            case "invalidaudioformat":
            case "invalidscenario":
            case "invalidprofilecount":
            case "invalidoperation":
            case "audiotooshort":
            case "audiotoolong":
            case "toomanyenrollments":
            case "storageconflict":
            case "profilenotfound":
            case "incompatibleprofiles":
            case "incompleteenrollment":
                return ResultReason.Canceled;
            default:
                return ResultReason.EnrollingVoiceProfile;
        }
    }

    private scenarioFrom(profileType: VoiceProfileType): string {
        return profileType === VoiceProfileType.TextIndependentIdentification ? "TextIndependentIdentification" :
            profileType === VoiceProfileType.TextIndependentVerification ? "TextIndependentVerification" : "TextDependentVerification";
    }
}
