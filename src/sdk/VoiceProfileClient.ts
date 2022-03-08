// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IRestResponse
} from "../common.browser/Exports";
import {
    Context,
    OS,
    SpeakerIdMessageAdapter,
    SpeakerRecognitionConfig
} from "../common.speech/Exports";
import { AudioConfig, AudioConfigImpl } from "./Audio/AudioConfig";
import { Contracts } from "./Contracts";
import {
    PropertyCollection,
    PropertyId,
    ResultReason,
    VoiceProfile,
    VoiceProfileEnrollmentResult,
    VoiceProfilePhraseResult,
    VoiceProfileResult,
    VoiceProfileType
} from "./Exports";
import { SpeechConfig, SpeechConfigImpl } from "./SpeechConfig";
import { EnrollmentResultJSON } from "./VoiceProfileEnrollmentResult";

/**
 * Defines VoiceProfileClient class for Speaker Recognition
 * Handles operations from user for Voice Profile operations (e.g. createProfile, deleteProfile)
 * @class VoiceProfileClient
 */
export class VoiceProfileClient {
    protected privProperties: PropertyCollection;
    private privAdapter: SpeakerIdMessageAdapter;

    /**
     * VoiceProfileClient constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this synthesizer (authentication key, region, &c)
     */
    public constructor(speechConfig: SpeechConfig) {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        this.privProperties = speechConfigImpl.properties.clone();
        this.implClientSetup();
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
        const result: { ok: boolean; status: number; statusText: string; json: { profileId?: string } } = await this.privAdapter.createProfile(profileType, lang);
        if (!result.ok) {
            throw new Error(`createProfileAsync failed with code: ${result.status}, message: ${result.statusText}`);
        }
        const response: { profileId?: string } = result.json;
        const profile = new VoiceProfile(response.profileId, profileType);
        return profile;
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
        const result:  { ok: boolean; data: string; statusText: string; json: { value: EnrollmentResultJSON[] } } = await this.privAdapter.getProfileStatus(profile);
        return new VoiceProfileEnrollmentResult(
            result.ok ? ResultReason.EnrolledVoiceProfile : ResultReason.Canceled,
            result.data,
            result.statusText
        );
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
        const result: { json: { value: EnrollmentResultJSON[] } } = await this.privAdapter.getProfiles(profileType);
        if (profileType === VoiceProfileType.TextIndependentIdentification) {
            return VoiceProfileEnrollmentResult.FromIdentificationProfileList(result.json);
        }
        return VoiceProfileEnrollmentResult.FromVerificationProfileList(result.json);
    }

    /**
     * Get valid authorization phrases for voice profile enrollment
     * @member VoiceProfileClient.prototype.getAuthorizationPhrasesAsync
     * @function
     * @public
     * @async
     * @param {VoiceProfileType} profileType Profile Type to get activation phrases for
     * @param {string} lang Language string (locale) for Voice Profile
     */
    public async getActivationPhrasesAsync(profileType: VoiceProfileType, lang: string): Promise<VoiceProfilePhraseResult> {
        const result: { ok: boolean; statusText: string; json: { value: { passPhrase?: string; activationPhrase?: string }[] } } = await this.privAdapter.getPhrases(profileType, lang);
        return new VoiceProfilePhraseResult(
            result.ok ? ResultReason.EnrollingVoiceProfile : ResultReason.Canceled,
            result.statusText,
            result.json
        );
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

        const result: IRestResponse = await this.privAdapter.createEnrollment(profile, configImpl);
        return new VoiceProfileEnrollmentResult(
            result.ok ? ResultReason.EnrolledVoiceProfile : ResultReason.Canceled,
            result.data,
            result.statusText
        );
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
        const result: IRestResponse = await this.privAdapter.deleteProfile(profile);
        return this.getResult(result, ResultReason.DeletedVoiceProfile);
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
        const result: IRestResponse = await this.privAdapter.resetProfile(profile);
        return this.getResult(result, ResultReason.ResetVoiceProfile);
    }

    /**
     * Included for compatibility
     * @member VoiceProfileClient.prototype.close
     * @function
     * @public
     */
    public close(): void {
        return;
    }

    // Does class setup, swiped from Recognizer.
    protected implClientSetup(): void {

        let osPlatform = (typeof window !== "undefined") ? "Browser" : "Node";
        let osName = "unknown";
        let osVersion = "unknown";

        if (typeof navigator !== "undefined") {
            osPlatform = osPlatform + "/" + navigator.platform;
            osName = navigator.userAgent;
            osVersion = navigator.appVersion;
        }

        const recognizerConfig =
            new SpeakerRecognitionConfig(
                new Context(new OS(osPlatform, osName, osVersion)),
                this.privProperties);

        this.privAdapter = new SpeakerIdMessageAdapter(recognizerConfig);
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
