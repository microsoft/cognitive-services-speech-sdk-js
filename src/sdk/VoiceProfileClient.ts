// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    FileAudioSource,
    IRestResponse,
} from "../common.browser/Exports";
import {
    Context,
    OS,
    SpeakerIdMessageAdapter,
    SpeakerRecognitionConfig,
} from "../common.speech/Exports";
import { IAudioSource, PromiseResult } from "../common/Exports";
import { AudioConfig, AudioConfigImpl } from "./audio/AudioConfig";
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
     * Create a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.createProfile
     * @function
     * @public
     * @param {VoiceProfileType} profileType Type of Voice Profile to be created
     *        specifies the keyword to be recognized.
     * @param {string} lang Language string (locale) for Voice Profile
     * @param cb - Callback invoked once Voice Profile has been created.
     * @param err - Callback invoked in case of an error.
     */
    public createProfile(profileType: VoiceProfileType, lang: string, cb?: (e: VoiceProfile) => void, err?: (e: string) => void): void {
        this.privAdapter.createProfile(profileType, lang).continueWith((promiseResult: PromiseResult<IRestResponse>) => {
            try {
                if (promiseResult.isError) {
                    if (!!err) {
                        err(promiseResult.error);
                    }
                } else if (promiseResult.isCompleted) {
                    if (!!cb) {
                        const response: { profileId: string } = promiseResult.result.json();
                        const profile = new VoiceProfile(response.profileId, profileType);
                        cb(profile);
                    }
                }
            } catch (e) {
                if (!!err) {
                    err(e);
                }
            }
        });
    }

    /**
     * Create a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.createEnrollment
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to create enrollment for
     * @param {AudioConfig} audioConfig source info from which to create enrollment
     * @param cb - Callback invoked once Enrollment request has been submitted.
     * @param err - Callback invoked in case of an error.
     */
    public createEnrollment(profile: VoiceProfile, audioConfig: AudioConfig, cb?: (e: VoiceProfileEnrollmentResult) => void, err?: (e: string) => void): void {
        const configImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        Contracts.throwIfNullOrUndefined(configImpl, "audioConfig");
        this.privAdapter.createEnrollment(profile, configImpl).continueWith((promiseResult: PromiseResult<IRestResponse>) => {
            try {
                if (promiseResult.isError) {
                    if (!!err) {
                        err(promiseResult.error);
                    }
                } else if (promiseResult.isCompleted) {
                    if (!!cb) {
                        const response: VoiceProfileEnrollmentResult = new VoiceProfileEnrollmentResult(ResultReason.EnrolledVoiceProfile, promiseResult.result.data);
                        cb(response);
                    }
                }
            } catch (e) {
                if (!!err) {
                    err(e);
                }
            }
        });
    }

    /**
     * Delete a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.deleteProfile
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to be deleted
     * @param cb - Callback invoked once Voice Profile has been deleted.
     * @param err - Callback invoked in case of an error.
     */
    public deleteProfile(profile: VoiceProfile, cb?: (response: VoiceProfileResult) => void, err?: (e: string) => void): void {
        this.privAdapter.deleteProfile(profile).continueWith((promiseResult: PromiseResult<IRestResponse>) => {
            this.handleResultCallbacks(promiseResult, cb, err);
        });
    }

    /**
     * Remove all enrollments for a speaker recognition voice profile
     * @member VoiceProfileClient.prototype.resetProfile
     * @function
     * @public
     * @param {VoiceProfile} profile Voice Profile to be reset
     * @param cb - Callback invoked once Voice Profile has been reset.
     * @param err - Callback invoked in case of an error.
     */
    public resetProfile(profile: VoiceProfile, cb?: (response: VoiceProfileResult) => void, err?: (e: string) => void): void {
        this.privAdapter.resetProfile(profile).continueWith((promiseResult: PromiseResult<IRestResponse>) => {
            this.handleResultCallbacks(promiseResult, cb, err);
        });
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

    private handleResultCallbacks(promiseResult: PromiseResult<IRestResponse>, cb?: (response: VoiceProfileResult) => void, err?: (e: string) => void): void {
        try {
            if (promiseResult.isError) {
                if (!!err) {
                    err(promiseResult.error);
                }
            } else if (promiseResult.isCompleted) {
                if (!!cb) {
                    const response: VoiceProfileResult = new VoiceProfileResult(ResultReason.DeletedVoiceProfile);
                    cb(response);
                }
            }
        } catch (e) {
            if (!!err) {
                err(e);
            }
        }
    }
}
