import {
    IRequestOptions,
    IRestResponse,
    RestConfigBase,
    RestMessageAdapter,
    RestRequestType,
} from "../common.browser/Exports.js";
import {
    PropertyId,
} from "../sdk/Exports.js";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase.js";
import { AuthInfo, IAuthentication, SynthesizerConfig } from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";

/**
 * Implements methods for speaker recognition classes, sending requests to endpoint
 * and parsing response into expected format
 * @class SynthesisRestAdapter
 */
export class SynthesisRestAdapter {
    private privRestAdapter: RestMessageAdapter;
    private privUri: string;
    private privAuthentication: IAuthentication;

    public constructor(config: SynthesizerConfig, authentication: IAuthentication) {

        let endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "westus");
            const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
            endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, `https://${region}.tts.speech${hostSuffix}`);
        }
        this.privUri = `${endpoint}/cognitiveservices/voices/list`;

        const options: IRequestOptions = RestConfigBase.requestOptions;
        this.privRestAdapter = new RestMessageAdapter(options);
        this.privAuthentication = authentication;
    }

    /**
     * Sends list voices request to endpoint.
     * @function
     * @public
     * @param connectionId - guid for connectionId
     * @returns {Promise<IRestResponse>} rest response to status request
     */
    public getVoicesList(connectionId: string): Promise<IRestResponse> {
        this.privRestAdapter.setHeaders(HeaderNames.ConnectionId, connectionId);
        return this.privAuthentication.fetch(connectionId).then((authInfo: AuthInfo): Promise<IRestResponse> => {
            this.privRestAdapter.setHeaders(authInfo.headerName, authInfo.token);
            return this.privRestAdapter.request(RestRequestType.Get, this.privUri);
        });
    }

}
