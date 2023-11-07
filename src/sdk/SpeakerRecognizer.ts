// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeakerRecognitionConnectionFactory,
    SpeakerServiceRecognizer,
    SpeechServiceConfig
} from "../common.speech/Exports.js";
import { SpeakerRecognitionModel } from "./SpeakerRecognitionModel.js";
import { AudioConfig, AudioConfigImpl } from "./Audio/AudioConfig.js";
import { Contracts } from "./Contracts.js";
import {
    PropertyCollection,
    PropertyId,
    Recognizer,
    SpeakerIdentificationModel,
    SpeakerRecognitionResult,
    SpeakerVerificationModel,
} from "./Exports.js";
import { SpeechConfig, SpeechConfigImpl } from "./SpeechConfig.js";

/**
 * Defines SpeakerRecognizer class for Speaker Recognition
 * Handles operations from user for Voice Profile operations (e.g. createProfile, deleteProfile)
 * @class SpeakerRecognizer
 */
export class SpeakerRecognizer extends Recognizer {
    protected privProperties: PropertyCollection;
    private privDisposedSpeakerRecognizer: boolean;
    private privAudioConfigImpl: AudioConfigImpl;
    /**
     * Initializes an instance of the SpeakerRecognizer.
     * @constructor
     * @param {SpeechConfig} speechConfig - The set of configuration properties.
     * @param {AudioConfig} audioConfig - An optional audio input config associated with the recognizer
     */
    public constructor(speechConfig: SpeechConfig, audioConfig: AudioConfig) {
        Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        const configImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNullOrUndefined(configImpl, "speechConfig");

        super(audioConfig, configImpl.properties, new SpeakerRecognitionConnectionFactory());
        this.privAudioConfigImpl = audioConfig as AudioConfigImpl;
        Contracts.throwIfNull(this.privAudioConfigImpl, "audioConfig");

        this.privDisposedSpeakerRecognizer = false;
        this.privProperties = configImpl.properties;
    }

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
     * Get recognition result for model using given audio
     * @member SpeakerRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @async
     * @param {SpeakerIdentificationModel | SpeakerVerificationModel} model Model containing Voice Profiles to be identified
     * @param cb - Callback invoked once result is returned.
     * @param err - Callback invoked in case of an error.
     */
    public async recognizeOnceAsync(model: SpeakerIdentificationModel | SpeakerVerificationModel): Promise<SpeakerRecognitionResult> {
        Contracts.throwIfDisposed(this.privDisposedSpeakerRecognizer);

        return this.recognizeSpeakerOnceAsyncImpl(model);
    }

    /**
     * Included for compatibility
     * @member SpeakerRecognizer.prototype.close
     * @function
     * @public
     * @async
     */
    public async close(): Promise<void> {
        Contracts.throwIfDisposed(this.privDisposedSpeakerRecognizer);
        await this.dispose(true);
    }

    protected async recognizeSpeakerOnceAsyncImpl(model: SpeakerRecognitionModel): Promise<SpeakerRecognitionResult> {
        Contracts.throwIfDisposed(this.privDisposedSpeakerRecognizer);

        await this.implRecognizerStop();
        const result: SpeakerRecognitionResult = await this.privReco.recognizeSpeaker(model);
        await this.implRecognizerStop();

        return result;
    }

    protected async implRecognizerStop(): Promise<void> {
        if (this.privReco) {
            await this.privReco.stopRecognizing();
        }
        return;
    }

    protected createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(speechConfig, this.privProperties);
    }

    protected createServiceRecognizer(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioConfig: AudioConfig, recognizerConfig: RecognizerConfig): ServiceRecognizerBase {
        const audioImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        return new SpeakerServiceRecognizer(authentication, connectionFactory, audioImpl, recognizerConfig, this);
    }

    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposedSpeakerRecognizer) {
            return;
        }

        if (disposing) {
            this.privDisposedSpeakerRecognizer = true;
            await super.dispose(disposing);
        }
    }
}
