// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports.js";
import {
    IConnection,
    IStringDictionary,
} from "../common/Exports.js";
import { StringUtils } from "../common/StringUtils.js";
import {
    PropertyId
} from "../sdk/Exports.js";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase.js";
import {
    AuthInfo,
    RecognizerConfig,
    WebsocketMessageFormatter,
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import { QueryParameterNames } from "./QueryParameterNames.js";
import { RecognitionMode } from "./ServiceMessages/PhraseDetection/PhraseDetectionContext.js";

export class TranslationConnectionFactory extends ConnectionFactoryBase {

    private readonly universalUri: string = "/stt/speech/universal/v2";
    private readonly translationV1Uri: string = "/speech/translation/cognitiveservices/v1";

    public async create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): Promise<IConnection> {

        let endpoint: string = this.getEndpointUrl(config);

        const queryParams: IStringDictionary<string> = {};

        // Determine if we're using V1 or V2 endpoint
        this.setQueryParams(queryParams, config, endpoint);

        if (!!endpoint) {
            const endpointUrl = new URL(endpoint);
            const pathName = endpointUrl.pathname;

            if (pathName === "" || pathName === "/") {
                // We need to generate the path, and we need to check for a redirect.
                endpointUrl.pathname = this.universalUri;

                endpoint = await ConnectionFactoryBase.getRedirectUrlFromEndpoint(endpointUrl.toString());
            }
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        const webSocketConnection = new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);

        return webSocketConnection;
    }

    public getEndpointUrl(config: RecognizerConfig, returnRegionPlaceholder?: boolean): string {
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region);
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);

        // First check for an explicitly specified endpoint
        let endpointUrl: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);

        // If an explicit endpoint is provided, use it
        if (endpointUrl) {
            if (returnRegionPlaceholder === true) {
                return endpointUrl;
            }
            return StringUtils.formatString(endpointUrl, { region });
        }

        // Check if V1 endpoint is explicitly requested
        const forceV1Endpoint: boolean = config.parameters.getProperty("SPEECH-ForceV1Endpoint", "false") === "true";

        if (forceV1Endpoint) {
            // Use V1 endpoint with s2s.speech host
            const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://{region}.s2s.speech" + hostSuffix);
            endpointUrl = host + this.translationV1Uri;
        } else {
            // Default to V2 endpoint with stt.speech host
            const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://{region}.stt.speech" + hostSuffix);
            endpointUrl = host + this.universalUri;
        }

        if (returnRegionPlaceholder === true) {
            return endpointUrl;
        }

        return StringUtils.formatString(endpointUrl, { region });
    }

    public setQueryParams(queryParams: IStringDictionary<string>, config: RecognizerConfig, endpointUrl: string): void {
        // Common parameters for both V1 and V2 endpoints
        queryParams.from = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
        queryParams.to = config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages);
        queryParams.scenario = config.recognitionMode === RecognitionMode.Interactive ? "interactive" :
            config.recognitionMode === RecognitionMode.Conversation ? "conversation" : "";

        // Set common parameters
        this.setCommonUrlParams(config, queryParams, endpointUrl);
        this.setUrlParameter(
            PropertyId.SpeechServiceResponse_TranslationRequestStablePartialResult,
            QueryParameterNames.StableTranslation,
            config,
            queryParams,
            endpointUrl
        );

        // Handle translation voice if specified
        const translationVoice: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice, undefined);
        if (translationVoice !== undefined) {
            queryParams.voice = translationVoice;
            // Updated to match C++ implementation
            queryParams.features = "requireVoice";
        }
    }
}
