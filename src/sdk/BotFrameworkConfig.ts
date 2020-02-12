// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Contracts } from "./Contracts";
import { DialogServiceConfigImpl } from "./DialogServiceConfig";
import { PropertyId } from "./Exports";

/**
 * Class that defines configurations for the dialog service connector object for using a Bot Framework backend.
 * @class BotFrameworkConfig
 */
export class BotFrameworkConfig extends DialogServiceConfigImpl {

    /**
     * Creates an instance of BotFrameworkConfig.
     */
    public constructor() {
        super();
    }

    /**
     * Creates an instance of the bot framework config with the specified subscription and region.
     * @member BotFrameworkConfig.fromSubscription
     * @function
     * @public
     * @param subscription Subscription key associated with the bot
     * @param region The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {BotFrameworkConfig} A new bot framework config.
     */
    public static fromSubscription(subscription: string, region: string, botId?: string): BotFrameworkConfig {
        Contracts.throwIfNullOrWhitespace(subscription, "subscription");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const botFrameworkConfig: BotFrameworkConfig = new DialogServiceConfigImpl();
        botFrameworkConfig.setProperty(PropertyId.Conversation_DialogType, "bot_framework");
        botFrameworkConfig.setProperty(PropertyId.SpeechServiceConnection_Key, subscription);
        botFrameworkConfig.setProperty(PropertyId.SpeechServiceConnection_Region, region);

        if (botId) {
            botFrameworkConfig.setProperty(PropertyId.Conversation_ApplicationId, botId);
        }

        return botFrameworkConfig;
    }

    /**
     * Creates an instance of the bot framework config with the specified authorization token and region.
     * Note: The caller needs to ensure that the authorization token is valid. Before the authorization token
     * expires, the caller needs to refresh it by calling this setter with a new valid token.
     * As configuration values are copied when creating a new recognizer, the new token value will not apply to recognizers that have already been created.
     * For recognizers that have been created before, you need to set authorization token of the corresponding recognizer
     * to refresh the token. Otherwise, the recognizers will encounter errors during recognition.
     * @member BotFrameworkConfig.fromAuthorizationToken
     * @function
     * @public
     * @param authorizationToken The authorization token associated with the bot
     * @param region The region name (see the <a href="https://aka.ms/csspeech/region">region page</a>).
     * @returns {BotFrameworkConfig} A new bot framework config.
     */
    public static fromAuthorizationToken(authorizationToken: string, region: string): BotFrameworkConfig {
        Contracts.throwIfNullOrWhitespace(authorizationToken, "authorizationToken");
        Contracts.throwIfNullOrWhitespace(region, "region");

        const botFrameworkConfig: BotFrameworkConfig = new DialogServiceConfigImpl();
        botFrameworkConfig.setProperty(PropertyId.Conversation_DialogType, "bot_framework");
        botFrameworkConfig.setProperty(PropertyId.SpeechServiceAuthorization_Token, authorizationToken);
        botFrameworkConfig.setProperty(PropertyId.SpeechServiceConnection_Region, region);
        return botFrameworkConfig;
    }
}
