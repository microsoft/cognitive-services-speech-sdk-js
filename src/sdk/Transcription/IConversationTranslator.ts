// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { PropertyCollection, SessionEventArgs } from "../Exports";
import {
  ConversationExpirationEventArgs,
  ConversationParticipantsChangedEventArgs,
  ConversationTranslationCanceledEventArgs,
  ConversationTranslationEventArgs } from "./Exports";
import { Callback, IConversation } from "./IConversation";

/**
 * A conversation translator that enables a connected experience where participants can use their
 * own devices to see everyone else's recognitions and IMs in their own languages. Participants
 * can also speak and send IMs to others.
 */
export interface IConversationTranslator {

    /** Gets the collection of properties and their values defined for this instance. */
    readonly properties: PropertyCollection;

    /** Gets the language name that is used for recognition. */
    readonly speechRecognitionLanguage: string;

    /**
     * Event that signals an error with the conversation transcription, or the end of the audio stream has been reached.
     */
    canceled: (sender: IConversationTranslator, event: ConversationTranslationCanceledEventArgs) => void;

    /**
     * Event that signals how many more minutes are left before the conversation expires.
     */
    conversationExpiration: (sender: IConversationTranslator, event: ConversationExpirationEventArgs) => void;

    /**
     * Event that signals participants in the conversation have changed (e.g. a new participant joined).
     */
    participantsChanged: (sender: IConversationTranslator, event: ConversationParticipantsChangedEventArgs) => void;

    /**
     * Defines event handler for session started events.
     */
    sessionStarted: (sender: IConversationTranslator, event: SessionEventArgs) => void;

    /**
     * Defines event handler for session stopped events.
     */
    sessionStopped: (sender: IConversationTranslator, event: SessionEventArgs) => void;

    /**
     * Event that signals a translated text message from a conversation participant.
     */
    textMessageReceived: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;

     /**
      * The event recognized signals that a final  conversation translation result is received.
      */
    transcribed: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;

     /**
      * The event recognizing signals that an intermediate conversation translation result is received.
      */
    transcribing: (sender: IConversationTranslator, event: ConversationTranslationEventArgs) => void;

    /**
     * Joins an existing conversation. You should use this method if you have created a conversation using
     * from an IConversation.
     * @param conversation The conversation to join.
     * @param nickname The display name to use for the current participant.
     */
    /** Start a conversation. */
    joinConversationAsync(conversation: IConversation, nickname: string, cb?: Callback, err?: Callback): void;

    /**
     * Joins an existing conversation.
     * @param conversationId The unique identifier for the conversation to join.
     * @param nickname The display name to use for the current participant.
     * @param lang The speech language to use for the current participant.
     */
    joinConversationAsync(conversationId: string, nickname: string, lang: string, cb?: Callback, err?: Callback): void;

    /**
     * Leave the current conversation. After this is called, you will no longer receive any events.
     */
    leaveConversationAsync(cb?: Callback, err?: Callback): void;

    /**
     * Sends an instant message to all participants in the conversation. This instant message
     * will be translated into each participant's text language.
     * @param message
     */
    sendTextMessageAsync(message: string, cb?: Callback, err?: Callback): void;

    /**
     * Starts sending audio to the conversation service for speech recognition and translation. You
     * should subscribe to the Transcribing, and Transcribed events to receive conversation
     * translation results for yourself, and other participants in the conversation.
     */
    startTranscribingAsync(cb?: Callback, err?: Callback): void;

    /**
     * Stops sending audio to the conversation service. You will still receive Transcribing, and
     * and Transcribed events for other participants in the conversation.
     */
    stopTranscribingAsync(cb?: Callback, err?: Callback): void;

}
