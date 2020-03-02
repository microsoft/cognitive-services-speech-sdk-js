// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ProxyInfo, WebsocketConnection } from "../../common.browser/Exports";
import { createGuid, IConnection, IStringDictionary } from "../../common/Exports";
import { Contracts } from "../../sdk/Contracts";
import { PropertyId } from "../../sdk/Exports";
import { ConnectionFactoryBase } from "../ConnectionFactoryBase";
import { AuthInfo, RecognizerConfig } from "../Exports";
import { ConversationTranslatorConfig } from "./ConversationUtils";
import { ConversationWebsocketMessageFormatter } from "./ConversationWebsocketMessageFormatter";

/**
 * Create a connection to the Conversation Translator websocket for sending instant messages and commands, and for receiving translated messages.
 * The conversation must already have been started or joined.
 */
export class ConversationConnectionFactory extends ConnectionFactoryBase  {

    public create(config: RecognizerConfig, authInfo: AuthInfo, connectionId?: string): IConnection {

        const endpointHost: string = config.parameters.getProperty(PropertyId.ConversationTranslator_Host, ConversationTranslatorConfig.host);
        const correlationId: string = config.parameters.getProperty(PropertyId.ConversationTranslator_CorrelationId, createGuid());

        const endpoint: string = `wss://${endpointHost}${ConversationTranslatorConfig.webSocketPath}`;
        const token: string = config.parameters.getProperty(PropertyId.ConversationTranslator_Token, undefined);
        Contracts.throwIfNullOrUndefined(token, "token");

        const queryParams: IStringDictionary<string> = {};
        queryParams[ConversationTranslatorConfig.params.apiVersion] = ConversationTranslatorConfig.apiVersion;
        queryParams[ConversationTranslatorConfig.params.token] = token;
        queryParams[ConversationTranslatorConfig.params.correlationId] = correlationId;
        return new WebsocketConnection(endpoint, queryParams, {}, new ConversationWebsocketMessageFormatter(), ProxyInfo.fromRecognizerConfig(config), connectionId);

    }

}
