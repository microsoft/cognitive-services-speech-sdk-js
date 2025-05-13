// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports.js";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports.js";
import {
    PropertyId
} from "../sdk/Exports.js";
import {
    ServicePropertiesPropertyName
} from "../common.speech/Exports.js";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase.js";
import {
    AuthInfo,
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import {
    QueryParameterNames
} from "./QueryParameterNames.js";

export class ConversationTranscriberConnectionFactory extends ConnectionFactoryBase {
    private readonly universalUri: string = "/speech/universal/v2";

    public async create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection> {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, undefined);
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://" + region + ".stt.speech" + hostSuffix);
        const queryParams: IStringDictionary<string> = {};
        const endpointId: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_EndpointId, undefined);
        const language: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, undefined);

        if (endpointId) {
            if (!endpoint || endpoint.search(QueryParameterNames.CustomSpeechDeploymentId) === -1) {
                queryParams[QueryParameterNames.CustomSpeechDeploymentId] = endpointId;
            }
        } else if (language) {
            if (!endpoint || endpoint.search(QueryParameterNames.Language) === -1) {
                queryParams[QueryParameterNames.Language] = language;
            }
        }

        if (config.autoDetectSourceLanguages !== undefined) {
            queryParams[QueryParameterNames.EnableLanguageId] = "true";
        }

        this.setV2UrlParams(config, queryParams, endpoint);

        if (!!endpoint) {
            const endpointUrl = new URL(endpoint);
            const pathName = endpointUrl.pathname;

            if (pathName === "" || pathName === "/") {
                // We need to generate the path, and we need to check for a redirect.
                endpointUrl.pathname = this.universalUri;

                endpoint = await ConnectionFactoryBase.getRedirectUrlFromEndpoint(endpointUrl.toString());
            }
        }

        if (!endpoint) {
            endpoint = `${host}${this.universalUri}`;
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";

        const webSocketConnection = new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);

        // Set the value of SpeechServiceConnection_Url to webSocketConnection.uri (and not to `endpoint`), since this value is the final
        // URI that was used to make the connection (including query parameters).
        const uri: string = webSocketConnection.uri;
        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, uri);

        return webSocketConnection;
    }

    protected setV2UrlParams(
        config: RecognizerConfig,
        queryParams: IStringDictionary<string>,
        endpoint: string): void {

        const propertyIdToParameterMap: Map<number, string> = new Map([
            [PropertyId.Speech_SegmentationSilenceTimeoutMs, QueryParameterNames.SegmentationSilenceTimeoutMs],
            [PropertyId.SpeechServiceConnection_EnableAudioLogging, QueryParameterNames.EnableAudioLogging],
            [PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, QueryParameterNames.EndSilenceTimeoutMs],
            [PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, QueryParameterNames.InitialSilenceTimeoutMs],
            [PropertyId.SpeechServiceResponse_PostProcessingOption, QueryParameterNames.Postprocessing],
            [PropertyId.SpeechServiceResponse_ProfanityOption, QueryParameterNames.Profanity],
            [PropertyId.SpeechServiceResponse_StablePartialResultThreshold, QueryParameterNames.StableIntermediateThreshold],
        ]);

        propertyIdToParameterMap.forEach((parameterName: string, propertyId: PropertyId): void => {
            this.setUrlParameter(propertyId, parameterName, config, queryParams, endpoint);
        });


        const serviceProperties: IStringDictionary<string> = JSON.parse(config.parameters.getProperty(ServicePropertiesPropertyName, "{}")) as IStringDictionary<string>;

        Object.keys(serviceProperties).forEach((value: string): void => {
            queryParams[value] = serviceProperties[value];
        });
    }
}
