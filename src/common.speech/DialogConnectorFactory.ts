// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports.js";
import { OutputFormatPropertyName } from "../common.speech/Exports.js";
import { IConnection, IStringDictionary } from "../common/Exports.js";
import { DialogServiceConfig, OutputFormat, PropertyId } from "../sdk/Exports.js";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase.js";
import { AuthInfo, RecognizerConfig, WebsocketMessageFormatter } from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import { QueryParameterNames } from "./QueryParameterNames.js";

export class DialogConnectionFactory extends ConnectionFactoryBase {

    private static readonly ApiKey: string = "api";
    private static readonly BaseUrl: string = "convai.speech";

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection> {

        const applicationId: string = config.parameters.getProperty(PropertyId.Conversation_ApplicationId, "");
        const dialogType: string = config.parameters.getProperty(PropertyId.Conversation_DialogType);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region);
        const language: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");
        const requestTurnStatus: string = config.parameters.getProperty(PropertyId.Conversation_Request_Bot_Status_Messages, "true");

        const queryParams: IStringDictionary<string> = {};
        queryParams[HeaderNames.ConnectionId] = connectionId;
        queryParams[QueryParameterNames.Format] = config.parameters.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]).toLowerCase();
        queryParams[QueryParameterNames.Language] = language;
        queryParams[QueryParameterNames.RequestBotStatusMessages] = requestTurnStatus;
        if (applicationId) {
            queryParams[QueryParameterNames.BotId] = applicationId;
            if (dialogType === DialogServiceConfig.DialogTypes.CustomCommands) {
                queryParams[HeaderNames.CustomCommandsAppId] = applicationId;
            }
        }

        const resourceInfix: string =
            dialogType === DialogServiceConfig.DialogTypes.CustomCommands ? "commands/"
            : "";
        const version: string =
            dialogType === DialogServiceConfig.DialogTypes.CustomCommands ? "v1"
            : dialogType === DialogServiceConfig.DialogTypes.BotFramework ? "v3"
            : "v0";

        const headers: IStringDictionary<string> = {};

        if (authInfo.token != null && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }

        // The URL used for connection is chosen in a priority order of specification:
        //  1. If a custom endpoint is provided, that URL is used verbatim.
        //  2. If a custom host is provided (e.g. "wss://my.custom.endpoint.com:1123"), a URL is constructed from it.
        //  3. If no custom connection details are provided, a URL is constructed from default values.
        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, "");
        if (!endpoint) {
            const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
            const host: string = config.parameters.getProperty(
                PropertyId.SpeechServiceConnection_Host,
                `wss://${region}.${DialogConnectionFactory.BaseUrl}${hostSuffix}`);
            const standardizedHost: string = host.endsWith("/") ? host : host + "/";
            endpoint = `${standardizedHost}${resourceInfix}${DialogConnectionFactory.ApiKey}/${version}`;
        }

        this.setCommonUrlParams(config, queryParams, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return Promise.resolve(new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId));
    }
}
