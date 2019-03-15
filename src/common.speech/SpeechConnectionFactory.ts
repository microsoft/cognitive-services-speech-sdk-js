// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import { OutputFormatPropertyName } from "../common.speech/Exports";
import { IConnection, IStringDictionary } from "../common/Exports";
import { OutputFormat, PropertyId } from "../sdk/Exports";
import { AuthInfo, IConnectionFactory, RecognitionMode, RecognizerConfig, WebsocketMessageFormatter } from "./Exports";
import { QueryParameterNames } from "./QueryParameterNames";

export class SpeechConnectionFactory implements IConnectionFactory {

    private readonly interactiveRelativeUri: string = "/speech/recognition/interactive/cognitiveservices/v1";
    private readonly conversationRelativeUri: string = "/speech/recognition/conversation/cognitiveservices/v1";
    private readonly dictationRelativeUri: string = "/speech/recognition/dictation/cognitiveservices/v1";

    public create = (
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection => {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);

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

        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, undefined);

            const host: string = "wss://" + region + ".stt.speech.microsoft.com";

            switch (config.recognitionMode) {
                case RecognitionMode.Conversation:
                    endpoint = host + this.conversationRelativeUri;
                    break;
                case RecognitionMode.Dictation:
                    endpoint = host + this.dictationRelativeUri;
                    break;
                default:
                    endpoint = host + this.interactiveRelativeUri; // default is interactive
                    break;
            }
        }

        const headers: IStringDictionary<string> = {};
        headers[authInfo.headerName] = authInfo.token;
        headers[QueryParameterNames.ConnectionIdHeader] = connectionId;

        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), connectionId);
    }
}
