// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ProxyInfo,
    RestConfigBase,
    WebsocketConnection,
} from "../../common.browser/Exports";
import {
    IConnection,
    IStringDictionary,
} from "../../common/Exports";
import { Contracts } from "../../sdk/Contracts";
import {
    PropertyId
} from "../../sdk/Exports";
import {
    ConversationImpl
} from "../../sdk/Transcription/Conversation";
import { HeaderNames } from "../HeaderNames";
import { QueryParameterNames } from "../QueryParameterNames";
import {
    ConnectionFactoryBase
} from "./../ConnectionFactoryBase";
import {
    AuthInfo,
    RecognizerConfig,
    TranscriberConnectionFactory,
    TranslationConnectionFactory,
    WebsocketMessageFormatter,
} from "./../Exports";

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

    public create(config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string): IConnection {
        const isVirtMicArrayEndpoint = config.parameters.getProperty("ConversationTranslator_MultiChannelAudio", "").toUpperCase() === "TRUE";

        if (isVirtMicArrayEndpoint) {
            // connecting to the conversation transcription virtual microphone array endpoint

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

            let endpointUrl = config.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint);
            if (!endpointUrl) {
                const hostName = config.parameters.getProperty(
                    PropertyId.SpeechServiceConnection_Host,
                    "transcribe.{region}.cts.speech{hostSuffix}");

                endpointUrl = "wss://" + hostName + "{path}";
            }

            // because the region can change during a session, we support being passed a format string which we can then
            // replace with the correct information.
            endpointUrl = ConversationTranslatorConnectionFactory.formatString(endpointUrl, replacementValues);

            const queryParams: IStringDictionary<string> = {};

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

            for (const key in queryParams) {
                if (queryParams.hasOwnProperty(key)) {
                    parsedUrl.searchParams.set(key, queryParams[key]);
                }
            }

            const headers: IStringDictionary<string> = {};
            headers[HeaderNames.ConnectionId] = connectionId;
            headers[RestConfigBase.configParams.token] = convInfo.token;
            if (authInfo.token) {
                headers[authInfo.headerName] = authInfo.token;
            }

            // Explicitly don't save the endpoint URL to future reconnections to properly regenerate the endpoint URL possibly
            // using a different region
            endpointUrl = parsedUrl.toString();

            const enableCompression = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "").toUpperCase() === "TRUE";
            return new WebsocketConnection(
                endpointUrl,
                queryParams,
                headers,
                new WebsocketMessageFormatter(),
                ProxyInfo.fromRecognizerConfig(config),
                enableCompression,
                connectionId);
        } else {
            // connecting to regular translation endpoint
            const connFactory = new TranslationConnectionFactory();
            return connFactory.create(config, authInfo, connectionId);
        }
    }

    protected static formatString(format: string, replacements: IStringDictionary<string>): string {
        let formatted: string = "";

        if (!format) {
            return formatted;
        }

        let value: string = "";
        let active: string = formatted;

        for (let i = 0; i < format.length; i++) {
            const current = format[i];
            const next = i < format.length - 1 ? format[i + 1] : null;

            switch (current) {
                case "{":
                    if (next === "{") {
                        // escaped '{'
                        active += current;
                        i++;
                    } else {
                        active = value;
                    }
                    break;

                case "}":
                    if (next === "}") {
                        // escaped '}'
                        active += current;
                        i++;
                    } else {
                        if (value in replacements) {
                            formatted += replacements[value];
                        } else {
                            // add back the replacement string
                            formatted += `{${value}}`;
                        }

                        value = "";
                        active = formatted;
                    }
                    break;

                default:
                    active += current;
                    break;
            }
        }

        // Do we have any trailing replacement keys?
        if (active === value) {
            formatted += "{";
            formatted += value;
        }

        return formatted;
    }
}
