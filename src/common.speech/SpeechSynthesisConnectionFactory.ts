// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection, WebsocketMessageAdapter,
} from "../common.browser/Exports";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports";
import { PropertyId } from "../sdk/Exports";
import {
    AuthInfo,
    SynthesizerConfig,
    WebsocketMessageFormatter
} from "./Exports";
import { ISynthesisConnectionFactory } from "./ISynthesisConnectionFactory";
import {
    QueryParameterNames
} from "./QueryParameterNames";

export class SpeechSynthesisConnectionFactory implements ISynthesisConnectionFactory {

    private readonly synthesisUri: string = "/cognitiveservices/websocket/v1";

    public create = (
        config: SynthesizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection => {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, undefined);
        const hostSuffix = (region && region.toLowerCase().startsWith("china")) ? ".azure.cn" : ".microsoft.com";
        const endpointId = config.parameters.getProperty(PropertyId.SpeechServiceConnection_EndpointId, undefined);
        const hostPrefix = (endpointId === undefined) ? "tts" : "voice";
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://" + region + "." + hostPrefix + ".speech" + hostSuffix);

        const queryParams: IStringDictionary<string> = {};

        if (!endpoint) {
            endpoint = host + this.synthesisUri;
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[QueryParameterNames.ConnectionIdHeader] = connectionId;
        if (endpointId !== undefined) {
            headers[QueryParameterNames.CustomVoiceDeploymentIdParamName] = endpointId;
        }

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromParameters(config.parameters), enableCompression, connectionId);
    }
}
