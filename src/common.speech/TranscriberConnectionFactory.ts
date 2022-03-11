// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports";
import { PropertyId } from "../sdk/Exports";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase";
import {
    AuthInfo,
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports";
import { HeaderNames } from "./HeaderNames";
import {
    QueryParameterNames
} from "./QueryParameterNames";

export class TranscriberConnectionFactory extends ConnectionFactoryBase {

    private readonly multiaudioRelativeUri: string = "/speech/recognition/multiaudio";

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "centralus");
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
        const hostDefault: string = "wss://transcribe." + region + ".cts.speech" + hostSuffix + this.multiaudioRelativeUri;
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, hostDefault);

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

        this.setCommonUrlParams(config, queryParams, endpoint);
        if (!endpoint) {
            endpoint = host;
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);
    }
}
