// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { IDisposable } from "../../common/Exports";
import { Contracts } from "../Contracts";
import { PropertyCollection, SpeechTranslationConfig } from "../Exports";
import { IConversation, IParticipant, IUser } from "./Exports";

export abstract class Conversation implements IConversation {

    public abstract get authorizationToken(): string;
    public abstract set authorizationToken(value: string);

    public abstract get config(): SpeechTranslationConfig;
    public abstract set config(value: SpeechTranslationConfig);

    public abstract get conversationId(): string;
    public abstract get properties(): PropertyCollection;
    public abstract get speechRecognitionLanguage(): string;

    protected constructor() { }

    public static createConversationAsync(speechConfig: SpeechTranslationConfig): Conversation {
        Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        Contracts.throwIfNullOrUndefined(speechConfig.subscriptionKey, "SpeechServiceConnection_Key");
        Contracts.throwIfNullOrUndefined(speechConfig.region, "SpeechServiceConnection_Region");

        const conversationImpl: ConversationImpl = new ConversationImpl(speechConfig);
        return conversationImpl;
    }

    /** Start a conversation. */
    public abstract startConversationAsync(cb?: () => void, err?: (e: string) => void): void;

    /** Delete a conversation. After this no one will be able to join the conversation. */
    public abstract deleteConversationAsync(cb?: () => void, err?: (e: string) => void): void;

    /** End a conversation. */
    public abstract endConversationAsync(): void;

    /** Lock a conversation. This will prevent new participants from joining. */
    public abstract lockConversationAsync(): void;

    /**
     * Mute all other participants in the conversation. After this no other participants will
     * have their speech recognitions broadcast, nor be able to send text messages.
     */
    public abstract muteAllParticipantsAsync(): void;

    /**
     * Mute a participant.
     * @param userId A user identifier
     */
    public abstract muteParticipantAsync(userId: string): void;

    /**
     * Remove a participant from a conversation using the user id, Participant or User object
     * @param userId A user identifier
     */
    public abstract removeParticipantAsync(userId: string | IParticipant | IUser): void;

    /** Unlocks a conversation. */
    public abstract unlockConversationAsync(): void;

    /** Unmute all other participants in the conversation. */
    public abstract unmuteAllParticipantsAsync(): void;

    /**
     * Unmute a participant.
     * @param userId A user identifier
     */
    public abstract unmuteParticipantAsync(userId: string): void;
}

// tslint:disable-next-line: max-classes-per-file
export class ConversationImpl extends Conversation implements IConversation, IDisposable {

    public get authorizationToken(): string {
        throw new Error("Method not implemented.");
    }

    public set authorizationToken(value: string) {
        throw new Error("Method not implemented.");
    }

    public get config(): SpeechTranslationConfig {
        throw new Error("Method not implemented.");
    }
    public set config(value: SpeechTranslationConfig) {
        throw new Error("Method not implemented.");
    }
    public get conversationId(): string {
        throw new Error("Method not implemented.");
    }

    public get properties(): PropertyCollection {
        throw new Error("Method not implemented.");
    }
    public get speechRecognitionLanguage(): string {
        throw new Error("Method not implemented.");
    }

    public constructor(speechConfig: SpeechTranslationConfig) {
        super();
        throw new Error("Method not implemented.");
    }

    public startConversationAsync(cb?: () => void, err?: (e: string) => void): void {

        throw new Error("Method not implemented.");
    }

    public deleteConversationAsync(cb?: () => void, err?: (e: string) => void): void {

        throw new Error("Method not implemented.");
    }

    public endConversationAsync(): void {
        throw new Error("Method not implemented.");
    }

    public lockConversationAsync(): void {
        throw new Error("Method not implemented.");
    }

    public muteAllParticipantsAsync(): void {
        throw new Error("Method not implemented.");
    }

    public muteParticipantAsync(userId: string): void {
        throw new Error("Method not implemented.");
    }

    public removeParticipantAsync(userId: string | IParticipant | IUser): void {

        throw new Error("Method not implemented.");
    }

    public unlockConversationAsync(): void {
        throw new Error("Method not implemented.");
    }

    public unmuteAllParticipantsAsync(): void {
        throw new Error("Method not implemented.");
    }

    public unmuteParticipantAsync(userId: string): void {
        throw new Error("Method not implemented.");
    }

    public isDisposed(): boolean {
        throw new Error("Method not implemented.");
    }

    public dispose(reason?: string): void {
        throw new Error("Method not implemented.");
    }

}
