// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

/* eslint-disable max-classes-per-file */

import {
    ConversationConnectionConfig,
    ConversationManager,
    ConversationReceivedTranslationEventArgs,
    ConversationRecognizer,
    ConversationRecognizerFactory,
    ConversationTranslatorCommandTypes,
    ConversationTranslatorMessageTypes,
    IAuthentication,
    IInternalConversation,
    IInternalParticipant,
    InternalParticipants,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs,
    TranscriberRecognizer
} from "../../common.speech/Exports.js";
import {
    IDisposable,
    IErrorMessages,
    marshalPromiseToCallbacks
} from "../../common/Exports.js";
import { Contracts } from "../Contracts.js";
import {
    ConnectionEventArgs,
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    ConversationTranslator,
    Participant,
    ParticipantChangedReason,
    ProfanityOption,
    PropertyCollection,
    PropertyId,
    SpeechTranslationConfig,
} from "../Exports.js";
import { SpeechTranslationConfigImpl } from "../SpeechTranslationConfig.js";
import { Callback, ConversationInfo, ConversationProperties, IConversation } from "./IConversation.js";
import { IParticipant, IUser, TranscriptionParticipant } from "./IParticipant.js";

export abstract class Conversation implements IConversation {

    protected constructor() {
        return;
    }

    public abstract get authorizationToken(): string;

    public abstract get config(): SpeechTranslationConfig;

    public abstract get conversationId(): string;
    public abstract get conversationInfo(): ConversationInfo;
    public abstract get properties(): PropertyCollection;
    public abstract get speechRecognitionLanguage(): string;
    public abstract get participants(): Participant[];
    public abstract set authorizationToken(value: string);
    public abstract get isConnected(): boolean;

    /**
     * Create a conversation
     * @param speechConfig
     * @param cb
     * @param err
     */
    public static createConversationAsync(speechConfig: SpeechTranslationConfig, arg2?: string | Callback, arg3?: Callback, arg4?: Callback): Conversation {
        Contracts.throwIfNullOrUndefined(speechConfig, ConversationConnectionConfig.restErrors.invalidArgs.replace("{arg}", "config"));
        Contracts.throwIfNullOrUndefined(speechConfig.region, ConversationConnectionConfig.restErrors.invalidArgs.replace("{arg}", "SpeechServiceConnection_Region"));
        if (!speechConfig.subscriptionKey && !speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceAuthorization_Token])) {
            Contracts.throwIfNullOrUndefined(speechConfig.subscriptionKey, ConversationConnectionConfig.restErrors.invalidArgs.replace("{arg}", "SpeechServiceConnection_Key"));
        }
        let conversationImpl: ConversationImpl;
        let cb: Callback;
        let err: Callback;
        if (typeof arg2 === "string") {
            conversationImpl = new ConversationImpl(speechConfig, arg2);
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            marshalPromiseToCallbacks((async (): Promise<void> => {})(), arg3, arg4);
        } else {
            conversationImpl = new ConversationImpl(speechConfig);
            cb = arg2;
            err = arg3;
            conversationImpl.createConversationAsync(
                ((): void => {
                    if (!!cb) {
                        cb();
                    }
                }),
                (error: any): void => {
                    if (!!err) {
                        err(error);
                    }
                });
        }
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

    /** Add Participant to Conversation. */
    public abstract addParticipantAsync(participant: IParticipant, cb?: Callback, err?: Callback): void;

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

export class ConversationImpl extends Conversation implements IDisposable {

    private privConfig: SpeechTranslationConfig;
    private privProperties: PropertyCollection;
    private privLanguage: string;
    private privToken: string;
    private privIsDisposed: boolean;
    private privRoom: IInternalConversation;
    private privManager: ConversationManager;
    private privConversationRecognizer: ConversationRecognizer;
    private privIsConnected: boolean;
    private privParticipants: InternalParticipants;
    private privIsReady: boolean;
    private privConversationTranslator: ConversationTranslator;
    private privTranscriberRecognizer: TranscriberRecognizer;
    private privErrors: IErrorMessages = ConversationConnectionConfig.restErrors;
    private privConversationId: string;
    private readonly privTextMessageMaxLength: number;

