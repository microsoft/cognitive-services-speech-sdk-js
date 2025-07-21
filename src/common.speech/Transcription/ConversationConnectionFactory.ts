// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProxyInfo, WebsocketConnection } from "../../common.browser/Exports.js";
import { createGuid, IConnection, IStringDictionary } from "../../common/Exports.js";
import { Contracts } from "../../sdk/Contracts.js";
import { PropertyId } from "../../sdk/Exports.js";
import { ConnectionFactoryBase } from "../ConnectionFactoryBase.js";
import { AuthInfo, RecognizerConfig } from "../Exports.js";
import { ConversationConnectionConfig } from "./ConversationConnectionConfig.js";
import { ConversationWebsocketMessageFormatter } from "./ConversationWebsocketMessageFormatter.js";

/**
 * Create a connection to the Conversation Translator websocket for sending instant messages and commands, and for receiving translated messages.
 * The conversation must already have been started or joined.
 */
export class ConversationConnectionFactory extends ConnectionFactoryBase {

    public create(config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string): Promise<IConnection> {

        const endpointHost: string = config.parameters.getProperty(PropertyId.ConversationTranslator_Host, ConversationConnectionConfig.host);
        const correlationId: string = config.parameters.getProperty(PropertyId.ConversationTranslator_CorrelationId, createGuid());

        const endpoint: string = `wss://${endpointHost}${ConversationConnectionConfig.webSocketPath}`;
        const token: string = config.parameters.getProperty(PropertyId.ConversationTranslator_Token, undefined);
        Contracts.throwIfNullOrUndefined(token, "token");

        const queryParams: IStringDictionary<string> = {};
        queryParams[ConversationConnectionConfig.configParams.apiVersion] = ConversationConnectionConfig.apiVersion;
        queryParams[ConversationConnectionConfig.configParams.token] = token;
        queryParams[ConversationConnectionConfig.configParams.correlationId] = correlationId;
        const enableCompression: boolean = config.parameters.getProperty("SPEECH-EnableWebsocketCompression", "false") === "true";
        return Promise.resolve(new WebsocketConnection(endpoint, queryParams, {}, new ConversationWebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), enableCompression, connectionId));
    }

}
