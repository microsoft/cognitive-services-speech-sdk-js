import {
    IRequestOptions,
    IRestResponse,
    RestConfigBase,
    RestMessageAdapter,
    RestRequestType,
} from "../common.browser/Exports";
import {
    createNoDashGuid,
    Deferred,
    IAudioSource,
    Promise,
    PromiseResult,
} from "../common/Exports";
import {
    PropertyId,
    SpeakerIdentificationModel,
    SpeakerVerificationModel,
    VoiceProfile,
    VoiceProfileType,
} from "../sdk/Exports";
import { SpeakerRecognitionConfig } from "./Exports";

/**
 * Implements methods for speaker recognition classes, sending requests to endpoint
 * and parsing response into expected format
 * @class SpeakerIdMessageAdapter
 */
export class SpeakerIdMessageAdapter {
    private privRestAdapter: RestMessageAdapter;
    private privUri: string;

    public constructor(config: SpeakerRecognitionConfig) {

        const connectionId: string = createNoDashGuid();
        let endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "westus");
            const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "https://" + region + ".api.cognitive.microsoft.com/speaker/{mode}/v2.0/{dependency}");
            endpoint = host + "/profiles";
        }
        this.privUri = endpoint;

        const options: IRequestOptions = RestConfigBase.requestOptions;
        options.headers[RestConfigBase.configParams.subscriptionKey] = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);

        this.privRestAdapter = new RestMessageAdapter(options);
    }

    /**
     * Sends create profile request to endpoint.
     * @function
     * @param {VoiceProfileType} profileType - type of voice profile to create.
     * @param {string} lang - language/locale of voice profile
     * @public
     * @returns {Promise<IRestResponse>} promised rest response containing id of created profile.
     */
    public createProfile(profileType: VoiceProfileType, lang: string):
        Promise<IRestResponse> {

        const uri = this.getOperationUri(profileType);
        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "application/json");
        return this.privRestAdapter.request(RestRequestType.Post, uri, {}, { locale: lang });
    }

    /**
     * Sends create enrollment request to endpoint.
     * @function
     * @param {VoiceProfile} profileType - voice profile for which to create new enrollment.
     * @param {IAudioSource} audioSource - audioSource from which to pull data to send
     * @public
     * @returns {Promise<IRestResponse>} rest response to enrollment request.
     */
    public createEnrollment(profile: VoiceProfile, audioSource: IAudioSource):
        Promise<IRestResponse> {

        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");
        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId + "/enrollments";
        return audioSource.blob.continueWithPromise<IRestResponse>((result: PromiseResult<Blob>): Promise<IRestResponse> => {
            if (result.isError) {
                const response: Deferred<IRestResponse> = new Deferred<IRestResponse>();
                response.resolve({ data: result.error } as IRestResponse);
                return response.promise();
            }
            return this.privRestAdapter.request(RestRequestType.File, uri, { shortAudio: "true" }, result.result);
        });
    }

    /**
     * Sends verification request to endpoint.
     * @function
     * @param {SpeakerVerificationModel} model - voice model to verify against.
     * @param {IAudioSource} audioSource - audioSource from which to pull data to send
     * @public
     * @returns {Promise<IRestResponse>} rest response to enrollment request.
     */
    public verifySpeaker(model: SpeakerVerificationModel, audioSource: IAudioSource):
        Promise<IRestResponse> {

        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");
        const uri = this.getOperationUri(model.voiceProfile.profileType) + "/" + model.voiceProfile.profileId + "/enrollments";
        return audioSource.blob.continueWithPromise<IRestResponse>((result: PromiseResult<Blob>): Promise<IRestResponse> => {
            if (result.isError) {
                const response: Deferred<IRestResponse> = new Deferred<IRestResponse>();
                response.resolve({ data: result.error } as IRestResponse);
                return response.promise();
            }
            return this.privRestAdapter.request(RestRequestType.File, uri, { shortAudio: "true" }, result.result);
        });
    }

    /**
     * Sends identification request to endpoint.
     * @function
     * @param {SpeakerIdentificationModel} model - voice profiles against which to identify.
     * @param {IAudioSource} audioSource - audioSource from which to pull data to send
     * @public
     * @returns {Promise<IRestResponse>} rest response to enrollment request.
     */
    public identifySpeaker(model: SpeakerIdentificationModel, audioSource: IAudioSource):
        Promise<IRestResponse> {

        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");
        const uri = this.getOperationUri(VoiceProfileType.TextIndependentIdentification) + "/identifySingleSpeaker";
        return audioSource.blob.continueWithPromise<IRestResponse>((result: PromiseResult<Blob>): Promise<IRestResponse> => {
            if (result.isError) {
                const response: Deferred<IRestResponse> = new Deferred<IRestResponse>();
                response.resolve({ data: result.error } as IRestResponse);
                return response.promise();
            }
            return this.privRestAdapter.request(RestRequestType.File, uri, { profileIds: model.voiceProfileIds, ignoreMinLength: "true" }, result.result);
        });
    }
    /**
     * Sends delete profile request to endpoint.
     * @function
     * @param {VoiceProfile} profile - voice profile to delete.
     * @public
     * @returns {Promise<IRestResponse>} rest response to deletion request
     */
    public deleteProfile(profile: VoiceProfile): Promise<IRestResponse> {

        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId;
        return this.privRestAdapter.request(RestRequestType.Delete, uri, {});
    }

    /**
     * Sends reset profile request to endpoint.
     * @function
     * @param {VoiceProfile} profile - voice profile to reset enrollments for.
     * @public
     * @returns {Promise<IRestResponse>} rest response to reset request
     */
    public resetProfile(profile: VoiceProfile): Promise<IRestResponse> {

        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId + "/reset";
        return this.privRestAdapter.request(RestRequestType.Post, uri, {});
    }

    private getOperationUri(profileType: VoiceProfileType): string {

        const mode = profileType === VoiceProfileType.TextIndependentIdentification ? "identification" : "verification";
        const dependency = profileType === VoiceProfileType.TextDependentVerification ? "text-dependent" : "text-independent";
        return this.privUri.replace("{mode}", mode).replace("{dependency}", dependency);
    }

}
