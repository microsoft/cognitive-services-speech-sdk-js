// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import { OutputFormatPropertyName } from "../common.speech/Exports";
import { IConnection, IStringDictionary } from "../common/Exports";
import { OutputFormat, PropertyId } from "../sdk/Exports";
import { ConnectionFactoryBase } from "./ConnectionFactoryBase";
import { AuthInfo, RecognizerConfig, WebsocketMessageFormatter } from "./Exports";
import { QueryParameterNames } from "./QueryParameterNames";

const baseUrl: string = "convai.speech";

interface IBackendValues {
    authHeader: string;
    resourcePath: string;
    version: string;
}

const botFramework: IBackendValues = {
    authHeader: "X-DLS-Secret",
    resourcePath: "",
    version: "v3"
};

const customCommands: IBackendValues = {
    authHeader: "X-CommandsAppId",
    resourcePath: "commands",
    version: "v1"
};

const pathSuffix: string = "api";
const connectionID: string = "connectionId";

function getDialogSpecificValues(dialogType: string): IBackendValues {
    switch (dialogType) {
        case "custom_commands": {
            return customCommands;
        }
        case "bot_framework": {
            return botFramework;
        }
    }
    throw new Error(`Invalid dialog type '${dialogType}'`);
}

export class DialogConnectionFactory extends ConnectionFactoryBase {

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
        queryParams[QueryParameterNames.LanguageParamName] = language;
        queryParams[QueryParameterNames.FormatParamName] = config.parameters.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]).toLowerCase();
        queryParams[QueryParameterNames.RequestBotStatusMessagesParamName] = requestTurnStatus;
        queryParams[connectionID] = connectionId;

        const {resourcePath, version, authHeader} = getDialogSpecificValues(dialogType);

        const headers: IStringDictionary<string> = {};

        if (authInfo.token != null && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }

        if (applicationId !== "") {
            headers[authHeader] = applicationId;
        }

        // The URL used for connection is chosen in a priority order of specification:
        //  1. If a custom endpoint is provided, that URL is used verbatim.
        //  2. If a custom host is provided (e.g. "wss://my.custom.endpoint.com:1123"), a URL is constructed from it.
        //  3. If no custom connection details are provided, a URL is constructed from default values.
        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, "");
        if (endpoint === "") {
            const hostSuffix = (region && region.toLowerCase().startsWith("china")) ? ".azure.cn" : ".microsoft.com";
            const host: string = config.parameters.getProperty(
                PropertyId.SpeechServiceConnection_Host,
                `wss://${region}.${baseUrl}${hostSuffix}`);
            endpoint = `${host}`
                + (resourcePath ? `/${resourcePath}` : "")
                + `/${pathSuffix}/${version}`;
        }

        this.setCommonUrlParams(config, queryParams, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);
    }
}
