import {
    IRequestOptions,
    IRestResponse,
    RestConfigBase,
    RestMessageAdapter,
    RestRequestType,
} from "../common.browser/Exports";
import { IAudioSource } from "../common/Exports";
import {
    PropertyId,
    SpeakerIdentificationModel,
    SpeakerVerificationModel,
    VoiceProfile,
    VoiceProfileType,
} from "../sdk/Exports";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase";
import { SpeakerRecognitionConfig } from "./Exports";

/**
 * Implements methods for speaker recognition classes, sending requests to endpoint
 * and parsing response into expected format
 * @class SpeakerIdMessageAdapter
 */
export class SpeakerIdMessageAdapter {
    private privRestAdapter: RestMessageAdapter;
    private privUri: string;
    private privApiVersion: string;

    public constructor(config: SpeakerRecognitionConfig) {

        let endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "westus");
            const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
            endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, `https://${region}.api.cognitive${hostSuffix}`);
        }
        this.privUri = `${endpoint}/speaker-recognition/{mode}/{dependency}/profiles`;

        const options: IRequestOptions = RestConfigBase.requestOptions;
        options.headers[RestConfigBase.configParams.subscriptionKey] = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);
        this.privApiVersion = config.parameters.getProperty(PropertyId.SpeakerRecognition_Api_Version, "2021-09-05");

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
        return this.privRestAdapter.request(RestRequestType.Post, uri, this.getQueryParams(), { locale: lang });
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

        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId + "/enrollments";
        return audioSource.blob.then<IRestResponse>((result: Blob | Buffer): Promise<IRestResponse> => {
            return this.privRestAdapter.request(RestRequestType.File, uri, this.getQueryParams({ ignoreMinLength: "true" }), null, result);
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
    public async verifySpeaker(model: SpeakerVerificationModel, audioSource: IAudioSource):
        Promise<IRestResponse> {

        const uri = this.getOperationUri(model.voiceProfile.profileType) + "/" + model.voiceProfile.profileId + ":verify";
        try {
            const result: Blob | Buffer = await audioSource.blob;
            return this.privRestAdapter.request(RestRequestType.File, uri, this.getQueryParams({ ignoreMinLength: "true" }), null, result);
        } catch (e) {
            return Promise.resolve({ data: e } as IRestResponse);
        }
    }

    /**
     * Sends identification request to endpoint.
     * @function
     * @param {SpeakerIdentificationModel} model - voice profiles against which to identify.
     * @param {IAudioSource} audioSource - audioSource from which to pull data to send
     * @public
     * @returns {Promise<IRestResponse>} rest response to enrollment request.
     */
    public async identifySpeaker(model: SpeakerIdentificationModel, audioSource: IAudioSource):
        Promise<IRestResponse> {

        const uri = this.getOperationUri(VoiceProfileType.TextIndependentIdentification) + ":identifySingleSpeaker";
        try {
            const result: Blob | Buffer = await audioSource.blob;
            return this.privRestAdapter.request(RestRequestType.File, uri, this.getQueryParams({ profileIds: model.voiceProfileIds, ignoreMinLength: "true" }), null, result);
        } catch (e) {
            return Promise.resolve({ data: e } as IRestResponse);
        }
    }

    /**
     * Sends profile status request to endpoint.
     * @function
     * @param {VoiceProfile} profile - voice profile to check.
     * @public
     * @returns {Promise<IRestResponse>} rest response to status request
     */
    public getProfileStatus(profile: VoiceProfile): Promise<IRestResponse> {

        const uri = `${this.getOperationUri(profile.profileType)}/${profile.profileId}`;
        return this.privRestAdapter.request(RestRequestType.Get, uri, this.getQueryParams());
    }

    /**
     * Sends get all profiles request to endpoint.
     * @function
     * @param {VoiceProfileType} profileType - type of profiles to return list of
     * @public
     * @returns {Promise<IRestResponse>} promised rest response containing all profiles
     */
    public getProfiles(profileType: VoiceProfileType): Promise<IRestResponse> {
        const uri = this.getOperationUri(profileType);
        return this.privRestAdapter.request(RestRequestType.Get, uri, this.getQueryParams());
    }

    /**
     * Sends get activation/auth phrases request to endpoint.
     * @function
     * @param {VoiceProfileType} profileType - type of profiles to return phrases for
     * @param {string} lang - language/locale of voice profile
     * @public
     * @returns {Promise<IRestResponse>} promised rest response containing list of valid phrases
     */
    public getPhrases(profileType: VoiceProfileType, lang: string): Promise<IRestResponse> {
        const uri = `${this.getOperationUri(profileType)}`.replace(`profiles`, `phrases`) + "/" + lang;
        return this.privRestAdapter.request(RestRequestType.Get, uri, this.getQueryParams());
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
        return this.privRestAdapter.request(RestRequestType.Delete, uri, this.getQueryParams());
    }

    /**
     * Sends reset profile request to endpoint.
     * @function
     * @param {VoiceProfile} profile - voice profile to reset enrollments for.
     * @public
     * @returns {Promise<IRestResponse>} rest response to reset request
     */
    public resetProfile(profile: VoiceProfile): Promise<IRestResponse> {

        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId + ":reset";
        return this.privRestAdapter.request(RestRequestType.Post, uri, this.getQueryParams());
    }

    private getOperationUri(profileType: VoiceProfileType): string {

        const mode = profileType === VoiceProfileType.TextIndependentIdentification ? "identification" : "verification";
        const dependency = profileType === VoiceProfileType.TextDependentVerification ? "text-dependent" : "text-independent";
        return this.privUri.replace("{mode}", mode).replace("{dependency}", dependency);
    }

    private getQueryParams(params: any = {}): any {

        params[RestConfigBase.configParams.apiVersion] = this.privApiVersion;
        return params;
    }

}
