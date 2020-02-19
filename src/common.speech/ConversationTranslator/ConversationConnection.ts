import { IDisposable } from "../../common/Exports";
import {
    ConversationExpirationEventArgs,
    ConversationParticipantsChangedEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationEventArgs,
    Participant,
    ParticipantChangedReason } from "../../sdk/ConversationTranslator/Exports";
import {
    Connection,
    ConnectionEventArgs,
    PropertyId,
    SessionEventArgs,
    SpeechTranslationConfig} from "../../sdk/Exports";
import {
    ConversationReceivedTranslationEventArgs,
    LockRoomEventArgs,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs } from "./ConversationTranslatorEventArgs";
import {
    ConversationTranslatorCommandTypes,
    ConversationTranslatorMessageTypes,
    IConversationConnection,
    IInternalConversation,
    IInternalParticipant,
    InternalParticipants} from "./ConversationTranslatorInterfaces";
import { ConversationTranslatorRecognizer } from "./ConversationTranslatorRecognizer";

/**
 * Conversation client.
 */
// tslint:disable-next-line: max-classes-per-file
export class ConversationConnection implements IConversationConnection, IDisposable {

    /** websocket for outgoing commands and text messages and incoming messages */
    private privConversationRecognizer: ConversationTranslatorRecognizer;
    private privRecoConnection: Connection;
    private privIsConnected: boolean = false;
    private privParticipants: InternalParticipants;
    private privRoom: IInternalConversation;
    private privIsDisposed: boolean = false;
    private privSpeechTranslationConfig: SpeechTranslationConfig;
    private privIsConversationConnected: boolean;
    private privIsReady: boolean;
    private privIsExiting: boolean;

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

