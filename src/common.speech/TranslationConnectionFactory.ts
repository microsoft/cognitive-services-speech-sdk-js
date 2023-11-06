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
    RecognitionMode,
    RecognizerConfig,
    WebsocketMessageFormatter,
} from "./Exports.js";
import { HeaderNames } from "./HeaderNames.js";
import { QueryParameterNames } from "./QueryParameterNames.js";

export class TranslationConnectionFactory extends ConnectionFactoryBase {

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection {

        const endpoint: string = this.getEndpointUrl(config);

        const queryParams: IStringDictionary<string> = {};

        if (config.autoDetectSourceLanguages !== undefined) {
            queryParams[QueryParameterNames.EnableLanguageId] = "true";
        }
        this.setQueryParams(queryParams, config, endpoint);

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);
    }

    public getEndpointUrl(config: RecognizerConfig, returnRegionPlaceholder?: boolean): string {

        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region);
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);

        let endpointUrl: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        if (!endpointUrl) {
            if (config.autoDetectSourceLanguages !== undefined) {
                const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://{region}.stt.speech" + hostSuffix);
                endpointUrl = host + "/speech/universal/v2";
            } else {
                const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, "wss://{region}.s2s.speech" + hostSuffix);
                endpointUrl = host + "/speech/translation/cognitiveservices/v1";
            }
        }

        if (returnRegionPlaceholder === true) {
            return endpointUrl;
        }

        return StringUtils.formatString(endpointUrl, { region });
    }

    public setQueryParams(queryParams: IStringDictionary<string>, config: RecognizerConfig, endpointUrl: string): void {

        queryParams.from = config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
        queryParams.to = config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages);
        queryParams.scenario = config.recognitionMode === RecognitionMode.Interactive ? "interactive" :
            config.recognitionMode === RecognitionMode.Conversation ? "conversation" : "";

        this.setCommonUrlParams(config, queryParams, endpointUrl);
        this.setUrlParameter(
            PropertyId.SpeechServiceResponse_TranslationRequestStablePartialResult,
            QueryParameterNames.StableTranslation,
            config,
            queryParams,
            endpointUrl
        );

        const translationVoice: string =  config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice, undefined);
        if (translationVoice !== undefined) {
            queryParams.voice = translationVoice;
            queryParams.features = "texttospeech";
        }
    }
}
