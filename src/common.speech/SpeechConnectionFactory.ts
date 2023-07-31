// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import {
    ForceDictationPropertyName,
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
    RecognitionMode,
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports";
import { HeaderNames } from "./HeaderNames";
import {
    QueryParameterNames
} from "./QueryParameterNames";

export class SpeechConnectionFactory extends ConnectionFactoryBase {

    private readonly interactiveRelativeUri: string = "/speech/recognition/interactive/cognitiveservices/v1";
    private readonly conversationRelativeUri: string = "/speech/recognition/conversation/cognitiveservices/v1";
    private readonly dictationRelativeUri: string = "/speech/recognition/dictation/cognitiveservices/v1";
    private readonly universalUri: string = "/speech/universal/v";

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, undefined);
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://" + region + ".stt.speech" + hostSuffix);
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

        if (!endpoint || endpoint.search(QueryParameterNames.Format) === -1) {
            queryParams[QueryParameterNames.Format] = config.parameters.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]).toLowerCase();
        }

        if (config.autoDetectSourceLanguages !== undefined) {
            queryParams[QueryParameterNames.EnableLanguageId] = "true";
        }

        this.setCommonUrlParams(config, queryParams, endpoint);

        if (!endpoint) {
            switch (config.recognitionMode) {
                case RecognitionMode.Conversation:
                    if (config.parameters.getProperty(ForceDictationPropertyName, "false") === "true") {
                        endpoint = host + this.dictationRelativeUri;
                    } else {
                        if (config.recognitionEndpointVersion !== undefined && parseInt(config.recognitionEndpointVersion, 10) > 1) {
                            endpoint = `${host}${this.universalUri}${config.recognitionEndpointVersion}`;
                        } else {
                            endpoint = host + this.conversationRelativeUri;
                        }
                    }
                    break;
                case RecognitionMode.Dictation:
                    endpoint = host + this.dictationRelativeUri;
                    break;
                default:
                    if (config.recognitionEndpointVersion !== undefined && parseInt(config.recognitionEndpointVersion, 10) > 1) {
                        endpoint = `${host}${this.universalUri}${config.recognitionEndpointVersion}`;
                    } else {
                        endpoint = host + this.interactiveRelativeUri; // default is interactive
                    }
                    break;
            }
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";

        const webSocketConnection = new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);

        // Set the value of SpeechServiceConnection_Url to webSocketConnection.uri (and not to `endpoint`), since this value is the final
        // URI that was used to make the connection (including query parameters).
        const uri: string = webSocketConnection.uri;
        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, uri);

        return webSocketConnection;
    }
}