    public constructor(speechConfig: SpeechTranslationConfig) {

        // clear the temp subscription key if it's a participant joining
        if (speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key]) === "abcdefghijklmnopqrstuvwxyz012345") {
            speechConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Key], "");
        }

        this.privSpeechTranslationConfig = speechConfig;
        this.privIsConversationConnected = false;
        this.privParticipants = new InternalParticipants();
        this.privIsReady = false;
        this.privIsExiting = false;
    }

    public canceled: (sender: ConversationConnection, event: ConversationTranslationCanceledEventArgs) => void;
    public conversationExpiration: (sender: ConversationConnection, event: ConversationExpirationEventArgs) => void;
    public participantsChanged: (sender: ConversationConnection, event: ConversationParticipantsChangedEventArgs) => void;
    public sessionStarted: (sender: ConversationConnection, event: SessionEventArgs) => void;
    public sessionStopped: (sender: ConversationConnection, event: SessionEventArgs) => void;
    public textMessageReceived: (sender: ConversationConnection, event: ConversationTranslationEventArgs) => void;
    public transcribed: (sender: ConversationConnection, event: ConversationTranslationEventArgs) => void;
    public transcribing: (sender: ConversationConnection, event: ConversationTranslationEventArgs) => void;

    public connect(room: IInternalConversation): void {

        try {

            this.privRoom = room;
            this.privParticipants.meId = room.participantId;

            if (!!this.privConversationRecognizer) {
                // close the existing recognizer
                this.privConversationRecognizer.disconnect();
                this.privConversationRecognizer = undefined;
            }

            this.privConversationRecognizer = new ConversationTranslatorRecognizer(this.privSpeechTranslationConfig, undefined);

            this.privRecoConnection = Connection.fromRecognizer(this.privConversationRecognizer);

            this.privRecoConnection.connected = (e: ConnectionEventArgs) => {
                // tslint:disable-next-line: no-console
                // console.log("connection connected", e);
                this.privIsConnected = true;
            };
            this.privRecoConnection.disconnected = (e: ConnectionEventArgs) => {
                // tslint:disable-next-line: no-console
                // console.log("connection disconnected", e);
                this.privIsConnected = false;
                if (this.privIsExiting) {
                    this.cancel();
                }
            };

            this.privConversationRecognizer.connectionOpened = ((r: ConversationTranslatorRecognizer, e: SessionEventArgs) => {

                this.privIsConnected = true;

                try {
                    if (!!this.sessionStarted) {
                        this.sessionStarted(this, e);
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.connectionClosed = ((r: ConversationTranslatorRecognizer, e: SessionEventArgs) => {

                this.privIsConnected = false;

                try {
                    if (!!this.sessionStopped) {
                        this.sessionStopped(this, e);
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.canceled = ((r: ConversationTranslatorRecognizer, e: ConversationTranslationCanceledEventArgs) => {

                try {
                    if (!!this.canceled) {
                        this.canceled(this, e);
                    }

                    // if (!!this.sessionStopped) {
                    //     this.sessionStopped(this, e);
                    // }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.participantUpdateCommandReceived = ((r: ConversationTranslatorRecognizer, e: ParticipantAttributeEventArgs) => {
                try {
                    const updatedParticipant: any = this.privParticipants.getParticipant(e.id);
                    if (updatedParticipant !== undefined) {

                        switch (e.key) {
                            case ConversationTranslatorCommandTypes.changeNickname:
                                updatedParticipant.displayName = e.value;
                                break;
                            case ConversationTranslatorCommandTypes.setUseTTS:
                                updatedParticipant.useTts = e.value;
                                break;
                            case ConversationTranslatorCommandTypes.setProfanityFiltering:
                                updatedParticipant.profanity = e.value;
                                break;
                            case ConversationTranslatorCommandTypes.setMute:
                                updatedParticipant.isMuted = e.value;
                                break;
                            case ConversationTranslatorCommandTypes.setTranslateToLanguages:
                                updatedParticipant.translateToLanguages = e.value;
                                break;
                        }
                        this.privParticipants.addOrUpdateParticipant(updatedParticipant);

                        if (!!this.participantsChanged) {
                            this.participantsChanged(this, new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.Updated,
                                [this.toParticipant(updatedParticipant)], e.sessionId));
                        }

                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.lockRoomCommandReceived = ((r: ConversationTranslatorRecognizer, e: LockRoomEventArgs) => {
                // TODO
            });

            this.privConversationRecognizer.muteAllCommandReceived = ((r: ConversationTranslatorRecognizer, e: MuteAllEventArgs) => {
                try {
                    this.privParticipants.participants.forEach((p: IInternalParticipant) => p.isMuted = (p.isHost ? false : e.isMuted));
                    if (!!this.participantsChanged) {
                        this.participantsChanged(this, new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.Updated,
                            this.toParticipants(false), e.sessionId));
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.participantJoinCommandReceived = ((r: ConversationTranslatorRecognizer, e: ParticipantEventArgs) => {

                try {
                    this.privParticipants.addOrUpdateParticipant(e.participant);
                    const newParticipant: IInternalParticipant = this.privParticipants.getParticipant(e.participant.id);
                    if (newParticipant !== undefined) {
                        if (!!this.participantsChanged) {
                            this.participantsChanged(this, new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.JoinedConversation,
                                [this.toParticipant(newParticipant)], e.sessionId));
                        }
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.participantLeaveCommandReceived = ((r: ConversationTranslatorRecognizer, e: ParticipantEventArgs) => {

                try {
                    const ejectedParticipant: IInternalParticipant = this.privParticipants.getParticipant(e.participant.id);
                    if (ejectedParticipant !== undefined) {
                        this.privParticipants.deleteParticipant(e.participant.id);
                    }
                    if (!!this.participantsChanged) {
                        this.participantsChanged(this, new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.LeftConversation,
                            [this.toParticipant(ejectedParticipant)], e.sessionId));
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.translationReceived = ((r: ConversationTranslatorRecognizer, e: ConversationReceivedTranslationEventArgs) => {

                try {
                    switch (e.command) {
                        case ConversationTranslatorMessageTypes.final:
                            if (!!this.transcribed) {
                                this.transcribed(this,
                                    new ConversationTranslationEventArgs(e.payload, undefined, e.sessionId));
                            }
                            break;
                        case ConversationTranslatorMessageTypes.partial:
                            if (!!this.transcribing) {
                                this.transcribing(this,
                                    new ConversationTranslationEventArgs(e.payload, undefined, e.sessionId));
                            }
                            break;
                        case ConversationTranslatorMessageTypes.instantMessage:
                            if (!!this.textMessageReceived) {
                                this.textMessageReceived(this,
                                    new ConversationTranslationEventArgs(e.payload, undefined, e.sessionId));
                            }
                            break;
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.participantsListReceived = ((r: ConversationTranslatorRecognizer, e: ParticipantsListEventArgs) => {

                try {
                    // check if the session token needs to be updated
                    if (e.sessionToken !== undefined && e.sessionToken !== null) {
                        this.privRoom.token = e.sessionToken;
                    }
                    // save the participants
                    // enable the conversation
                    this.privParticipants.participants = [...e.participants];

                    if (this.privParticipants.me !== undefined) {
                        this.privIsReady = true;
                    }

                    if (!!this.participantsChanged) {
                        this.participantsChanged(this,
                            new ConversationParticipantsChangedEventArgs(ParticipantChangedReason.JoinedConversation, this.toParticipants(true), e.sessionId));
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            this.privConversationRecognizer.conversationExpiration = ((r: ConversationTranslatorRecognizer, e: ConversationExpirationEventArgs) => {

                try {
                    if (!!this.conversationExpiration) {
                        this.conversationExpiration(this, e);
                    }
                } catch (e) {
                    // tslint:disable-next-line: no-console
                    // console.log(e);
                }
            });

            // open a connection to the Capito websocket
            this.privConversationRecognizer.connect(this.privRoom.token);

        } catch (error) {
            //
        }
    }

    public disconnect(): void {
        this.privIsExiting = true;
        this.cancel();
    }

    /**
     * Send the remove participant request
     * @param participantId
     */
    public ejectParticpant(participantId: string): void {
        if (!this.canSendAsHost) { return; }

        if (!!this.privConversationRecognizer) {
            this.privConversationRecognizer.sendEjectRequest(this.privRoom.roomId, participantId);
        }
    }

    /**
     * Send the text message request
     * @param message
     */
    public sendTextMessage(message: string): void {
        if (!this.canSend) { return; }

        if (!!this.privConversationRecognizer) {
            this.privConversationRecognizer.sendMessageRequest(
                this.privRoom.roomId,
                this.privRoom.participantId,
                message);
        }
    }

    /**
     * Send the toggle room request
     * @param isLocked
     */
    public toggleLockRoom(isLocked: boolean): void {
        if (!this.canSendAsHost) { return; }

        if (!!this.privConversationRecognizer) {
            this.privConversationRecognizer.sendLockRequest(this.privRoom.roomId, this.privRoom.participantId, isLocked);
        }
    }

    /**
     * Send the mute all request
     * @param isMuted
     */
    public toggleMuteAll(isMuted: boolean): void {
        if (!this.canSendAsHost) { return; }

        if (!!this.privConversationRecognizer) {
            this.privConversationRecognizer.sendMuteAllRequest(this.privRoom.roomId, this.privRoom.participantId, isMuted);
        }
    }

    /**
     * Send the mute participant request
     * @param participantId
     * @param isMuted
     */
    public toggleMuteParticipant(participantId: string, isMuted: boolean): void {
        if (!this.canSendAsHost) { return; }

        if (!!this.privConversationRecognizer) {
            this.privConversationRecognizer.sendMuteRequest(this.privRoom.roomId, participantId, isMuted);
        }
    }

    public close(): void {
        this.disconnect();
        this.dispose();
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(reason?: string): void {
        if (this.isDisposed) {
            return;
        }
        this.privIsDisposed = true;
        this.privSpeechTranslationConfig?.close();
        this.privConversationRecognizer?.close();
        this.privConversationRecognizer = undefined;
        this.privIsConnected = false;
        this.privIsConversationConnected = false;
        this.privIsReady = false;
        this.privParticipants = undefined;
        this.privRoom = undefined;
        this.privSpeechTranslationConfig = undefined;
    }

    private cancel(): void {

        try {
            this.privIsConnected = false;
            this.privConversationRecognizer?.disconnect();
            this.privConversationRecognizer = undefined;
        } catch (e) {
            // ignore error
        }
        this.dispose();
    }

    /** Helpers */
    private canSend(): boolean {
        return this.privIsConnected && this.privIsConversationConnected && !this.privParticipants.me?.isMuted;
    }

    private canSendAsHost(): boolean {
        return this.privParticipants.me.isHost && this.privIsConnected && this.privIsConversationConnected;
    }

    /** Participant Helpers */
    private toParticipants(includeHost: boolean): Participant[] {

        const participants: Participant[] = this.privParticipants.participants.map((p: IInternalParticipant) => {
            return this.toParticipant(p);
        });
        if (!includeHost) {
            return participants.filter((p: Participant) => p.isHost === false);
        } else {
            return participants;
        }
    }

    private toParticipant(p: IInternalParticipant): Participant {
        return new Participant(p.id, p.avatar, p.displayName, p.isHost, p.isMuted, p.isUsingTts, p.preferredLanguage);
    }

}
