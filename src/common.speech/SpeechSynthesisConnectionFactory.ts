// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection
} from "../common.browser/Exports";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports";
import { PropertyId } from "../sdk/Exports";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase";
import {
    AuthInfo,
    SynthesizerConfig,
    WebsocketMessageFormatter
} from "./Exports";
import { HeaderNames } from "./HeaderNames";
import { ISynthesisConnectionFactory } from "./ISynthesisConnectionFactory";
import {
    QueryParameterNames
} from "./QueryParameterNames";

export class SpeechSynthesisConnectionFactory implements ISynthesisConnectionFactory {

    private readonly synthesisUri: string = "/cognitiveservices/websocket/v1";

    public create(
        config: SynthesizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, undefined);
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
        const endpointId = config.parameters.getProperty(PropertyId.SpeechServiceConnection_EndpointId, undefined);
        const hostPrefix = (endpointId === undefined) ? "tts" : "voice";
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://" + region + "." + hostPrefix + ".speech" + hostSuffix);

        const queryParams: IStringDictionary<string> = {};
        const headers: IStringDictionary<string> = {};

        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;
        if (endpointId !== undefined && endpointId !== "") {
            if (!endpoint || endpoint.search(QueryParameterNames.CustomVoiceDeploymentId) === -1) {
                queryParams[QueryParameterNames.CustomVoiceDeploymentId] = endpointId;
            }
        }

        if (config.avatarEnabled) {
            if (!endpoint || endpoint.search(QueryParameterNames.EnableAvatar) === -1) {
                queryParams[QueryParameterNames.EnableAvatar] = "true";
            }
        }

        if (!endpoint) {
            endpoint = host + this.synthesisUri;
        }

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromParameters(config.parameters), enableCompression, connectionId);
    }
}
