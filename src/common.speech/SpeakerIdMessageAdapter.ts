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

        let endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "westus");
            const hostSuffix: string = (region && region.toLowerCase().startsWith("china")) ? ".azure.cn" : ".microsoft.com";
            endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "https://" + region + ".api.cognitive" + hostSuffix + "/spid/v1.0");
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
        return this.requestRest(RestRequestType.Post, uri, {}, { locale: lang });
    }

    /**
     * Sends create enrollment request to endpoint.
     * @function
     * @param {VoiceProfile} profileType - voice profile for which to create new enrollment.
     * @param {IAudioSource} audioSource - audioSource from which to pull data to send
     * @public
     * @returns {Promise<IRestResponse>} rest response to enrollment request.
     */
    public async createEnrollment(profile: VoiceProfile, audioSource: IAudioSource): Promise<IRestResponse> {

        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");
        const uri = `${this.getOperationUri(profile.profileType)}/${profile.profileId}/enroll`;
        const result: Blob | Buffer = await audioSource.blob;
        const enrollResponse: IRestResponse = await this.requestRest(RestRequestType.File, uri, { shortAudio: "true" }, null, result);
        if (!enrollResponse.ok || (profile.profileType !== VoiceProfileType.TextIndependentIdentification)) {
            return enrollResponse;
        }

        return this.getRestAsyncResult(enrollResponse);
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

        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");
        const uri = `${this.getOperationUri()}/verify`;
        try {
            const result: Blob | Buffer = await audioSource.blob;
            return this.requestRest(RestRequestType.File, uri, { verificationProfileId: model.voiceProfile.profileId, shortAudio: "true" }, null, result);
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

        this.privRestAdapter.setHeaders(RestConfigBase.configParams.contentTypeKey, "multipart/form-data");
        const uri = this.getOperationUri() + "/identify";
        try {

            const result: Blob | Buffer = await audioSource.blob;
            const identifyResponse: IRestResponse = await this.requestRest(RestRequestType.File, uri, { identificationProfileIds: model.voiceProfileIds, shortAudio: "true" }, null, result);
            if (!identifyResponse.ok) {
                return identifyResponse;
            }
            return this.getRestAsyncResult(identifyResponse);

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

        const uri = this.getOperationUri(profile.profileType) + "/" + profile.profileId;
        return this.requestRest(RestRequestType.Get, uri, {});
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
        return this.requestRest(RestRequestType.Delete, uri, {});
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
        return this.requestRest(RestRequestType.Post, uri, {});
    }

    private getOperationUri(profileType?: VoiceProfileType): string {
        if (profileType === undefined) {
            return this.privUri;
        }

        const mode = profileType === VoiceProfileType.TextIndependentIdentification ? "identification" : "verification";
        return `${this.privUri}/{mode}Profiles`.replace("{mode}", mode);
    }

    private async requestRest(
        method: RestRequestType,
        uri: string,
        queryParams: any = {},
        body: any = null,
        binaryBody: Blob | Buffer = null,
        ): Promise<IRestResponse> {

        const deferral: Deferred<IRestResponse> = new Deferred<IRestResponse>();
        try {
            let response: IRestResponse = await this.privRestAdapter.request(method, uri, queryParams, body, binaryBody);
            let i: number = 0;
            const retryCount: number = 3;
            while (!response.ok && i < retryCount) {
                response = await this.privRestAdapter.request(method, uri, queryParams, body, binaryBody);
                i += 1;
            }
            deferral.resolve(response);
        } catch (e) {
            deferral.reject(e);
        }
        return deferral.promise;
    }

    private async getRestAsyncResult(initialResponse: IRestResponse): Promise<IRestResponse> {
        const deferral: Deferred<IRestResponse> = new Deferred<IRestResponse>();
        try {
            const operationKeyValuePairs: string[] = initialResponse.headers.split("\r\n");
            let operationUri: string = "";
            for (const pair of operationKeyValuePairs) {
                const key: string = "operation-location:";
                if (pair.startsWith(key)) {
                    operationUri = pair.substring(pair.indexOf(":") + 1);
                    break;
                }
            }
            if (!operationUri) {
                deferral.resolve(initialResponse);
            }
            let res: IRestResponse = await this.requestRest(RestRequestType.Get, operationUri, {});
            if (res.ok) {
                let resJson: { status: string } = res.json();
                while (resJson.status !== "succeeded" && resJson.status !== "failed") {
                    res = await this.requestRest(RestRequestType.Get, operationUri, {});
                    if (res.ok) {
                        resJson = res.json();
                    }
                }
            }
            deferral.resolve(res);
        } catch (e) {
            deferral.reject(e);
        }
        return deferral.promise;
    }
}
