// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { IDisposable } from "../../common/Exports";
import { AudioConfig, PropertyCollection, SessionEventArgs } from "../Exports";
import {
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    IConversationTranslator } from "./Exports";

export class ConversationTranslator implements IConversationTranslator, IDisposable {

    public constructor(audioConfig?: AudioConfig) {
        //
    }

    public get properties(): PropertyCollection {
        throw new Error("Method not implemented.");
    }

    public get speechRecognitionLanguage(): string {
        throw new Error("Method not implemented.");
    }

    public canceled: (sender: ConversationTranslator, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: ConversationTranslator, event: ConversationExpirationEventArgs) => void;
    public participantsChanged: (sender: ConversationTranslator, event: ConversationParticipantsChangedEventArgs) => void;
    public sessionStarted: (sender: ConversationTranslator, event: SessionEventArgs) => void;
    public sessionStopped: (sender: ConversationTranslator, event: SessionEventArgs) => void;
    public textMessageReceived: (sender: ConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribed: (sender: ConversationTranslator, event: ConversationTranslationEventArgs) => void;
    public transcribing: (sender: ConversationTranslator, event: ConversationTranslationEventArgs) => void;

    /**
     * Join a conversation. If this is the host, pass in the previously created Conversation object.
     * @param conversation
     * @param nickname
     * @param lang
     * @param cb
     * @param err
     */
    public joinConversationAsync(conversation: any, nickname: any, lang?: any, cb?: () => void, err?: (e: string) => void): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Leave the conversation
     * @param cb
     * @param err
     */
    public leaveConversationAsync(cb?: () => void, err?: (e: string) => void): void {

        throw new Error("Method not implemented.");
    }

    /**
     * Send a text message
     * @param message
     */
    public sendTextMessageAsync(message: string): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Start speaking
     */
    public startTranscribingAsync(): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Stop speaking
     */
    public stopTranscribingAsync(): void {
        throw new Error("Method not implemented.");
    }

    public isDisposed(): boolean {
        throw new Error("Method not implemented.");
    }

    public dispose(reason?: string): void {
        throw new Error("Method not implemented.");
    }
}
