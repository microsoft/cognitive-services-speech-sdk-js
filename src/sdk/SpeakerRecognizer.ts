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
import { IAudioSource, PromiseResult } from "../common/Exports";
import { AudioConfig, AudioConfigImpl } from "./audio/AudioConfig";
import { Contracts } from "./Contracts";
import {
    PropertyCollection,
    PropertyId,
    ResultReason,
    SpeakerIdentificationModel,
    SpeakerRecognitionResult,
    SpeakerRecognitionResultType,
    SpeakerVerificationModel,
    VoiceProfile,
} from "./Exports";
import { SpeechConfig, SpeechConfigImpl } from "./SpeechConfig";

/**
 * Defines SpeakerRecognizer class for Speaker Recognition
 * Handles operations from user for Voice Profile operations (e.g. createProfile, deleteProfile)
 * @class SpeakerRecognizer
 */
export class SpeakerRecognizer {
    protected privProperties: PropertyCollection;
    private privAdapter: SpeakerIdMessageAdapter;
    private privAudioConfigImpl: AudioConfigImpl;

    /**
     * Gets the authorization token used to communicate with the service.
     * @member SpeakerRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * @member SpeakerRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @param {string} token - Authorization token.
     */
    public set authorizationToken(token: string) {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, token);
    }

    /**
     * The collection of properties and their values defined for this SpeakerRecognizer.
     * @member SpeakerRecognizer.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this SpeakerRecognizer.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * SpeakerRecognizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this synthesizer (authentication key, region, &c)
     */
    public constructor(speechConfig: SpeechConfig, audioConfig: AudioConfig) {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        this.privAudioConfigImpl = audioConfig as AudioConfigImpl;
        Contracts.throwIfNull(this.privAudioConfigImpl, "audioConfig");

        this.privProperties = speechConfigImpl.properties.clone();
        this.implSRSetup();
    }

    /**
     * Get recognition result for model using given audio
     * @member SpeakerRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param {SpeakerIdentificationModel} model Model containing Voice Profiles to be identified
     * @param cb - Callback invoked once result is returned.
     * @param err - Callback invoked in case of an error.
     */
    public recognizeOnceAsync(model: SpeakerIdentificationModel | SpeakerVerificationModel, cb?: (e: SpeakerRecognitionResult) => void, err?: (e: string) => void): void {
        if (model instanceof SpeakerIdentificationModel) {
            this.privAdapter.identifySpeaker(model, this.privAudioConfigImpl).continueWith((promiseResult: PromiseResult<IRestResponse>) => {
                this.handleResultCallbacks(promiseResult, SpeakerRecognitionResultType.Identify, undefined, cb, err);
            });
        } else if (model instanceof SpeakerVerificationModel) {
            this.privAdapter.verifySpeaker(model, this.privAudioConfigImpl).continueWith((promiseResult: PromiseResult<IRestResponse>) => {
                this.handleResultCallbacks(promiseResult, SpeakerRecognitionResultType.Verify, model.voiceProfile.profileId, cb, err);
            });
        } else {
            throw new Error("SpeakerRecognizer.recognizeOnce: Unexpected model type");
        }
    }

    /**
     * Included for compatibility
     * @member SpeakerRecognizer.prototype.close
     * @function
     * @public
     */
    public close(): void {
        return;
    }

    // Does class setup, swiped from Recognizer.
    private implSRSetup(): void {

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

    private handleResultCallbacks(promiseResult: PromiseResult<IRestResponse>, resultType: SpeakerRecognitionResultType, profileId?: string, cb?: (response: SpeakerRecognitionResult) => void, err?: (e: string) => void): void {
        try {
            if (promiseResult.isError) {
                if (!!err) {
                    err(promiseResult.error);
                }
            } else if (promiseResult.isCompleted) {
                if (!promiseResult.result.ok) {
                    if (!!err) {
                        err(promiseResult.result.statusText);
                    }
                } else if (!!cb) {
                    const response: SpeakerRecognitionResult = new SpeakerRecognitionResult(resultType, promiseResult.result.data, profileId);
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
