// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { ConversationImpl, ConversationTranslatorConfig} from "../../common.speech/Exports";
import { Contracts } from "../Contracts";
import { PropertyCollection, PropertyId, SpeechTranslationConfig} from "../Exports";
import { Callback, IConversation } from "./IConversation";
import { IParticipant, IUser } from "./IParticipant";

export abstract class Conversation implements IConversation {

    public abstract get authorizationToken(): string;
    public abstract set authorizationToken(value: string);

    public abstract get config(): SpeechTranslationConfig;

    public abstract get conversationId(): string;
    public abstract get properties(): PropertyCollection;
    public abstract get speechRecognitionLanguage(): string;

    protected constructor() { }

    /**
     * Create a conversation
     * @param speechConfig
     * @param cb
     * @param err
     */
    public static createConversationAsync(speechConfig: SpeechTranslationConfig, cb?: Callback, err?: Callback): Conversation {
        Contracts.throwIfNullOrUndefined(speechConfig, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "config"));
        Contracts.throwIfNullOrUndefined(speechConfig.region, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "SpeechServiceConnection_Region"));
        if (!speechConfig.subscriptionKey && !speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceAuthorization_Token])) {
            Contracts.throwIfNullOrUndefined(speechConfig.subscriptionKey, ConversationTranslatorConfig.strings.invalidArgs.replace("{arg}", "SpeechServiceConnection_Key"));
        }
        const conversationImpl: ConversationImpl = new ConversationImpl(speechConfig);

        conversationImpl.createConversationAsync(
            (() => {
                if (!!cb) {
                    cb();
                }
            }),
            (error: any) => {
                if (!!err) {
                    err(error);
                }
            });

        return conversationImpl;
    }

    /** Start a conversation. */
    public abstract startConversationAsync(cb?: Callback, err?: Callback): void;

    /** Delete a conversation. After this no one will be able to join the conversation. */
    public abstract deleteConversationAsync(cb?: Callback, err?: Callback): void;

    /** End a conversation. */
    public abstract endConversationAsync(cb?: Callback, err?: Callback): void;

    /** Lock a conversation. This will prevent new participants from joining. */
    public abstract lockConversationAsync(cb?: Callback, err?: Callback): void;

    /**
     * Mute all other participants in the conversation. After this no other participants will
     * have their speech recognitions broadcast, nor be able to send text messages.
     */
    public abstract muteAllParticipantsAsync(cb?: Callback, err?: Callback): void;

    /**
     * Mute a participant.
     * @param userId A user identifier
     */
    public abstract muteParticipantAsync(userId: string, cb?: Callback, err?: Callback): void;

    /**
     * Remove a participant from a conversation using the user id, Participant or User object
     * @param userId A user identifier
     */
    public abstract removeParticipantAsync(userId: string | IParticipant | IUser, cb?: Callback, err?: Callback): void;

    /** Unlocks a conversation. */
    public abstract unlockConversationAsync(cb?: Callback, err?: Callback): void;

    /** Unmute all other participants in the conversation. */
    public abstract unmuteAllParticipantsAsync(cb?: Callback, err?: Callback): void;

    /**
     * Unmute a participant.
     * @param userId A user identifier
     */
    public abstract unmuteParticipantAsync(userId: string, cb?: Callback, err?: Callback): void;
}
