// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IRequestOptions,
    IRestParams,
    IRestResponse,
    RestMessageAdapter,
    RestRequestType
} from "../../common.browser/Exports.js";
import { IErrorMessages, IStringDictionary } from "../../common/Exports.js";
import { Contracts } from "../../sdk/Contracts.js";
import { PropertyCollection, PropertyId } from "../../sdk/Exports.js";
import { ConversationConnectionConfig } from "./ConversationConnectionConfig.js";
import { IConversationResponseError, IInternalConversation } from "./ConversationTranslatorInterfaces.js";

export class ConversationManager {

    private privRequestParams: IRestParams;
    private privErrors: IErrorMessages;
    private privHost: string;
    private privApiVersion: string;
    private privRestPath: string;
    private privRestAdapter: RestMessageAdapter;

    public constructor() {
        //
        this.privRequestParams = ConversationConnectionConfig.configParams;
        this.privErrors = ConversationConnectionConfig.restErrors;
        this.privHost = ConversationConnectionConfig.host;
        this.privApiVersion = ConversationConnectionConfig.apiVersion;
        this.privRestPath = ConversationConnectionConfig.restPath;
        this.privRestAdapter = new RestMessageAdapter({});
    }

    /**
     * Make a POST request to the Conversation Manager service endpoint to create or join a conversation.
     * @param args
     * @param conversationCode
     * @param callback
     * @param errorCallback
     */
    public createOrJoin(args: PropertyCollection, conversationCode: string, cb?: (c: any) => void, err?: (e: string) => void): void {

        try {

            Contracts.throwIfNullOrUndefined(args, "args");

            const languageCode: string = args.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage, ConversationConnectionConfig.defaultLanguageCode);
            const nickname: string = args.getProperty(PropertyId.ConversationTranslator_Name, "conversation_host");
            const endpointHost: string = args.getProperty(PropertyId.ConversationTranslator_Host, this.privHost);
            const correlationId: string = args.getProperty(PropertyId.ConversationTranslator_CorrelationId);
            const subscriptionKey: string = args.getProperty(PropertyId.SpeechServiceConnection_Key);
            const subscriptionRegion: string = args.getProperty(PropertyId.SpeechServiceConnection_Region);
            const authToken: string = args.getProperty(PropertyId.SpeechServiceAuthorization_Token);

            Contracts.throwIfNullOrWhitespace(languageCode, "languageCode");
            Contracts.throwIfNullOrWhitespace(nickname, "nickname");
            Contracts.throwIfNullOrWhitespace(endpointHost, "endpointHost");

            const queryParams: IStringDictionary<string> = {};
            queryParams[this.privRequestParams.apiVersion] = this.privApiVersion;
            queryParams[this.privRequestParams.languageCode] = languageCode;
            queryParams[this.privRequestParams.nickname] = nickname;

            const headers: IStringDictionary<string> = {};
            if (correlationId) {
                headers[this.privRequestParams.correlationId] = correlationId;
            }
            headers[this.privRequestParams.clientAppId] = ConversationConnectionConfig.clientAppId;

            if (conversationCode !== undefined) {
                queryParams[this.privRequestParams.roomId] = conversationCode;
            } else {
                Contracts.throwIfNullOrUndefined(subscriptionRegion, this.privErrors.authInvalidSubscriptionRegion);
                headers[this.privRequestParams.subscriptionRegion] = subscriptionRegion;
                if (subscriptionKey) {
                    headers[this.privRequestParams.subscriptionKey] = subscriptionKey;
                } else if (authToken) {
                    headers[this.privRequestParams.authorization] = `Bearer ${authToken}`;
                } else {
                    Contracts.throwIfNullOrUndefined(subscriptionKey, this.privErrors.authInvalidSubscriptionKey);
                }
            }

            const config: IRequestOptions = {};
            config.headers = headers;
            this.privRestAdapter.options = config;

            const endpoint: string = `https://${endpointHost}${this.privRestPath}`;

            // TODO: support a proxy and certificate validation
            this.privRestAdapter.request(RestRequestType.Post, endpoint, queryParams, null).then((response: IRestResponse): void => {

                const requestId: string = RestMessageAdapter.extractHeaderValue(this.privRequestParams.requestId, response.headers);

                if (!response.ok) {
                    if (!!err) {
                        // get the error
                        let errorMessage: string = this.privErrors.invalidCreateJoinConversationResponse.replace("{status}", response.status.toString());
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
                            err(e as string);
                        }
                    }
                    cb = undefined;
                }
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            }).catch( (): void => { });

        } catch (error) {
            if (!!err) {
                if (error instanceof Error) {
                    const typedError: Error = error;
                    err(typedError.name + ": " + typedError.message);

                } else {
                    err(error as string);
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
    public leave(args: PropertyCollection, sessionToken: string): Promise<void> {
        return new Promise<void>((resolve: () => void, reject: (reason: string) => void): void => {
            try {

                Contracts.throwIfNullOrUndefined(args, this.privErrors.invalidArgs.replace("{arg}", "config"));
                Contracts.throwIfNullOrWhitespace(sessionToken, this.privErrors.invalidArgs.replace("{arg}", "token"));

                const endpointHost: string = args.getProperty(PropertyId.ConversationTranslator_Host, this.privHost);
                const correlationId: string = args.getProperty(PropertyId.ConversationTranslator_CorrelationId);

                const queryParams: IStringDictionary<string> = {};
                queryParams[this.privRequestParams.apiVersion] = this.privApiVersion;
                queryParams[this.privRequestParams.sessionToken] = sessionToken;

                const headers: IStringDictionary<string> = {};
                if (correlationId) {
                    headers[this.privRequestParams.correlationId] = correlationId;
                }

                const config: IRequestOptions = {};
                config.headers = headers;
                this.privRestAdapter.options = config;

                const endpoint: string = `https://${endpointHost}${this.privRestPath}`;

                // TODO: support a proxy and certificate validation
                this.privRestAdapter.request(RestRequestType.Delete, endpoint, queryParams, null).then((response: IRestResponse): void => {

                    if (!response.ok) {
                        // ignore errors on delete
                    }

                    resolve();
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                }).catch( (): void => {});

            } catch (error) {
                if (error instanceof Error) {
                    const typedError: Error = error;
                    reject(typedError.name + ": " + typedError.message);

                } else {
                    reject(error as string);
                }
            }
        });
    }
}
