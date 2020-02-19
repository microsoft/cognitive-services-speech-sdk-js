// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createGuid, IStringDictionary } from "../../common/Exports";
import { Contracts } from "../../sdk/Contracts";
import { PropertyCollection, PropertyId } from "../../sdk/Exports";
import { IConversationResponseError, IInternalConversation, IRequestOptions, IResponse } from "./ConversationTranslatorInterfaces";
import { ConversationTranslatorConfig, extractHeaderValue, request } from "./ConversationUtils";

export class ConversationManager {

    constructor() {
        //
    }

    /**
     * Make a POST request to the Conversation Manager service endpoint to create or join a conversation.
     * @param args
     * @param conversationCode
     * @param callback
     * @param errorCallback
     */
    public createOrJoin(args: PropertyCollection, conversationCode: string, callback?: any, errorCallback?: any): void {

        try {

            Contracts.throwIfNullOrUndefined(args, "args");

            const languageCode: string = args.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, ConversationTranslatorConfig.defaultLanguageCode);
            const nickname: string = args.getProperty(PropertyId.ConversationTranslator_Name);
            const endpointHost: string = args.getProperty(PropertyId.ConversationTranslator_Host, ConversationTranslatorConfig.host);
            const correlationId: string = args.getProperty(PropertyId.ConversationTranslator_CorrelationId, createGuid());
            const subscriptionKey: string = args.getProperty(PropertyId.SpeechServiceConnection_Key);
            const subscriptionRegion: string = args.getProperty(PropertyId.SpeechServiceConnection_Region);

            Contracts.throwIfNullOrUndefined(languageCode, "languageCode");
            Contracts.throwIfNullOrUndefined(nickname, "nickname");
            Contracts.throwIfNullOrUndefined(endpointHost, "endpointHost");
            Contracts.throwIfNullOrUndefined(correlationId, "correlationId");

            const queryParams: IStringDictionary<string> = {};
            queryParams[ConversationTranslatorConfig.params.apiVersion] = ConversationTranslatorConfig.apiVersion;
            queryParams[ConversationTranslatorConfig.params.languageCode] = languageCode;
            queryParams[ConversationTranslatorConfig.params.nickname] = nickname;

            const headers: IStringDictionary<string> = {};
            headers[ConversationTranslatorConfig.params.correlationId] = args.getProperty(PropertyId.ConversationTranslator_CorrelationId, correlationId);
            headers[ConversationTranslatorConfig.params.clientAppId] = ConversationTranslatorConfig.clientAppId;

            if (conversationCode !== undefined) {
                queryParams[ConversationTranslatorConfig.params.roomId] = conversationCode;
            } else {
                Contracts.throwIfNullOrUndefined(subscriptionKey, "You must specify either an authentication token to use, or a Cognitive Speech subscription key");
                Contracts.throwIfNullOrUndefined(subscriptionRegion, "You must specify the cognitive speech region to use");

                headers[ConversationTranslatorConfig.params.subscriptionKey] = subscriptionKey;
                headers[ConversationTranslatorConfig.params.subscriptionRegion] = subscriptionRegion;
            }

            const config: IRequestOptions = {};
            config.headers = headers;

            const endpoint: string = `https://${endpointHost}${ConversationTranslatorConfig.restPath}`;

            // TODO: support a proxy
            request("post", endpoint, queryParams, null, config, (response: IResponse) => {

                const requestId: string = extractHeaderValue(ConversationTranslatorConfig.params.requestId, response.headers);

                if (!response.ok) {

                    if (!!errorCallback) {
                        // get the error
                        let errorMessage: string = `Creating/Joining room failed with HTTP ${response.status}`;
                        let errMessageRaw: IConversationResponseError;
                        try {
                            errMessageRaw = JSON.parse(response.data) as IConversationResponseError;
                            errorMessage += ` [${errMessageRaw.error.code}: ${errMessageRaw.error.message} ${requestId}]`;
                        } catch (e) {
                            // ignore
                        }

                        errorCallback(errorMessage);
                    }
                    return;
                }
                const conversation: IInternalConversation = JSON.parse(response.data) as IInternalConversation;
                if (conversation) {
                    conversation.requestId = requestId;
                }
                if (!!callback) {
                    callback(conversation);
                }

            });

        } catch (e) {
            if (!!errorCallback) {
                errorCallback(`Creating/Joining room failed. ${e}`);
            }
        }
    }

    /**
     * Make a DELETE request to the Conversation Manager service endpoint to leave the conversation.
     * @param args
     * @param sessionToken
     * @param callback
     */
    public leave(args: PropertyCollection, sessionToken: string, callback?: any): void {

        try {

            Contracts.throwIfNullOrUndefined(args, "args");

            const endpointHost: string = args.getProperty(PropertyId.ConversationTranslator_Host, ConversationTranslatorConfig.host);
            const correlationId: string = args.getProperty(PropertyId.ConversationTranslator_CorrelationId, createGuid());

            const queryParams: IStringDictionary<string> = {};
            queryParams[ConversationTranslatorConfig.params.apiVersion] = ConversationTranslatorConfig.apiVersion;
            queryParams[ConversationTranslatorConfig.params.sessionToken] = sessionToken;

            const headers: IStringDictionary<string> = {};
            headers[ConversationTranslatorConfig.params.correlationId] = correlationId;

            const config: IRequestOptions = {};
            config.headers = headers;

            const endpoint: string = `https://${endpointHost}${ConversationTranslatorConfig.restPath}`;

            // TODO: support a proxy
            request("delete", endpoint, queryParams, null, config, (response: IResponse) => {

                if (!response.ok) {
                    // ignore errors on delete
                }

                if (!!callback) {
                    callback();
                }
            });

        } catch (e) {
            // ignore errors on delete
        }
    }

}
