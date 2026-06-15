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
 * Implements methods for speech synthesis classes, sending requests to endpoint
 * and parsing response into expected format
 * @class SynthesisRestAdapter
 */
export class SynthesisRestAdapter {
    private privRestAdapter: RestMessageAdapter;
    private privUri: string | undefined;
    private privEndpoint: string;
    private privIsCustomEndpoint: boolean;
    private privAuthentication: IAuthentication;

    public constructor(config: SynthesizerConfig, authentication: IAuthentication) {

        let endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        this.privIsCustomEndpoint = !!endpoint;
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "westus");
            const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
            endpoint = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, `https://${region}.tts.speech${hostSuffix}`);
        }
        this.privEndpoint = endpoint;

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
    public async getVoicesList(connectionId: string): Promise<IRestResponse> {
        const uri: string = await this.getVoicesListUri();
        this.privRestAdapter.setHeaders(HeaderNames.ConnectionId, connectionId);
        const authInfo: AuthInfo = await this.privAuthentication.fetch(connectionId);
        this.privRestAdapter.setHeaders(authInfo.headerName, authInfo.token);
        return this.privRestAdapter.request(RestRequestType.Get, uri);
    }

    /**
     * Builds (and caches) the voices/list URI. When the caller supplied a custom endpoint with no path
     * (e.g. a custom-domain or private-link host via fromEndpoint), the host may not serve the voices/list
     * route directly and AAD token auth requires the regional host with the ocp-apim-custom-domain-name
     * query parameter. In that case we resolve the service redirect (which is exposed on the synthesis
     * route) to discover the regional host and custom-domain parameter, then retarget it to the
     * voices/list path, keeping the http(s) scheme for this REST call.
     */
    private async getVoicesListUri(): Promise<string> {
        if (this.privUri !== undefined) {
            return this.privUri;
        }

        const voicesPath = "/cognitiveservices/voices/list";
        const endpointUrl: URL = new URL(this.privEndpoint);
        const pathName: string = endpointUrl.pathname;
        const hasNoPath: boolean = pathName === "" || pathName === "/";

        if (this.privIsCustomEndpoint && hasNoPath) {
            // The redirect handler is exposed on the synthesis route. Resolving it returns the regional
            // host together with the Ocp-Apim-Custom-Domain-Name parameter (or, when no redirect applies,
            // falls back to the original host). We then point the resolved URL at the voices/list path.
            endpointUrl.pathname = "/tts/cognitiveservices/websocket/v1";
            const resolved: string = await ConnectionFactoryBase.getRedirectUrlFromEndpoint(endpointUrl.toString(), false);
            const resolvedUrl: URL = new URL(resolved);
            resolvedUrl.pathname = voicesPath;
            resolvedUrl.searchParams.delete("GenerateRedirectResponse");
            this.privUri = resolvedUrl.toString();
        } else if (hasNoPath) {
            endpointUrl.pathname = voicesPath;
            this.privUri = endpointUrl.toString();
        } else {
            // The endpoint already carries a path; preserve the legacy behavior of appending the voices route.
            this.privUri = `${this.privEndpoint}${voicesPath}`;
        }

        return this.privUri;
    }

}
