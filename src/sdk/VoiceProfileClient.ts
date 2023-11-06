// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IRestResponse
} from "../common.browser/Exports.js";
import {
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig,
    VoiceProfileConnectionFactory,
    VoiceServiceRecognizer
} from "../common.speech/Exports.js";
import { AudioConfig, AudioConfigImpl } from "./Audio/AudioConfig.js";
import { Contracts } from "./Contracts.js";
import {
    AudioInputStream,
    PropertyCollection,
    PropertyId,
    Recognizer,
    ResultReason,
    VoiceProfile,
    VoiceProfileEnrollmentResult,
    VoiceProfilePhraseResult,
    VoiceProfileResult,
    VoiceProfileType
} from "./Exports.js";
import { SpeechConfig, SpeechConfigImpl } from "./SpeechConfig.js";

/**
 * Defines VoiceProfileClient class for Speaker Recognition
 * Handles operations from user for Voice Profile operations (e.g. createProfile, deleteProfile)
 * @class VoiceProfileClient
 */
export class VoiceProfileClient extends Recognizer {
    protected privProperties: PropertyCollection;
    private privVoiceAdapter: VoiceServiceRecognizer;
    private privDisposedVoiceAdapter: boolean;

    /**
     * VoiceProfileClient constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this synthesizer (authentication key, region, &c)
     */
    public constructor(speechConfig: SpeechConfig) {
        Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        super(AudioConfig.fromStreamInput(AudioInputStream.createPushStream()), speechConfigImpl.properties, new VoiceProfileConnectionFactory());

        this.privProperties = speechConfigImpl.properties.clone();
        this.privVoiceAdapter = this.privReco as VoiceServiceRecognizer;
        this.privDisposedVoiceAdapter = false;
    }

    /**
     * The collection of properties and their values defined for this VoiceProfileClient.
     * @member VoiceProfileClient.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this VoiceProfileClient.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Gets the authorization token used to communicate with the service.
     * @member VoiceProfileClient.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * @member VoiceProfileClient.prototype.authorizationToken
     * @function
     * @public
     * @param {string} token - Authorization token.
     */
    public set authorizationToken(token: string) {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, token);
    }

    /**
     * Create a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.createProfileAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfileType} profileType Type of Voice Profile to be created
     * @param {string} lang Language string (locale) for Voice Profile
     * @return {Promise<VoiceProfile>} - Promise of a VoiceProfile.
     */
    public async createProfileAsync(profileType: VoiceProfileType, lang: string): Promise<VoiceProfile> {
        const profileIds: string[] = await this.privVoiceAdapter.createProfile(profileType, lang);
        return new VoiceProfile(profileIds[0], profileType);
    }

    /**
     * Get current information of a voice profile
     * @member VoiceProfileClient.prototype.retrieveEnrollmentResultAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfile} profile Voice Profile to retrieve info for
     * @return {Promise<VoiceProfileEnrollmentResult>} - Promise of a VoiceProfileEnrollmentResult.
     */
    public async retrieveEnrollmentResultAsync(profile: VoiceProfile): Promise<VoiceProfileEnrollmentResult> {
        return this.privVoiceAdapter.retrieveEnrollmentResult(profile);
    }

    /**
     * Get all voice profiles on account with given voice profile type
     * @member VoiceProfileClient.prototype.getAllProfilesAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfileType} profileType profile type (identification/verification) for which to list profiles
     * @return {Promise<VoiceProfileEnrollmentResult[]>} - Promise of an array of VoiceProfileEnrollmentResults.
     */
    public async getAllProfilesAsync(profileType: VoiceProfileType): Promise<VoiceProfileEnrollmentResult[]> {
        return this.privVoiceAdapter.getAllProfiles(profileType);
        /*
        const result: { json: { value: EnrollmentResultJSON[] } } = await this.privAdapter.getProfiles(profileType);
        if (profileType === VoiceProfileType.TextIndependentIdentification) {
            return VoiceProfileEnrollmentResult.FromIdentificationProfileList(result.json);
        }
        return VoiceProfileEnrollmentResult.FromVerificationProfileList(result.json);
        */
    }

    /**
     * Get valid authorization phrases for voice profile enrollment
     * @member VoiceProfileClient.prototype.getActivationPhrasesAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfileType} profileType Profile Type to get activation phrases for
     * @param {string} lang Language string (locale) for Voice Profile
     */
    public async getActivationPhrasesAsync(profileType: VoiceProfileType, lang: string): Promise<VoiceProfilePhraseResult> {
        return this.privVoiceAdapter.getActivationPhrases(profileType, lang);
    }

    /**
     * Create a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.enrollProfileAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfile} profile Voice Profile to create enrollment for
     * @param {AudioConfig} audioConfig source info from which to create enrollment
     * @return {Promise<VoiceProfileEnrollmentResult>} - Promise of a VoiceProfileEnrollmentResult.
     */
    public async enrollProfileAsync(profile: VoiceProfile, audioConfig: AudioConfig): Promise<VoiceProfileEnrollmentResult> {
        const configImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        Contracts.throwIfNullOrUndefined(configImpl, "audioConfig");
        this.audioConfig = audioConfig;
        this.privVoiceAdapter.SpeakerAudioSource = configImpl;

        return this.privVoiceAdapter.enrollProfile(profile);
    }

    /**
     * Delete a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.deleteProfileAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfile} profile Voice Profile to be deleted
     * @return {Promise<VoiceProfileResult>} - Promise of a VoiceProfileResult.
     */
    public async deleteProfileAsync(profile: VoiceProfile): Promise<VoiceProfileResult> {
        return this.privVoiceAdapter.deleteProfile(profile);
    }

    /**
     * Remove all enrollments for a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.resetProfileAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfile} profile Voice Profile to be reset
     * @return {Promise<VoiceProfileResult>} - Promise of a VoiceProfileResult.
     */
    public async resetProfileAsync(profile: VoiceProfile): Promise<VoiceProfileResult> {
        return this.privVoiceAdapter.resetProfile(profile);
    }

    /**
     * Clean up object and close underlying connection
     * @member VoiceProfileClient.prototype.close
     * @function
     * @async
     * @public
     */
    public async close(): Promise<void> {
        await this.dispose(true);
    }

    protected createServiceRecognizer(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioConfig: AudioConfig, recognizerConfig: RecognizerConfig): ServiceRecognizerBase {
        const audioImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        return new VoiceServiceRecognizer(authentication, connectionFactory, audioImpl, recognizerConfig, this);
    }

    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposedVoiceAdapter) {
            return;
        }

        this.privDisposedVoiceAdapter = true;

        if (disposing) {
            await super.dispose(disposing);
        }
    }

    protected createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(speechConfig, this.properties);
    }

    private getResult(result: IRestResponse, successReason: ResultReason): VoiceProfileResult {
        const response: VoiceProfileResult =
            new VoiceProfileResult(
                result.ok ? successReason : ResultReason.Canceled,
                result.statusText
            );
        return (response);
    }
}
