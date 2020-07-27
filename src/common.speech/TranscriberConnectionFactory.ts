// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import {
    OutputFormatPropertyName,
} from "../common.speech/Exports";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports";
import {
    OutputFormat,
    PropertyId
} from "../sdk/Exports";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase";
import {
    AuthInfo,
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports";
import {
    QueryParameterNames
} from "./QueryParameterNames";

export class TranscriberConnectionFactory extends ConnectionFactoryBase {

    private readonly multiaudioRelativeUri: string = "/speech/recognition/multiaudio";

    public create = (
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection => {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "centralus");
        const hostSuffix: string =  (region && region.toLowerCase().startsWith("china")) ? ".azure.cn" : ".microsoft.com";
        const hostDefault: string = (region && region.toLowerCase() === "westus2") ?
            "wss://westus2.online.princetondev.customspeech.ai/recognition/onlinemeeting/v1" :
            "wss://transcribe." + region + ".cts.speech" + hostSuffix + this.multiaudioRelativeUri;
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, hostDefault);

        const queryParams: IStringDictionary<string> = {};

        const endpointId: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_EndpointId, undefined);
        const language: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, undefined);

        if (endpointId) {
            if (!endpoint || endpoint.search(QueryParameterNames.DeploymentIdParamName) === -1) {
                queryParams[QueryParameterNames.DeploymentIdParamName] = endpointId;
            }
        } else if (language) {
            if (!endpoint || endpoint.search(QueryParameterNames.LanguageParamName) === -1) {
                queryParams[QueryParameterNames.LanguageParamName] = language;
            }
        }

        if (!endpoint || endpoint.search(QueryParameterNames.FormatParamName) === -1) {
            queryParams[QueryParameterNames.FormatParamName] = config.parameters.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]).toLowerCase();
        }

        if (config.autoDetectSourceLanguages !== undefined) {
            queryParams[QueryParameterNames.EnableLanguageID] = "true";
        }

        this.setCommonUrlParams(config, queryParams, endpoint);
        if (!endpoint) {
            endpoint = host;
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[QueryParameterNames.ConnectionIdHeader] = connectionId;

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), connectionId);
    }
}
