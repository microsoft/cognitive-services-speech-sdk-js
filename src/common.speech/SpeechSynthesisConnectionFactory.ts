// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection
} from "../common.browser/Exports.js";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports.js";
import { PropertyId } from "../sdk/Exports.js";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase.js";
import {
    AuthInfo,
    SynthesizerConfig,
    WebsocketMessageFormatter
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import { ISynthesisConnectionFactory } from "./ISynthesisConnectionFactory.js";
import {
    QueryParameterNames
} from "./QueryParameterNames.js";

export class SpeechSynthesisConnectionFactory implements ISynthesisConnectionFactory {

    private readonly synthesisUri: string = "/tts/cognitiveservices/websocket/v1";

    public async create(
        config: SynthesizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection> {

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

        if (!!endpoint) {
            const endpointUrl = new URL(endpoint);
            const pathName = endpointUrl.pathname;

            if (pathName === "" || pathName === "/") {
                // We need to generate the path, and we need to check for a redirect.
                endpointUrl.pathname = this.synthesisUri;

                endpoint = await ConnectionFactoryBase.getRedirectUrlFromEndpoint(endpointUrl.toString());
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
