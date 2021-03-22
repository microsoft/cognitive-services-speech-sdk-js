// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { exception } from "console";
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
     * Get current information of a voice profile
     * @member VoiceProfileClient.prototype.getProfileStatusAsync
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to retrieve info for
     * @param cb - Callback invoked once Voice Profile has been created.
     * @param err - Callback invoked in case of an error.
     */
    public getProfileStatusAsync(profile: VoiceProfile, cb?: (e: VoiceProfileEnrollmentResult) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<VoiceProfileEnrollmentResult> => {
            const result: IRestResponse = await this.privAdapter.getProfileStatus(profile);
            return this.getEnrollmentResult(profile, result);
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
    public getAuthorizationPhrasesAsync(lang: string, cb?: (e: string[]) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks((async (): Promise<string[]> => {
            const result: IRestResponse = await this.privAdapter.getAuthorizationPhrases(lang);
            const array: any[] = result.json();
            const phrases: string[] = [];
            for (const item of array) {
                phrases.push(item.phrase);
            }
            return phrases;
        })(), cb, err);
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
            const response: { identificationProfileId?: string, verificationProfileId?: string } = result.json();
            const profileId: string = response.verificationProfileId || response.identificationProfileId;
            Contracts.throwIfNullOrUndefined(profileId, "profileId");
            const profile = new VoiceProfile(profileId, profileType);
            return profile;
        })(), cb, err);
    }

    /**
     * Create a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.enrollProfileAsync
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to create enrollment for
     * @param {AudioConfig} audioConfig source info from which to create enrollment
     * @param cb - Callback invoked once Enrollment request has been submitted.
     * @param err - Callback invoked in case of an error.
     */
    public enrollProfileAsync(profile: VoiceProfile, audioConfig: AudioConfig, cb?: (e: VoiceProfileEnrollmentResult) => void, err?: (e: string) => void): void {
        const configImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        Contracts.throwIfNullOrUndefined(configImpl, "audioConfig");
        marshalPromiseToCallbacks((async (): Promise<VoiceProfileEnrollmentResult> => {
            const result: IRestResponse = await this.privAdapter.createEnrollment(profile, configImpl);
            return this.getEnrollmentResult(profile, result);
        })(), cb, err);
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

    private getResult(result: IRestResponse, successReason: ResultReason): VoiceProfileResult {
        const response: VoiceProfileResult =
            new VoiceProfileResult(
                result.ok ? successReason : ResultReason.Canceled,
                result.statusText
            );
        return (response);
    }

    private getEnrollmentResult(profile: VoiceProfile, result: IRestResponse): VoiceProfileEnrollmentResult  {
        if (!result.ok) {
            return new VoiceProfileEnrollmentResult(
                ResultReason.Canceled,
                result.data,
                result.statusText,
            );
        }
        if (profile.profileType === VoiceProfileType.TextIndependentIdentification) {
            try {
                const json: { status: string, processingResult: any } = result.json();
                return VoiceProfileEnrollmentResult.FromIdentificationEnrollmentResponse(profile.profileId, json);
            } catch (e) {
                throw e;
            }
        }
        return VoiceProfileEnrollmentResult.FromVerificationEnrollmentResponse(profile.profileId, result.json());
    }
}
