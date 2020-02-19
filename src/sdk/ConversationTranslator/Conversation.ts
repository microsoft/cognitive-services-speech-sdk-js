// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { ConversationConnection, ConversationManager, IInternalConversation } from "../../common.speech/Exports";
import { IDisposable } from "../../common/Exports";
import { Contracts } from "../Contracts";
import { ProfanityOption, PropertyCollection, PropertyId, SpeechTranslationConfig } from "../Exports";
import { SpeechTranslationConfigImpl } from "../SpeechTranslationConfig";
import { IConversation } from "./IConversation";
import { IParticipant, IUser } from "./IParticipant";

export abstract class Conversation implements IConversation {

    public abstract get authorizationToken(): string;
    public abstract set authorizationToken(value: string);

    public abstract get config(): SpeechTranslationConfig;
    public abstract set config(value: SpeechTranslationConfig);

    public abstract get conversationId(): string;
    public abstract get properties(): PropertyCollection;
    public abstract get speechRecognitionLanguage(): string;

    protected constructor() { }

    public static createConversationAsync(speechConfig: SpeechTranslationConfig, cb?: () => void, err?: (e: string) => void): Conversation {
        Contracts.throwIfNullOrUndefined(speechConfig, "speechConfig");
        Contracts.throwIfNullOrUndefined(speechConfig.subscriptionKey, "SpeechServiceConnection_Key");
        Contracts.throwIfNullOrUndefined(speechConfig.region, "SpeechServiceConnection_Region");

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
export class ConversationImpl extends Conversation implements IDisposable {

    private privConfig: SpeechTranslationConfig;
    private privProperties: PropertyCollection;
    private privLanguage: string;
    private privToken: string;
    private privConnection: ConversationConnection;
    private privIsDisposed: boolean = false;
    private privRoom: IInternalConversation;
    private privManager: ConversationManager;

    // get the internal data about a conversation
    public get room(): IInternalConversation {
        return this.privRoom;
    }

    // get the wrapper for connecting to the websockets
    public get connection(): ConversationConnection {
        return this.privConnection;
    }

    // get / set the speech auth token
    public get authorizationToken(): string {
        return this.privToken;
    }
    public set authorizationToken(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "authorizationToken");
        this.privToken = value;
    }

    // get / set the config
    public get config(): SpeechTranslationConfig {
        return this.privConfig;
    }
    public set config(value: SpeechTranslationConfig) {
        this.privConfig = value;
    }

    // get the conversation Id
    public get conversationId(): string {
        return this.privRoom ? this.privRoom.roomId : "";
    }

    // get the properties
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    // get the speech language
    public get speechRecognitionLanguage(): string {
        return this.privLanguage;
    }

    public constructor(speechConfig: SpeechTranslationConfig) {
        super();
        this.privProperties = new PropertyCollection();
        this.privManager = new ConversationManager();

        // check the speech language
        const language: string = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);
        if (!language) {
            speechConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage], "en-US");
        }
        this.privLanguage = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

        // check the target language(s)
        if (speechConfig.targetLanguages.length === 0) {
            speechConfig.addTargetLanguage(this.privLanguage);
        }

        // check the profanity setting: speech and conversationTranslator should be in sync
        const profanity: string = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceResponse_ProfanityOption]);
        if (!profanity) {
           speechConfig.setProfanity(ProfanityOption.Masked);
        }

        // check the nickname: it should pass this regex: ^\w+([\s-][\w\(\)]+)*$"
        // TODO: specify the regex required. Nicknames must be unique or get the duplicate nickname error
        // TODO: check what the max length is and if a truncation is required or if the service handles it without an error
        let hostNickname: string = speechConfig.getProperty(PropertyId[PropertyId.ConversationTranslator_Name]);
        if (hostNickname === undefined || hostNickname === null || hostNickname.length <= 1 || hostNickname.length > 50) {
            hostNickname = "Host";
        }
        speechConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Name], hostNickname);

        // save the speech config for future usage
        this.privConfig = speechConfig;

        // save the config properties
        const configImpl = speechConfig as SpeechTranslationConfigImpl;
        this.privProperties = configImpl.properties.clone();

    }

    /***
     * Create a new conversation as Host
     */
    public createConversationAsync(cb?: () => void, err?: (e: string) => void): void {
        try {

            this.reset();

            this.privManager.createOrJoin(this.privProperties, undefined,
                ((room: IInternalConversation) => {

                    this.privRoom = room;

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
                }),
                ((error: any) => {
                    if (!!err) {
                        if (error instanceof Error) {
                            const typedError: Error = error as Error;
                            err(typedError.name + ": " + typedError.message);

                        } else {
                            err(error);
                        }
                    }
                }));
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
     * Starts a new conversation as host.
     * @param cb
     * @param err
     */
    public startConversationAsync(cb?: () => void, err?: (e: string) => void): void {

        try {

            // connect
            this.privConnection = new ConversationConnection(this.privConfig);
            this.privConnection.connect(this.privRoom);

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
     * Join a conversation as a participant.
     * @param conversation
     * @param nickname
     * @param lang
     * @param cb
     * @param err
     */
    public joinConversationAsync(conversationId: string, nickname: string, lang: string, cb?: (result: any) => void, err?: (e: string) => void): void {

        try {

            this.reset();

            // join the conversation
            this.privManager.createOrJoin(this.privProperties, conversationId,
                ((room: IInternalConversation) => {

                    Contracts.throwIfNullOrUndefined(room, "invalid conversation");
                    this.privRoom = room;
                    this.privConfig.authorizationToken = room.cognitiveSpeechAuthToken;

                    // join callback
                    if (!!cb) {
                        cb(room);
                    }

                }),
                ((error: any) => {
                    if (!!err) {
                        if (error instanceof Error) {
                            const typedError: Error = error as Error;
                            err(typedError.name + ": " + typedError.message);

                        } else {
                            err(error);
                        }
                    }
                }));

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

    /***
     * Deletes a conversation as host
     */
    public deleteConversationAsync(cb?: () => void, err?: (e: string) => void): void {

        try {

            this.privManager.leave(this.privProperties, this.privRoom.token, null);

            this.dispose();

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

    /***
     * Issues a request to close the client websockets
     */
    public endConversationAsync(): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.disconnect();
            }
        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to lock the conversation
     */
    public lockConversationAsync(): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.toggleLockRoom(true);
            }
        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to mute the conversation
     */
    public muteAllParticipantsAsync(): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.toggleMuteAll(true);
            }
        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to mute a participant in the conversation
     */
    public muteParticipantAsync(userId: string): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.toggleMuteParticipant(userId, true);
            }
        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to remove a participant from the conversation
     */
    public removeParticipantAsync(userId: string | IParticipant | IUser): void {

        try {
            let participantId: string = "";

            if (typeof userId === "string") {
                participantId = userId as string;
            } else if (userId.hasOwnProperty("id")) {
                const participant: IParticipant = userId as IParticipant;
                participantId = participant.id;
            } else if (userId.hasOwnProperty("userId")) {
                const user: IUser = userId as IUser;
                participantId = user.userId;
            }

            if (participantId.length > 0 && !!this.privConnection) {
                this.privConnection.ejectParticpant(participantId);
            }

        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to unlock the conversation
     */
    public unlockConversationAsync(): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.toggleLockRoom(false);
            }
        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to unmute all participants in the conversation
     */
    public unmuteAllParticipantsAsync(): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.toggleMuteAll(false);
            }
        } catch (error) {
            //
        }
    }

    /**
     * Issues a request to unmute a participant in the conversation
     */
    public unmuteParticipantAsync(userId: string): void {
        try {
            if (!!this.privConnection) {
                this.privConnection.toggleMuteParticipant(userId, false);
            }
        } catch (error) {
            //
        }
    }

    public close(): void {
        this.reset();
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        if (this.isDisposed) {
            return;
        }
        this.privIsDisposed = true;
        this.config?.close();
        if (this.privConnection) {
            this.privConnection.disconnect();
            this.privConnection = undefined;
        }
        this.config = undefined;
        this.privLanguage = undefined;
        this.privProperties = undefined;
        this.privRoom = undefined;
        this.privToken = undefined;
        this.privManager = undefined;
    }

    private reset(): void {
        this.privRoom = undefined;
        this.privToken = undefined;
    }
}
