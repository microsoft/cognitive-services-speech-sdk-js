// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    WebsocketConnection,
} from "../common.browser/Exports";
import {
    IConnection,
    IStringDictionary,
} from "../common/Exports";
import {
    PropertyId
} from "../sdk/Exports";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase";
import {
    AuthInfo,
    IConnectionFactory,
    RecognizerConfig,
    WebsocketMessageFormatter,
} from "./Exports";
import { QueryParameterNames } from "./QueryParameterNames";

const TestHooksParamName: string = "testhooks";
const ConnectionIdHeader: string = "X-ConnectionId";

export class TranslationConnectionFactory extends ConnectionFactoryBase {

    public create = (
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection => {

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        if (!endpoint) {
            const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, undefined);

            endpoint = "wss://" + region + ".s2s.speech.microsoft.com/speech/translation/cognitiveservices/v1";
        }

        const queryParams: IStringDictionary<string> = {
            from: config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage),
            to: config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages),
        };

        this.setCommonUrlParams(config, queryParams, endpoint);
        this.setUrlParameter(
            PropertyId.SpeechServiceResponse_TranslationRequestStablePartialResult,
            QueryParameterNames.StableTranslation,
            config,
            queryParams,
            endpoint
        );

        const voiceName: string = "voice";
        const featureName: string = "features";

        if (config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice, undefined) !== undefined) {
            queryParams[voiceName] = config.parameters.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice);
            queryParams[featureName] = "texttospeech";
        }

        const headers: IStringDictionary<string> = {};
        headers[authInfo.headerName] = authInfo.token;
        headers[ConnectionIdHeader] = connectionId;

        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), connectionId);
    }
}
