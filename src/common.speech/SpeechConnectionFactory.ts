// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports.js";
import {
    ForceDictationPropertyName,
    OutputFormatPropertyName,
} from "../common.speech/Exports.js";
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
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import {
    QueryParameterNames
} from "./QueryParameterNames.js";
import { RecognitionMode } from "./ServiceMessages/PhraseDetection/PhraseDetectionContext.js";

export class SpeechConnectionFactory extends ConnectionFactoryBase {

    private readonly interactiveRelativeUri: string = "/speech/recognition/interactive/cognitiveservices/v1";
    private readonly conversationRelativeUri: string = "/speech/recognition/conversation/cognitiveservices/v1";
    private readonly dictationRelativeUri: string = "/speech/recognition/dictation/cognitiveservices/v1";
    private readonly universalUri: string = "/stt/speech/universal/v";

    public async create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection> {

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

        if (!!endpoint) {
            const endpointUrl = new URL(endpoint);
            const pathName = endpointUrl.pathname;

            if (pathName === "" || pathName === "/") {
                // We need to generate the path, and we need to check for a redirect.
                endpointUrl.pathname = this.universalUri + config.recognitionEndpointVersion;

                endpoint = await ConnectionFactoryBase.getRedirectUrlFromEndpoint(endpointUrl.toString());
            }
        }

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
        headers.connectionId = connectionId;

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";

        const webSocketConnection = new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);

        // Set the value of SpeechServiceConnection_Url to webSocketConnection.uri (and not to `endpoint`), since this value is the final
        // URI that was used to make the connection (including query parameters).
        const uri: string = webSocketConnection.uri;
        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, uri);

        return webSocketConnection;
    }


}

