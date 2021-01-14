// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import { OutputFormatPropertyName } from "../common.speech/Exports";
import { IConnection, IStringDictionary } from "../common/Exports";
import { DialogServiceConfig, OutputFormat, PropertyId } from "../sdk/Exports";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase";
import { AuthInfo, RecognizerConfig, WebsocketMessageFormatter } from "./Exports";
import { HeaderNames } from "./HeaderNames";
import { QueryParameterNames } from "./QueryParameterNames";

export class DialogConnectionFactory extends ConnectionFactoryBase {

    private Constants: any = class {
        private ApiKey: string = "api";
        private BaseUrl: string = "convai.speech";
    };

    public create = (
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection => {

        const applicationId: string = config.parameters.getProperty(PropertyId.Conversation_ApplicationId, "");
        const dialogType: string = config.parameters.getProperty(PropertyId.Conversation_DialogType);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region);
        const language: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");
        const requestTurnStatus: string = config.parameters.getProperty(PropertyId.Conversation_Request_Bot_Status_Messages, "true");

        const queryParams: IStringDictionary<string> = {};
        queryParams[QueryParameterNames.ConnectionId] = connectionId;
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
            dialogType === DialogServiceConfig.DialogTypes.CustomCommands ? "/commands"
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
            const hostSuffix = (region && region.toLowerCase().startsWith("china")) ? ".azure.cn" : ".microsoft.com";
            const host: string = config.parameters.getProperty(
                PropertyId.SpeechServiceConnection_Host,
                `wss://${region}.${this.Constants.BaseUrl}${hostSuffix}`);
            endpoint = `${host}${resourceInfix}/${this.Constants.ApiKey}/${version}`;
        }

        this.setCommonUrlParams(config, queryParams, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);
    }
}
