// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IRestResponse,
} from "../common.browser/Exports";
import {
    Context,
    OS,
    SpeakerIdMessageAdapter,
    SpeakerRecognitionConfig,
} from "../common.speech/Exports";
import { marshalPromiseToCallbacks } from "../common/Exports";
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
    VoiceProfileType,
} from "./Exports";
import { SpeechConfig, SpeechConfigImpl } from "./SpeechConfig";

/**
 * Defines VoiceProfileClient class for Speaker Recognition
 * Handles operations from user for Voice Profile operations (e.g. createProfile, deleteProfile)
 * @class VoiceProfileClient
 */
export class VoiceProfileClient {
    protected privProperties: PropertyCollection;
    private privAdapter: SpeakerIdMessageAdapter;

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
     * Create a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.createProfileAsync
     * @function
     * @public
     * @param {VoiceProfileType} profileType Type of Voice Profile to be created
     *        specifies the keyword to be recognized.
     * @param {string} lang Language string (locale) for Voice Profile
     * @param cb - Callback invoked once Voice Profile has been created.
     * @param err - Callback invoked in case of an error.
     */
    public createProfileAsync(profileType: VoiceProfileType, lang: string, cb?: (e: VoiceProfile) => void, err?: (e: string) => void): void {

        marshalPromiseToCallbacks((async (): Promise<VoiceProfile> => {
            const result: IRestResponse = await this.privAdapter.createProfile(profileType, lang);
            if (!result.ok) {
                const e: { error: { code: number, message: string } } = result.json();
                throw new Error(`createProfileAsync failed with code: ${e.error.code}, message: ${e.error.message}`);
            }
            const response: { profileId: string } = result.json();
            const profile = new VoiceProfile(response.profileId, profileType);
            return profile;
        })(), cb, err);
    }
     /**
      * Get current information of a voice profile
      * @member VoiceProfileClient.prototype.retrieveEnrollmentResultAsync
      * @function
      * @public
      * @param {VoiceProfile} profile Voice Profile to retrieve info for
      * @param cb - Callback invoked once Voice Profile has been created.
      * @param err - Callback invoked in case of an error.
      */
    public retrieveEnrollmentResultAsync(profile: VoiceProfile, cb?: (e: VoiceProfileEnrollmentResult) => void, err?: (e: string) => void): void {
                marshalPromiseToCallbacks((async (): Promise<VoiceProfileEnrollmentResult> => {
            const result: IRestResponse = await this.privAdapter.getProfileStatus(profile);
            return new VoiceProfileEnrollmentResult(
                result.ok ? ResultReason.EnrolledVoiceProfile : ResultReason.Canceled,
                result.data,
                result.statusText,
            );
        })(), cb, err);
    }

    /**
     * Get all voice profiles on account with given voice profile type
     * @member VoiceProfileClient.prototype.getAllProfilesAsync
     * @function
     * @public
     * @param {VoiceProfileType} profileType profile type (identification/verification) for which to list profiles
     * @param cb - Callback invoked once Profile list has been returned.
     * @param err - Callback invoked in case of an error.
     */
    public getAllProfilesAsync(profileType: VoiceProfileType, cb?: (e: VoiceProfileEnrollmentResult[]) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<VoiceProfileEnrollmentResult[]> => {
            const result: IRestResponse = await this.privAdapter.getProfiles(profileType);
            if (profileType === VoiceProfileType.TextIndependentIdentification) {
                return VoiceProfileEnrollmentResult.FromIdentificationProfileList(result.json());
            }
            return VoiceProfileEnrollmentResult.FromVerificationProfileList(result.json());
        })(), cb, err);
    }

    /**
     * Get valid authorization phrases for voice profile enrollment
     * @member VoiceProfileClient.prototype.getAuthorizationPhrasesAsync
     * @function
     * @public
     * @param {string} lang Language string (locale) for Voice Profile
     * @param cb - Callback invoked once phrases have been returned.
     * @param err - Callback invoked in case of an error.
     */
    public getActivationPhrasesAsync(profileType: VoiceProfileType, lang: string, cb?: (e: VoiceProfilePhraseResult) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<VoiceProfilePhraseResult> => {
            const result: IRestResponse = await this.privAdapter.getPhrases(profileType, lang);
            return new VoiceProfilePhraseResult(
                result.ok ? ResultReason.EnrollingVoiceProfile : ResultReason.Canceled,
                result.statusText,
                result.json()
            );
        })(), cb, err);
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
            result.statusText,
        );
    }

    /**
     * Delete a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.deleteProfileAsync
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to be deleted
     * @param cb - Callback invoked once Voice Profile has been deleted.
     * @param err - Callback invoked in case of an error.
     */
    public deleteProfileAsync(profile: VoiceProfile, cb?: (response: VoiceProfileResult) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<VoiceProfileResult> => {
            const result: IRestResponse = await this.privAdapter.deleteProfile(profile);
            return this.getResult(result, ResultReason.DeletedVoiceProfile);
        })(), cb, err);
    }

    /**
     * Remove all enrollments for a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.resetProfileAsync
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to be reset
     * @param cb - Callback invoked once Voice Profile has been reset.
     * @param err - Callback invoked in case of an error.
     */
    public resetProfileAsync(profile: VoiceProfile, cb?: (response: VoiceProfileResult) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<VoiceProfileResult> => {
            const result: IRestResponse = await this.privAdapter.resetProfile(profile);
            return this.getResult(result, ResultReason.ResetVoiceProfile);
        })(), cb, err);
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

    private getResult(result: IRestResponse, successReason: ResultReason, cb?: (response: VoiceProfileResult) => void): VoiceProfileResult {
        const response: VoiceProfileResult =
            new VoiceProfileResult(
                result.ok ? successReason : ResultReason.Canceled,
                result.statusText
            );
        return (response);
    }
}
