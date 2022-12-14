// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    RestConfigBase,
    WebsocketConnection,
} from "../common.browser/Exports";
import {
    IConnection,
    IStringDictionary
} from "../common/Exports";
import {
    OutputFormat,
    PropertyId
} from "../sdk/Exports";
import { ConversationImpl } from "../sdk/Transcription/Conversation";
import {
    ConnectionFactoryBase
} from "./ConnectionFactoryBase";
import {
    AuthInfo,
    OutputFormatPropertyName,
    RecognizerConfig,
    WebsocketMessageFormatter
} from "./Exports";
import { HeaderNames } from "./HeaderNames";
import {
    QueryParameterNames
} from "./QueryParameterNames";

export class TranscriberConnectionFactory extends ConnectionFactoryBase {

    private readonly multiaudioRelativeUri: string = "/speech/recognition/multiaudio";
    private readonly dynamicAudioRelativeUri: string = "/speech/recognition/dynamicaudio";

    private privGetConversationFunc: () => ConversationImpl;

    public set getConversationFunc(getter: () => ConversationImpl) {
        this.privGetConversationFunc = getter;
    }

    public create(
        config: RecognizerConfig,
        authInfo: AuthInfo,
        connectionId?: string): IConnection {

        const isVirtMicArrayEndpoint: boolean = config.parameters.getProperty("ConversationTranslator_MultiChannelAudio", "").toUpperCase() === "TRUE";

        let endpoint: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint, undefined);
        const region: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "centralus");
        const hostSuffix: string = ConnectionFactoryBase.getHostSuffix(region);
        const hostDefault: string = "wss://transcribe." + region + ".cts.speech" + hostSuffix + (isVirtMicArrayEndpoint ? this.dynamicAudioRelativeUri : this.multiaudioRelativeUri);
        const host: string = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Host, hostDefault);

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

        const wordLevelTimings: boolean = config.parameters.getProperty(PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps, "false").toLowerCase() === "true";
        const detailed: boolean = config.parameters.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]) !== OutputFormat[OutputFormat.Simple];
        if (wordLevelTimings || detailed) {
            queryParams[QueryParameterNames.Format] = OutputFormat[OutputFormat.Detailed].toLowerCase();
        }

        this.setCommonUrlParams(config, queryParams, endpoint);

        let conv: ConversationImpl = null;
        if (this.privGetConversationFunc) {
            conv = this.privGetConversationFunc();
        }

        if (isVirtMicArrayEndpoint && conv) {
            // the virtual microphone array endpoint requires some additional query parameters to properly integrate with the conversation
            // translator service. Let's add them here
            queryParams[QueryParameterNames.CtsMeetingId] = conv.conversationId;
            queryParams[QueryParameterNames.CtsDeviceId] = conv.room.participantId;

            if (conv.room.isHost !== true) {
                queryParams[QueryParameterNames.CtsIsParticipant] = null;
            }

            if (!(QueryParameterNames.Format in queryParams)) {
                queryParams[QueryParameterNames.Format] = "simple";
            }
        }

        if (!endpoint) {
            endpoint = host;
        }

        const headers: IStringDictionary<string> = {};
        if (authInfo.token !== undefined && authInfo.token !== "") {
            headers[authInfo.headerName] = authInfo.token;
        }
        headers[HeaderNames.ConnectionId] = connectionId;

        if (isVirtMicArrayEndpoint && conv) {
            headers[RestConfigBase.configParams.token] = conv.room.token;
        }

        config.parameters.setProperty(PropertyId.SpeechServiceConnection_Url, endpoint);

        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return new WebsocketConnection(endpoint, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId);
    }
}
