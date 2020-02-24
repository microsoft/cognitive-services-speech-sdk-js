// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IStringDictionary } from "../../common/Exports";
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
    public createOrJoin(args: PropertyCollection, conversationCode: string, cb?: any, err?: any): void {

        try {

            Contracts.throwIfNullOrUndefined(args, "args");

            const languageCode: string = args.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, ConversationTranslatorConfig.defaultLanguageCode);
            const nickname: string = args.getProperty(PropertyId.ConversationTranslator_Name);
            const endpointHost: string = args.getProperty(PropertyId.ConversationTranslator_Host, ConversationTranslatorConfig.host);
            const correlationId: string = args.getProperty(PropertyId.ConversationTranslator_CorrelationId);
            const subscriptionKey: string = args.getProperty(PropertyId.SpeechServiceConnection_Key);
            const subscriptionRegion: string = args.getProperty(PropertyId.SpeechServiceConnection_Region);
            const authToken: string = args.getProperty(PropertyId.SpeechServiceAuthorization_Token);

            Contracts.throwIfNullOrWhitespace(languageCode, "languageCode");
            Contracts.throwIfNullOrWhitespace(nickname, "nickname");
            Contracts.throwIfNullOrWhitespace(endpointHost, "endpointHost");

            const queryParams: IStringDictionary<string> = {};
            queryParams[ConversationTranslatorConfig.params.apiVersion] = ConversationTranslatorConfig.apiVersion;
            queryParams[ConversationTranslatorConfig.params.languageCode] = languageCode;
            queryParams[ConversationTranslatorConfig.params.nickname] = nickname;

            const headers: IStringDictionary<string> = {};
            if (correlationId) {
                headers[ConversationTranslatorConfig.params.correlationId] = correlationId;
            }
            headers[ConversationTranslatorConfig.params.clientAppId] = ConversationTranslatorConfig.clientAppId;

            if (conversationCode !== undefined) {
                queryParams[ConversationTranslatorConfig.params.roomId] = conversationCode;
            } else {
                Contracts.throwIfNullOrUndefined(subscriptionRegion, ConversationTranslatorConfig.strings.authInvalidSubscriptionRegion);
                headers[ConversationTranslatorConfig.params.subscriptionRegion] = subscriptionRegion;
                if (subscriptionKey) {
                    headers[ConversationTranslatorConfig.params.subscriptionKey] = subscriptionKey;
                } else if (authToken) {
                    headers[ConversationTranslatorConfig.params.authorization] = `Bearer ${authToken}`;
                } else {
                    Contracts.throwIfNullOrUndefined(subscriptionKey, ConversationTranslatorConfig.strings.authInvalidSubscriptionKey);
                }
            }

            const config: IRequestOptions = {};
            config.headers = headers;

            const endpoint: string = `https://${endpointHost}${ConversationTranslatorConfig.restPath}`;

            // TODO: support a proxy
            request("post", endpoint, queryParams, null, config, (response: IResponse) => {

                const requestId: string = extractHeaderValue(ConversationTranslatorConfig.params.requestId, response.headers);

                if (!response.ok) {
                    if (!!err) {
                        // get the error
                        let errorMessage: string = ConversationTranslatorConfig.strings.invalidCreateJoinConversationResponse.replace("{status}", response.status.toString());
                        let errMessageRaw: IConversationResponseError;
                        try {
                            errMessageRaw = JSON.parse(response.data) as IConversationResponseError;
                            errorMessage += ` [${errMessageRaw.error.code}: ${errMessageRaw.error.message}]`;
                        } catch (e) {
                            errorMessage += ` [${response.data}]`;
                        }
                        if (requestId) {
                            errorMessage += ` ${requestId}`;
                        }

                        err(errorMessage);
                    }
                    return;
                }
                const conversation: IInternalConversation = JSON.parse(response.data) as IInternalConversation;
                if (conversation) {
                    conversation.requestId = requestId;
                }
                if (!!cb) {
                    try {
                        cb(conversation);
                    } catch (e) {
                        if (!!err) {
                            err(e);
                        }
                    }
                    cb = undefined;
                }

            });

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);

                } else {
                    err(error);
                }
            }
        }
    }

    /**
     * Make a DELETE request to the Conversation Manager service endpoint to leave the conversation.
     * @param args
     * @param sessionToken
     * @param callback
     */
    public leave(args: PropertyCollection, sessionToken: string, cb?: any, err?: any): void {

        try {

            Contracts.throwIfNullOrUndefined(args, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "config"));
            Contracts.throwIfNullOrWhitespace(sessionToken, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "token"));

            const endpointHost: string = args.getProperty(PropertyId.ConversationTranslator_Host, ConversationTranslatorConfig.host);
            const correlationId: string = args.getProperty(PropertyId.ConversationTranslator_CorrelationId);

            const queryParams: IStringDictionary<string> = {};
            queryParams[ConversationTranslatorConfig.params.apiVersion] = ConversationTranslatorConfig.apiVersion;
            queryParams[ConversationTranslatorConfig.params.sessionToken] = sessionToken;

            const headers: IStringDictionary<string> = {};
            if (correlationId) {
                headers[ConversationTranslatorConfig.params.correlationId] = correlationId;
            }

            const config: IRequestOptions = {};
            config.headers = headers;

            const endpoint: string = `https://${endpointHost}${ConversationTranslatorConfig.restPath}`;

            // TODO: support a proxy
            request("delete", endpoint, queryParams, null, config, (response: IResponse) => {

                if (!response.ok) {
                    // ignore errors on delete
                }

                if (!!cb) {
                    try {
                        cb();
                    } catch (e) {
                        if (!!err) {
                            err(e);
                        }
                    }
                    cb = undefined;
                }
            });

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error as Error;
                    err(typedError.name + ": " + typedError.message);

                } else {
                    err(error);
                }
            }
        }
    }

}
