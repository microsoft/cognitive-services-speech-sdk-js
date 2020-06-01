import {
    IRequestOptions,
    IRestResponse,
    RestConfigBase,
    RestMessageAdapter,
    RestRequestType,
} from "../common.browser/Exports";
import {
    createNoDashGuid,
    IAudioSource,
    Promise,
} from "../common/Exports";
import { PropertyId, VoiceProfile, VoiceProfileType } from "../sdk/Exports";
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
        options.headers[RestConfigBase.configParams.contentTypeKey] = "application/json";
        options.headers[RestConfigBase.configParams.subscriptionKey] = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Key, undefined);

        this.privRestAdapter = new RestMessageAdapter(options);
    }

    /**
     * Sends create profile request to endpoint.
     * @function
     * @param {VoiceProfileType} profileType - type of voice profile to create.
     * @param {string} lang - language/locale of voice profile
     * @public
     * @returns {string} id of created profile.
     */
    public createProfile(profileType: VoiceProfileType, lang: string):
        Promise<IRestResponse> {
        const uri = this.getOperationUri(profileType);
        return this.privRestAdapter.request(RestRequestType.Post, uri, {}, { locale: lang });
    }
    /**
     * Sends create enrollment request to endpoint.
     * @function
     * @param {VoiceProfile} profileType - voice profile for which to create new enrollment.
     * @param {IAudioSource} audioSource - audioSource from which to pull data to send
     * @public
     * @returns {VoiceProfileEnrollmentResult} result of enrollment request.
     */
    public createEnrollment(profile: VoiceProfile, audioSource: IAudioSource):
        Promise<IRestResponse> {
        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");

        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId + "/enrollments";
        return this.privRestAdapter.request(RestRequestType.File, uri, {shortAudio: "true"}, audioSource.file);
    }

    /**
     * Sends delete profile request to endpoint.
     * @function
     * @param {string} id - ID of voice profile to delete.
     * @public
     * @returns {string} error message if request failed.
     */
    public deleteProfile(id: string): string {
        throw new Error("Not Implemented Yet");
    }

    private getOperationUri(profileType: VoiceProfileType): string {
        const mode = profileType === VoiceProfileType.TextIndependentIdentification ? "identification" : "verification";
        const dependency = profileType === VoiceProfileType.TextDependentVerification ? "text-dependent" : "text-independent";
        return this.privUri.replace("{mode}", mode).replace("{dependency}", dependency);
    }

}