    /**
     * Create a conversation impl
     * @param speechConfig
     * @param {string} id - optional conversationId
     */
    public constructor(speechConfig: SpeechTranslationConfig, id?: string) {
        super();
        this.privIsConnected = false;
        this.privIsDisposed = false;
        this.privConversationId = "";
        this.privProperties = new PropertyCollection();
        this.privManager = new ConversationManager();

        // check the speech language
        const language: string = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);
        if (!language) {
            speechConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage], ConversationConnectionConfig.defaultLanguageCode);
        }
        this.privLanguage = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

        if (!id) {
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
            if (hostNickname === undefined || hostNickname === null) {
                hostNickname = "Host";
            }
            Contracts.throwIfNullOrTooLong(hostNickname, "nickname", 50);
            Contracts.throwIfNullOrTooShort(hostNickname, "nickname", 2);
            speechConfig.setProperty(PropertyId[PropertyId.ConversationTranslator_Name], hostNickname);

        } else {
            this.privConversationId = id;
        }

        // save the speech config for future usage
        this.privConfig = speechConfig;

        // save the config properties
        const configImpl = speechConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(configImpl, "speechConfig");
        this.privProperties = configImpl.properties.clone();
        this.privIsConnected = false;
        this.privParticipants = new InternalParticipants();
        this.privIsReady = false;
        this.privTextMessageMaxLength = 1000;
    }

    // get the internal data about a conversation
    public get room(): IInternalConversation {
        return this.privRoom;
    }

    // get the wrapper for connecting to the websockets
    public get connection(): ConversationRecognizer {
        return this.privConversationRecognizer; // this.privConnection;
    }

    // get the config
    public get config(): SpeechTranslationConfig {
        return this.privConfig;
    }

    // get the conversation Id
    public get conversationId(): string {
        return this.privRoom ? this.privRoom.roomId : this.privConversationId;
    }

    // get the properties
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    // get the speech language
    public get speechRecognitionLanguage(): string {
        return this.privLanguage;
    }

    public get isMutedByHost(): boolean {
        return this.privParticipants.me?.isHost ? false : this.privParticipants.me?.isMuted;
    }

    public get isConnected(): boolean {
        return this.privIsConnected && this.privIsReady;
    }

    public get participants(): Participant[] {
        return this.toParticipants(true);
    }

    public get me(): Participant {
        return this.toParticipant(this.privParticipants.me);
    }

    public get host(): Participant {
        return this.toParticipant(this.privParticipants.host);
    }

    public get transcriberRecognizer(): TranscriberRecognizer {
        return this.privTranscriberRecognizer;
    }

    public get conversationInfo(): ConversationInfo {
        const convId: string = this.conversationId;
        const p: TranscriptionParticipant[] = this.participants.map((part: Participant): TranscriptionParticipant => (
            {
                id: part.id,
                preferredLanguage: part.preferredLanguage,
                voice: part.voice
            }
        ));
        const props: ConversationProperties = {};
        for (const key of ConversationConnectionConfig.transcriptionEventKeys) {
            const val: string = this.properties.getProperty(key, "");
            if (val !== "") {
                props[key] = val;
            }
        }
        const info: ConversationInfo = { id: convId, participants: p, conversationProperties: props };
        return info;
    }

    private get canSend(): boolean {
        return this.privIsConnected && !this.privParticipants.me?.isMuted;
    }

    private get canSendAsHost(): boolean {
        return this.privIsConnected && this.privParticipants.me?.isHost;
    }

    // get / set the speech auth token
    // eslint-disable-next-line @typescript-eslint/member-ordering
    public get authorizationToken(): string {
        return this.privToken;
    }

    public set authorizationToken(value: string) {
        Contracts.throwIfNullOrWhitespace(value, "authorizationToken");
        this.privToken = value;
    }

    public set conversationTranslator(conversationTranslator: ConversationTranslator) {
        this.privConversationTranslator = conversationTranslator;
    }

    public onToken(token: IAuthentication): void {
        this.privConversationTranslator.onToken(token);
    }

    /**
     * Create a new conversation as Host
     * @param cb
     * @param err
     */
    public createConversationAsync(cb?: Callback, err?: Callback): void {
        try {
            if (!!this.privConversationRecognizer) {
                this.handleError(new Error(this.privErrors.permissionDeniedStart), err);
            }
            this.privManager.createOrJoin(this.privProperties, undefined,
                ((room: IInternalConversation): void => {
                    if (!room) {
                        this.handleError(new Error(this.privErrors.permissionDeniedConnect), err);
                    }
                    this.privRoom = room;
                    this.handleCallback(cb, err);
                }),
                ((error: any): void => {
                    this.handleError(error, err);
                }));
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Starts a new conversation as host.
     * @param cb
     * @param err
     */
    public startConversationAsync(cb?: Callback, err?: Callback): void {
        try {
            // check if there is already a recognizer
            if (!!this.privConversationRecognizer) {
                this.handleError(new Error(this.privErrors.permissionDeniedStart), err);
            }
            // check if there is conversation data available
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedConnect);
            // connect to the conversation websocket
            this.privParticipants.meId = this.privRoom.participantId;
            this.privConversationRecognizer = ConversationRecognizerFactory.fromConfig(this, this.privConfig);

            // Because ConversationTranslator manually sets up and manages the connection, Conversation
            // has to forward serviceRecognizer connection events that usually get passed automatically
            this.privConversationRecognizer.connected = this.onConnected;
            this.privConversationRecognizer.disconnected = this.onDisconnected;
            this.privConversationRecognizer.canceled = this.onCanceled;

            this.privConversationRecognizer.participantUpdateCommandReceived = this.onParticipantUpdateCommandReceived;
            this.privConversationRecognizer.lockRoomCommandReceived = this.onLockRoomCommandReceived;
            this.privConversationRecognizer.muteAllCommandReceived = this.onMuteAllCommandReceived;
            this.privConversationRecognizer.participantJoinCommandReceived = this.onParticipantJoinCommandReceived;
            this.privConversationRecognizer.participantLeaveCommandReceived = this.onParticipantLeaveCommandReceived;
            this.privConversationRecognizer.translationReceived = this.onTranslationReceived;
            this.privConversationRecognizer.participantsListReceived = this.onParticipantsListReceived;
            this.privConversationRecognizer.conversationExpiration = this.onConversationExpiration;

            this.privConversationRecognizer.connect(this.privRoom.token,
                ((): void => {
                    this.handleCallback(cb, err);
                }),
                ((error: any): void => {
                    this.handleError(error, err);
                }));
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Join a conversation as a participant.
     * @param { IParticipant } participant - participant to add
     * @param cb
     * @param err
     */
    public addParticipantAsync(participant: IParticipant, cb?: Callback, err?: Callback): void {
        Contracts.throwIfNullOrUndefined(participant, "Participant");
        marshalPromiseToCallbacks(this.addParticipantImplAsync(participant), cb, err);
    }

    /**
     * Join a conversation as a participant.
     * @param conversation
     * @param nickname
     * @param lang
     * @param cb
     * @param err
     */
    public joinConversationAsync(conversationId: string, nickname: string, lang: string, cb?: Callback, err?: Callback): void {
        try {
            // TODO
            // if (!!this.privConversationRecognizer) {
            //     throw new Error(this.privErrors.permissionDeniedStart);
            // }
            Contracts.throwIfNullOrWhitespace(conversationId, this.privErrors.invalidArgs.replace("{arg}", "conversationId"));
            Contracts.throwIfNullOrWhitespace(nickname, this.privErrors.invalidArgs.replace("{arg}", "nickname"));
            Contracts.throwIfNullOrWhitespace(lang, this.privErrors.invalidArgs.replace("{arg}", "language"));
            // join the conversation
            this.privManager.createOrJoin(this.privProperties, conversationId,
                ((room: IInternalConversation): void => {
                    Contracts.throwIfNullOrUndefined(room, this.privErrors.permissionDeniedConnect);
                    this.privRoom = room;
                    this.privConfig.authorizationToken = room.cognitiveSpeechAuthToken;
                    // join callback
                    if (!!cb) {
                        cb(room.cognitiveSpeechAuthToken);
                    }
                }),
                ((error: any): void => {
                    this.handleError(error, err);
                }));
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Deletes a conversation
     * @param cb
     * @param err
     */
    public deleteConversationAsync(cb?: Callback, err?: Callback): void {
        marshalPromiseToCallbacks(this.deleteConversationImplAsync(), cb, err);
    }

    public async deleteConversationImplAsync(): Promise<void> {
            Contracts.throwIfNullOrUndefined(this.privProperties, this.privErrors.permissionDeniedConnect);
            Contracts.throwIfNullOrWhitespace(this.privRoom.token, this.privErrors.permissionDeniedConnect);
            await this.privManager.leave(this.privProperties, this.privRoom.token);

            this.dispose();
    }

    /**
     * Issues a request to close the client websockets
     * @param cb
     * @param err
     */
    public endConversationAsync(cb?: Callback, err?: Callback): void {
        marshalPromiseToCallbacks(this.endConversationImplAsync(), cb, err);
    }

    public endConversationImplAsync(): Promise<void> {
        return this.close(true);
    }

    /**
     * Issues a request to lock the conversation
     * @param cb
     * @param err
     */
    public lockConversationAsync(cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            if (!this.canSendAsHost) {
                this.handleError(new Error(this.privErrors.permissionDeniedConversation.replace("{command}", "lock")), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getLockCommand(true),
                    ((): void => {
                        this.handleCallback(cb, err);
                    }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Issues a request to mute the conversation
     * @param cb
     * @param err
     */
    public muteAllParticipantsAsync(cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrUndefined(this.privConversationRecognizer, this.privErrors.permissionDeniedSend);
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            // check the user's permissions
            if (!this.canSendAsHost) {
                this.handleError(new Error(this.privErrors.permissionDeniedConversation.replace("{command}", "mute")), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getMuteAllCommand(true),
                    ((): void => {
                        this.handleCallback(cb, err);
                    }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Issues a request to mute a participant in the conversation
     * @param userId
     * @param cb
     * @param err
     */
    public muteParticipantAsync(userId: string, cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrWhitespace(userId, this.privErrors.invalidArgs.replace("{arg}", "userId"));
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            // check the connection is open (host + participant can perform the mute command)
            if (!this.canSend) {
                this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
            }
            // if not host, check the participant is not muting another participant
            if (!this.me.isHost && this.me.id !== userId) {
                this.handleError(new Error(this.privErrors.permissionDeniedParticipant.replace("{command}", "mute")), err);
            }
            // check the user exists
            const exists: number = this.privParticipants.getParticipantIndex(userId);
            if (exists === -1) {
                this.handleError(new Error(this.privErrors.invalidParticipantRequest), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getMuteCommand(userId, true), ((): void => {
                        this.handleCallback(cb, err);
                    }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Issues a request to remove a participant from the conversation
     * @param userId
     * @param cb
     * @param err
     */
    public removeParticipantAsync(userId: string | IParticipant | IUser, cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            if (!!this.privTranscriberRecognizer && userId.hasOwnProperty("id")) {
                // Assume this is a transcription participant
                marshalPromiseToCallbacks(this.removeParticipantImplAsync(userId as IParticipant), cb, err);
            } else {
                Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
                Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
                if (!this.canSendAsHost) {
                    this.handleError(new Error(this.privErrors.permissionDeniedParticipant.replace("{command}", "remove")), err);
                }
                let participantId = "";
                if (typeof userId === "string") {
                    participantId = userId;
                } else if (userId.hasOwnProperty("id")) {
                    const participant: IParticipant = userId as IParticipant;
                    participantId = participant.id;
                } else if (userId.hasOwnProperty("userId")) {
                    const user: IUser = userId as IUser;
                    participantId = user.userId;
                }
                Contracts.throwIfNullOrWhitespace(participantId, this.privErrors.invalidArgs.replace("{arg}", "userId"));
                // check the participant exists
                const index: number = this.participants.findIndex((p: Participant): boolean => p.id === participantId);
                if (index === -1) {
                    this.handleError(new Error(this.privErrors.invalidParticipantRequest), err);
                }
                if (!!this.privConversationRecognizer) {
                    this.privConversationRecognizer.sendRequest(this.getEjectCommand(participantId), ((): void => {
                        this.handleCallback(cb, err);
                    }),
                        ((error: any): void => {
                            this.handleError(error, err);
                        }));
                }
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Issues a request to unlock the conversation
     * @param cb
     * @param err
     */
    public unlockConversationAsync(cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            if (!this.canSendAsHost) {
                this.handleError(new Error(this.privErrors.permissionDeniedConversation.replace("{command}", "unlock")), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getLockCommand(false), ((): void => {
                    this.handleCallback(cb, err);
                }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
                }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Issues a request to unmute all participants in the conversation
     * @param cb
     * @param err
     */
    public unmuteAllParticipantsAsync(cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            if (!this.canSendAsHost) {
                this.handleError(new Error(this.privErrors.permissionDeniedConversation.replace("{command}", "unmute all")), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getMuteAllCommand(false), ((): void => {
                    this.handleCallback(cb, err);
                }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Issues a request to unmute a participant in the conversation
     * @param userId
     * @param cb
     * @param err
     */
    public unmuteParticipantAsync(userId: string, cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrWhitespace(userId, this.privErrors.invalidArgs.replace("{arg}", "userId"));
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            // check the connection is open (host + participant can perform the mute command)
            if (!this.canSend) {
                this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
            }
            // if not host, check the participant is not muting another participant
            if (!this.me.isHost && this.me.id !== userId) {
                this.handleError(new Error(this.privErrors.permissionDeniedParticipant.replace("{command}", "mute")), err);
            }
            // check the user exists
            const exists: number = this.privParticipants.getParticipantIndex(userId);
            if (exists === -1) {
                this.handleError(new Error(this.privErrors.invalidParticipantRequest), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getMuteCommand(userId, false), ((): void => {
                    this.handleCallback(cb, err);
                }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Send a text message
     * @param message
     * @param cb
     * @param err
     */
    public sendTextMessageAsync(message: string, cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrWhitespace(message, this.privErrors.invalidArgs.replace("{arg}", "message"));
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            if (!this.canSend) {
                this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
            }
            // TODO: is a max length check required?
            if (message.length > this.privTextMessageMaxLength) {
                this.handleError(new Error(this.privErrors.invalidArgs.replace("{arg}", "message length")), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getMessageCommand(message), ((): void => {
                    this.handleCallback(cb, err);
                }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Set translated to languages
     * @param {string[]} languages - languages to translate to
     * @param cb
     * @param err
     */
    public setTranslatedLanguagesAsync(languages: string[], cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfArrayEmptyOrWhitespace(languages, this.privErrors.invalidArgs.replace("{arg}", "languages"));
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            if (!this.canSend) {
                this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getSetTranslateToLanguagesCommand(languages),
                    ((): void => {
                        this.handleCallback(cb, err);
                    }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    /**
     * Change nickname
     * @param {string} nickname - new nickname for the room
     * @param cb
     * @param err
     */
    public changeNicknameAsync(nickname: string, cb?: Callback, err?: Callback): void {
        try {
            Contracts.throwIfDisposed(this.privIsDisposed);
            Contracts.throwIfDisposed(this.privConversationRecognizer.isDisposed());
            Contracts.throwIfNullOrWhitespace(nickname, this.privErrors.invalidArgs.replace("{arg}", "nickname"));
            Contracts.throwIfNullOrUndefined(this.privRoom, this.privErrors.permissionDeniedSend);
            if (!this.canSend) {
                this.handleError(new Error(this.privErrors.permissionDeniedSend), err);
            }
            if (!!this.privConversationRecognizer) {
                this.privConversationRecognizer.sendRequest(this.getChangeNicknameCommand(nickname),
                    ((): void => {
                        this.handleCallback(cb, err);
                    }),
                    ((error: any): void => {
                        this.handleError(error, err);
                    }));
            }
        } catch (error) {
            this.handleError(error, err);
        }
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(): void {
        if (this.isDisposed) {
            return;
        }
        this.privIsDisposed = true;
        if (!!this.config) {
            this.config.close();
        }
        this.privConfig = undefined;
        this.privLanguage = undefined;
        this.privProperties = undefined;
        this.privRoom = undefined;
        this.privToken = undefined;
        this.privManager = undefined;
        this.privIsConnected = false;
        this.privIsReady = false;
        this.privParticipants = undefined;
    }

    public async connectTranscriberRecognizer(recognizer: TranscriberRecognizer): Promise<void> {
        if (!!this.privTranscriberRecognizer) {
            await this.privTranscriberRecognizer.close();
        }
        await recognizer.enforceAudioGating();
        this.privTranscriberRecognizer = recognizer;
        this.privTranscriberRecognizer.conversation = this;
    }

    public getKeepAlive(): string {
        const nickname: string = (!!this.me) ? this.me.displayName : "default_nickname";
        return JSON.stringify({
            id: "0",
            nickname,
            participantId: this.privRoom.participantId,
            roomId: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.keepAlive
        });
    }

    /** websocket callbacks */
    /* eslint-disable @typescript-eslint/typedef */
    private onConnected = (e: ConnectionEventArgs): void => {
        this.privIsConnected = true;
        try {
            if (!!this.privConversationTranslator?.sessionStarted) {
                this.privConversationTranslator.sessionStarted(this.privConversationTranslator, e);
            }
        } catch (e) {
            //
        }
    };

    private onDisconnected = (e: ConnectionEventArgs): void => {
        try {
            if (!!this.privConversationTranslator?.sessionStopped) {
                this.privConversationTranslator.sessionStopped(this.privConversationTranslator, e);
            }
        } catch (e) {
            //
        } finally {
            void this.close(false);
        }
    };

    private onCanceled = (r: ConversationRecognizer, e: ConversationTranslationCanceledEventArgs): void => {
        try {
            if (!!this.privConversationTranslator?.canceled) {
                this.privConversationTranslator.canceled(this.privConversationTranslator, e);
            }
        } catch (e) {
            //
        }
    };

    private onParticipantUpdateCommandReceived = (r: ConversationRecognizer, e: ParticipantAttributeEventArgs): void => {
        try {
            const updatedParticipant: IInternalParticipant = this.privParticipants.getParticipant(e.id);
            if (updatedParticipant !== undefined) {

                switch (e.key) {
                    case ConversationTranslatorCommandTypes.changeNickname:
                        updatedParticipant.displayName = e.value as string;
                        break;
                    case ConversationTranslatorCommandTypes.setUseTTS:
                        updatedParticipant.isUsingTts = e.value as boolean;
                        break;
                    case ConversationTranslatorCommandTypes.setProfanityFiltering:
                        updatedParticipant.profanity = e.value as boolean;
                        break;
                    case ConversationTranslatorCommandTypes.setMute:
                        updatedParticipant.isMuted = e.value as boolean;
                        break;
                    case ConversationTranslatorCommandTypes.setTranslateToLanguages:
                        updatedParticipant.translateToLanguages = e.value as string[];
                        break;
                }
                this.privParticipants.addOrUpdateParticipant(updatedParticipant);

                if (!!this.privConversationTranslator) {
                    this.privConversationTranslator.participantsChanged(
                        this.privConversationTranslator,
                        new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.Updated,
                            [this.toParticipant(updatedParticipant)], e.sessionId));
                }
            }
        } catch (e) {
            //
        }
    };

    private onLockRoomCommandReceived = (): void => {
        // TODO
    };

    private onMuteAllCommandReceived = (r: ConversationRecognizer, e: MuteAllEventArgs): void => {
        try {
            this.privParticipants.participants.forEach((p: IInternalParticipant): boolean => p.isMuted = (p.isHost ? false : e.isMuted));
            if (!!this.privConversationTranslator) {
                this.privConversationTranslator.participantsChanged(
                    this.privConversationTranslator,
                    new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.Updated,
                        this.toParticipants(false), e.sessionId));
            }
        } catch (e) {
            //
        }
    };

    private onParticipantJoinCommandReceived = (r: ConversationRecognizer, e: ParticipantEventArgs): void => {
        try {
            const newParticipant: IInternalParticipant = this.privParticipants.addOrUpdateParticipant(e.participant);
            if (newParticipant !== undefined) {
                if (!!this.privConversationTranslator) {
                    this.privConversationTranslator.participantsChanged(
                        this.privConversationTranslator,
                        new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.JoinedConversation,
                            [this.toParticipant(newParticipant)], e.sessionId));
                }
            }
        } catch (e) {
            //
        }
    };

    private onParticipantLeaveCommandReceived = (r: ConversationRecognizer, e: ParticipantEventArgs): void => {
        try {
            const ejectedParticipant: IInternalParticipant = this.privParticipants.getParticipant(e.participant.id);
            if (ejectedParticipant !== undefined) {
                // remove the participant from the internal participants list
                this.privParticipants.deleteParticipant(e.participant.id);
                if (!!this.privConversationTranslator) {
                    // notify subscribers that the participant has left the conversation
                    this.privConversationTranslator.participantsChanged(
                        this.privConversationTranslator,
                        new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.LeftConversation,
                            [this.toParticipant(ejectedParticipant)], e.sessionId));
                }
            }
        } catch (e) {
            //
        }
    };

    private onTranslationReceived = (r: ConversationRecognizer, e: ConversationReceivedTranslationEventArgs): void => {
        try {
            switch (e.command) {
                case ConversationTranslatorMessageTypes.final:
                    if (!!this.privConversationTranslator) {
                        this.privConversationTranslator.transcribed(
                            this.privConversationTranslator,
                            new ConversationTranslationEventArgs(e.payload, undefined, e.sessionId));
                    }
                    break;
                case ConversationTranslatorMessageTypes.partial:
                    if (!!this.privConversationTranslator) {
                        this.privConversationTranslator.transcribing(
                            this.privConversationTranslator,
                            new ConversationTranslationEventArgs(e.payload, undefined, e.sessionId));
                    }
                    break;
                case ConversationTranslatorMessageTypes.instantMessage:
                    if (!!this.privConversationTranslator) {
                        this.privConversationTranslator.textMessageReceived(
                            this.privConversationTranslator,
                            new ConversationTranslationEventArgs(e.payload, undefined, e.sessionId));
                    }
                    break;
            }
        } catch (e) {
            //
        }
    };

    private onParticipantsListReceived = (r: ConversationRecognizer, e: ParticipantsListEventArgs): void => {
        try {
            // check if the session token needs to be updated
            if (e.sessionToken !== undefined && e.sessionToken !== null) {
                this.privRoom.token = e.sessionToken;
            }
            // save the participants
            this.privParticipants.participants = [...e.participants];
            // enable the conversation
            if (this.privParticipants.me !== undefined) {
                this.privIsReady = true;
            }
            if (!!this.privConversationTranslator) {
                this.privConversationTranslator.participantsChanged(
                    this.privConversationTranslator,
                    new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.JoinedConversation, this.toParticipants(true), e.sessionId));
            }
            // if this is the host, update the nickname if needed
            if (this.me.isHost) {
                const nickname: string = this.privConversationTranslator?.properties.getProperty(PropertyId.ConversationTranslator_Name);
                if (nickname !== undefined && nickname.length > 0 && nickname !== this.me.displayName) {
                    // issue a change nickname request
                    this.changeNicknameAsync(nickname);
                }
            }
        } catch (e) {
            //
        }
    };

    private onConversationExpiration = (r: ConversationRecognizer, e: ConversationExpirationEventArgs): void => {
        try {
            if (!!this.privConversationTranslator) {
                this.privConversationTranslator.conversationExpiration(this.privConversationTranslator, e);
            }
        } catch (e) {
            //
        }
    };
    /* eslint-enable @typescript-eslint/typedef */

    private addParticipantImplAsync(participant: IParticipant): Promise<void> {
        const newParticipant: IInternalParticipant = this.privParticipants.addOrUpdateParticipant(participant);
        if (newParticipant !== undefined) {
            if (!!this.privTranscriberRecognizer) {
                const conversationInfo = this.conversationInfo;
                conversationInfo.participants = [participant];
                return this.privTranscriberRecognizer.pushConversationEvent(conversationInfo, "join");
            }
        }
    }

    private removeParticipantImplAsync(participant: IParticipant): Promise<void> {
        this.privParticipants.deleteParticipant(participant.id);
        const conversationInfo = this.conversationInfo;
        conversationInfo.participants = [participant];
        return this.privTranscriberRecognizer.pushConversationEvent(conversationInfo, "leave");
    }

    private async close(dispose: boolean): Promise<void> {
        try {
            this.privIsConnected = false;
            await this.privConversationRecognizer?.close();
            this.privConversationRecognizer = undefined;
            if (!!this.privConversationTranslator) {
                this.privConversationTranslator.dispose();
            }
        } catch (e) {
            // ignore error
            throw e;
        }
        if (dispose) {
            this.dispose();
        }
    }

    /** Helpers */
    private handleCallback(cb: () => void, err: (message: string) => void): void {
        if (!!cb) {
            try {
                cb();
            } catch (e) {
                if (!!err) {
                    err(e as string);
                }
            }
            cb = undefined;
        }
    }

    private handleError(error: any, err: (message: string) => void): void {
        if (!!err) {
            if (error instanceof Error) {
                const typedError: Error = error;
                err(typedError.name + ": " + typedError.message);

            } else {
                err(error as string);
            }
        }
    }

    /** Participant Helpers */
    private toParticipants(includeHost: boolean): Participant[] {

        const participants: Participant[] = this.privParticipants.participants.map((p: IInternalParticipant): Participant => ( this.toParticipant(p) ) );
        if (!includeHost) {
            return participants.filter((p: Participant): boolean => p.isHost === false);
        } else {
            return participants;
        }
    }

    private toParticipant(p: IInternalParticipant): Participant {
        return new Participant(p.id, p.avatar, p.displayName, p.isHost, p.isMuted, p.isUsingTts, p.preferredLanguage, p.voice);
    }

    private getMuteAllCommand(isMuted: boolean): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");

        return JSON.stringify({
            command: ConversationTranslatorCommandTypes.setMuteAll,
            participantId: this.privRoom.participantId, // the id of the host
            roomid: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: isMuted
        });
    }

    private getMuteCommand(participantId: string, isMuted: boolean): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");

        return JSON.stringify({
            command: ConversationTranslatorCommandTypes.setMute,
            // eslint-disable-next-line object-shorthand
            participantId: participantId,
            roomid: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: isMuted
        });
    }

    private getLockCommand(isLocked: boolean): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");

        return JSON.stringify({
            command: ConversationTranslatorCommandTypes.setLockState,
            participantId: this.privRoom.participantId,
            roomid: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: isLocked
        });
    }

    private getEjectCommand(participantId: string): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(participantId, "participantId");

        return JSON.stringify({
            command: ConversationTranslatorCommandTypes.ejectParticipant,
            // eslint-disable-next-line object-shorthand
            participantId: participantId,
            roomid: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.participantCommand,
        });
    }

    private getSetTranslateToLanguagesCommand(languages: string[]): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");

        return JSON.stringify({
            command: ConversationTranslatorCommandTypes.setTranslateToLanguages,
            participantId: this.privRoom.participantId, // the id of the host
            roomid: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: languages
        });
    }

    private getChangeNicknameCommand(nickname: string): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(nickname, "nickname");
        Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");

        return JSON.stringify({
            command: ConversationTranslatorCommandTypes.changeNickname,
            nickname,
            participantId: this.privRoom.participantId, // the id of the host
            roomid: this.privRoom.roomId,
            type: ConversationTranslatorMessageTypes.participantCommand,
            value: nickname
        });
    }

    private getMessageCommand(message: string): string {
        Contracts.throwIfNullOrWhitespace(this.privRoom.roomId, "conversationId");
        Contracts.throwIfNullOrWhitespace(this.privRoom.participantId, "participantId");
        Contracts.throwIfNullOrWhitespace(message, "message");

        return JSON.stringify({
            participantId: this.privRoom.participantId,
            roomId: this.privRoom.roomId,
            text: message,
            type: ConversationTranslatorMessageTypes.instantMessage
        });
    }

}
