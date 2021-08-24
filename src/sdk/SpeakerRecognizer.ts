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
    SpeakerIdentificationModel,
    SpeakerRecognitionResult,
    SpeakerRecognitionResultType,
    SpeakerVerificationModel,
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
     * @param {SpeechConfig} speechConfig - An set of initial properties for this recognizer (authentication key, region, &c)
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
     * @async
     * @param {SpeakerIdentificationModel} model Model containing Voice Profiles to be identified
     * @param cb - Callback invoked once result is returned.
     * @param err - Callback invoked in case of an error.
     */
    public async recognizeOnceAsync(model: SpeakerIdentificationModel | SpeakerVerificationModel): Promise<SpeakerRecognitionResult> {

        if (model instanceof SpeakerIdentificationModel) {
            const responsePromise: Promise<IRestResponse> = this.privAdapter.identifySpeaker(model, this.privAudioConfigImpl);
            return this.getResult(responsePromise, SpeakerRecognitionResultType.Identify, undefined);
        } else if (model instanceof SpeakerVerificationModel) {
            const responsePromise: Promise<IRestResponse> = this.privAdapter.verifySpeaker(model, this.privAudioConfigImpl);
            return this.getResult(responsePromise, SpeakerRecognitionResultType.Verify, model.voiceProfile.profileId);
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

    private async getResult(responsePromise: Promise<IRestResponse>, resultType: SpeakerRecognitionResultType, profileId?: string): Promise<SpeakerRecognitionResult> {
        const response: IRestResponse = await responsePromise;
        return new SpeakerRecognitionResult(
            resultType,
            response.data,
            profileId,
            response.ok ? ResultReason.RecognizedSpeaker : ResultReason.Canceled,
        );
    }
}
