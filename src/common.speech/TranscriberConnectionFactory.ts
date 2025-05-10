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
    OutputFormat,
    PropertyId
} from "../sdk/Exports.js";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase.js";
import {
    AuthInfo,
    OutputFormatPropertyName,
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import {
    QueryParameterNames
} from "./QueryParameterNames.js";

export class TranscriberConnectionFactory extends ConnectionFactoryBase {

    private readonly multiaudioRelativeUri: string = "/speech/recognition/multiaudio";

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection> {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "centralus");
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
        const hostDefault: string = "wss://transcribe." + region + ".cts.speech" + hostSuffix + this.multiaudioRelativeUri;
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, hostDefault);

        const queryParams: IStringDictionary<string> = {};
        this.setQueryParams(queryParams, config, endpoint);

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
        return Promise.resolve(new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId));
    }

    public setQueryParams(queryParams: IStringDictionary<string>, config: RecognizerConfig, endpointUrl: string): void {

        const endpointId: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_EndpointId, undefined);
        const language: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, undefined);

        if (endpointId && !(QueryParameterNames.CustomSpeechDeploymentId in queryParams)) {
            queryParams[QueryParameterNames.CustomSpeechDeploymentId] = endpointId;
        }

        if (language && !(QueryParameterNames.Language in queryParams)) {
            queryParams[QueryParameterNames.Language] = language;
        }

        const wordLevelTimings: boolean = config.parameters.getProperty(PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "false").toLowerCase() === "true";
        const detailed: boolean = config.parameters.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]) !== OutputFormat[OutputFormat.Simple];
        if (wordLevelTimings || detailed) {
            queryParams[QueryParameterNames.Format] = OutputFormat[OutputFormat.Detailed].toLowerCase();
        }

        this.setCommonUrlParams(config, queryParams, endpointUrl);
    }
}
