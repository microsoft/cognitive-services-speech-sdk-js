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
    IInternalParticipant} from "./ConversationTranslatorInterfaces";
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
    private privMe: IInternalParticipant;
    private privParticipants: IInternalParticipant[];
    private privRoom: IInternalConversation;
    private privIsDisposed: boolean = false;
    // private privProperties: PropertyCollection;
    private privSpeechTranslationConfig: SpeechTranslationConfig;
    private privIsConversationConnected: boolean;
    private privIsReady: boolean;
    private privIsExiting: boolean;

    public get isMutedByHost(): boolean {
        return this.privMe.isHost ? false : this.privMe?.isMuted;
    }

    public get isConnected(): boolean {
        return this.privIsConnected && this.privIsReady;
    }

    public get participants(): Participant[] {
        return this.toParticipants(true);
    }

    public get me(): Participant {
        return this.privMe ? this.toParticipant(this.privMe) : undefined;
    }

    public constructor(speechConfig: SpeechTranslationConfig) {

        // clear the temp subscription key if it's a participant joining
        if (speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_Key]) === "abcdefghijklmnopqrstuvwxyz012345") {
            speechConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_Key], "");
        }

        // this.privProperties = config;
        this.privSpeechTranslationConfig = speechConfig;
        this.privIsConversationConnected = false;
        this.privParticipants = [];
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

    // public onEvent(): void {
    //     throw new Error("Method not implemented.");
    // }

    public connect(room: IInternalConversation): void {

        try {

            this.privRoom = room;

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
                    const updatedParticipant: any = this.findParticipantById(e.id);
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
                        this.addOrUpdateParticipants([updatedParticipant]);

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
                    this.privParticipants.forEach((p: IInternalParticipant) => p.isMuted = (p.isHost ? false : e.isMuted));
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
                    this.addOrUpdateParticipants([e.participant]);
                    const newParticipant: IInternalParticipant = this.findParticipantById(e.participant.id);
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
                    const ejectedParticipant: IInternalParticipant = this.findParticipantById(e.participant.id);
                    if (ejectedParticipant !== undefined) {
                        this.deleteParticipant(e.participant.id);
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
                    this.privParticipants = [...e.participants];
                    this.privMe = this.findParticipantById(this.privRoom.participantId);

                    if (this.privMe !== undefined) {
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
        this.privMe = undefined;
        this.privParticipants = [];
        // this.privProperties = undefined;
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
        return this.privMe && !this.privMe.isMuted && this.privIsConnected && this.privIsConversationConnected;
    }

    private canSendAsHost(): boolean {
        return this.privMe && this.privMe.isHost && this.privIsConnected && this.privIsConversationConnected;
    }

    /** Participant helpers
     *  TODO: turn into a class / repository of participants  [there is IStringDictionary available]
     */
    private findParticipantById(id: string): IInternalParticipant {
        return this.privParticipants.find((p: { id: string; }) => p.id === id);
    }

    private deleteParticipant(id: string): void {
        this.privParticipants = this.privParticipants.filter((p: IInternalParticipant) => p.id !== id);
    }

    private addOrUpdateParticipants(participants: IInternalParticipant[]): void {
        participants.forEach((participant: IInternalParticipant) => {
            const index = this.privParticipants.findIndex((p: { id: string; }) => p.id === participant.id);
            if (index > -1) {
                if (participant.displayName !== undefined) {
                    this.privParticipants[index].displayName = participant.displayName;
                }
                if (participant.isMuted !== undefined) {
                    this.privParticipants[index].isMuted = participant.isMuted;
                }
                if (participant.isUsingTts !== undefined) {
                    this.privParticipants[index].isUsingTts = participant.isUsingTts;
                }
                if (participant.preferredLanguage !== undefined) {
                    this.privParticipants[index].preferredLanguage = participant.preferredLanguage;
                }
            } else {
                // add the participant
                this.privParticipants.push(participant);
            }
        });

        // update me
        this.privMe = this.findParticipantById(this.privRoom.participantId);
    }

    private toParticipants(includeHost: boolean): Participant[] {

        let participants: Participant[] = [];
        participants = this.privParticipants.map((p: IInternalParticipant) => {
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
