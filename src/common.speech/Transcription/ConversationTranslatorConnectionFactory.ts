// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    RestConfigBase,
    WebsocketConnection,
} from "../../common.browser/Exports.js";
import {
    IConnection,
    IStringDictionary,
} from "../../common/Exports.js";
import { StringUtils } from "../../common/StringUtils.js";
import { Contracts } from "../../sdk/Contracts.js";
import {
    PropertyId
} from "../../sdk/Exports.js";
import {
    ConversationImpl
} from "../../sdk/Transcription/Conversation.js";
import { HeaderNames } from "../HeaderNames.js";
import { QueryParameterNames } from "../QueryParameterNames.js";
import {
    ConnectionFactoryBase
} from "./../ConnectionFactoryBase.js";
import {
    AuthInfo,
    RecognizerConfig,
    TranscriberConnectionFactory,
    TranslationConnectionFactory,
    WebsocketMessageFormatter,
} from "./../Exports.js";

/**
 * Connection factory for the conversation translator. Handles connecting to the regular translator endpoint,
 * as well as the virtual microphone array transcription endpoint
 */
export class ConversationTranslatorConnectionFactory extends ConnectionFactoryBase {

    private static readonly CTS_VIRT_MIC_PATH: string = "/speech/recognition/dynamicaudio";

    private privConvGetter: () => ConversationImpl;

    public constructor(convGetter: () => ConversationImpl) {
        super();

        Contracts.throwIfNullOrUndefined(convGetter, "convGetter");
        this.privConvGetter = convGetter;
    }

    public create(config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string): Promise<IConnection> {
        const isVirtMicArrayEndpoint = config.parameters.getProperty("ConversationTranslator_MultiChannelAudio", "").toUpperCase() === "TRUE";

        const convInfo = this.privConvGetter().room;
        const region = convInfo.cognitiveSpeechRegion || config.parameters.getProperty(PropertyId.SpeechServiceConnection_Region, "");

        const replacementValues: IStringDictionary<string> = {
            hostSuffix: ConnectionFactoryBase.getHostSuffix(region),
            path: ConversationTranslatorConnectionFactory.CTS_VIRT_MIC_PATH,
            region: encodeURIComponent(region)
        };
        replacementValues[QueryParameterNames.Language] = encodeURIComponent(config.parameters.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, ""));
        replacementValues[QueryParameterNames.CtsMeetingId] = encodeURIComponent(convInfo.roomId);
        replacementValues[QueryParameterNames.CtsDeviceId] = encodeURIComponent(convInfo.participantId);
        replacementValues[QueryParameterNames.CtsIsParticipant] = convInfo.isHost ? "" : ("&" + QueryParameterNames.CtsIsParticipant);

        let endpointUrl: string = "";
        const queryParams: IStringDictionary<string> = {};
        const headers: IStringDictionary<string> = {};

        if (isVirtMicArrayEndpoint) {
            // connecting to the conversation transcription virtual microphone array endpoint
            endpointUrl = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint);
            if (!endpointUrl) {
                const hostName = config.parameters.getProperty(
                    PropertyId.SpeechServiceConnection_Host,
                    "transcribe.{region}.cts.speech{hostSuffix}");

                endpointUrl = "wss://" + hostName + "{path}";
            }

            // because the region can change during a session, we support being passed a format string which we can then
            // replace with the correct information.
            endpointUrl = StringUtils.formatString(endpointUrl, replacementValues);

            const parsedUrl = new URL(endpointUrl);
            parsedUrl.searchParams.forEach((val: string, key: string): void => {
                queryParams[key] = val;
            });

            const connFactory = new TranscriberConnectionFactory();
            connFactory.setQueryParams(queryParams, config, endpointUrl);

            // Some query parameters are required for the CTS endpoint, let's explicity set them here
            queryParams[QueryParameterNames.CtsMeetingId] = replacementValues[QueryParameterNames.CtsMeetingId];
            queryParams[QueryParameterNames.CtsDeviceId] = replacementValues[QueryParameterNames.CtsDeviceId];
            if (!convInfo.isHost) {
                queryParams[QueryParameterNames.CtsIsParticipant] = ""; // this doesn't have a value so set to an empty string
            }

            if (!(QueryParameterNames.Format in queryParams)) {
                queryParams[QueryParameterNames.Format] = "simple";
            }

            parsedUrl.searchParams.forEach((val: string, key: string): void => {
                parsedUrl.searchParams.set(key, queryParams[key]);
                delete queryParams[key];
            });

            endpointUrl = parsedUrl.toString();

        } else {
            // connecting to regular translation endpoint
            const connFactory = new TranslationConnectionFactory();

            endpointUrl = connFactory.getEndpointUrl(config, true);
            endpointUrl = StringUtils.formatString(endpointUrl, replacementValues);

            connFactory.setQueryParams(queryParams, config, endpointUrl);
        }

        headers[HeaderNames.ConnectionId] = connectionId;
        headers[RestConfigBase.configParams.token] = convInfo.token;
        if (!!authInfo.token) {
            headers[authInfo.headerName] = authInfo.token;
        }

        const enableCompression = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "").toUpperCase() === "TRUE";
        return Promise.resolve(new WebsocketConnection(endpointUrl, queryParams, headers, new WebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId));
    }
}
