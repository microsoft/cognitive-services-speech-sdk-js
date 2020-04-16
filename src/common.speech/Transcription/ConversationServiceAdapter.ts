// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionEvent,
    ConnectionMessage,
    ConnectionOpenResponse,
    ConnectionState,
    createNoDashGuid,
    Deferred,
    IAudioSource,
    IConnection,
    MessageType,
    Promise,
    PromiseHelper,
    PromiseResult
} from "../../common/Exports";
import { Sink } from "../../common/Promise";
import {
    CancellationErrorCode,
    CancellationReason,
    ConversationExpirationEventArgs,
    ConversationTranslationCanceledEventArgs,
    ConversationTranslationResult,
    PropertyId,
    SessionEventArgs,
    SpeechRecognitionResult,
    Translations
} from "../../sdk/Exports";
import {
    AuthInfo, IAuthentication, IConnectionFactory, RecognizerConfig, ServiceRecognizerBase
} from "../Exports";
import { ConversationConnectionMessage } from "./ConversationConnectionMessage";
import { ConversationRequestSession } from "./ConversationRequestSession";
import {
    ConversationReceivedTranslationEventArgs,
    LockRoomEventArgs,
    MuteAllEventArgs,
    ParticipantAttributeEventArgs,
    ParticipantEventArgs,
    ParticipantsListEventArgs } from "./ConversationTranslatorEventArgs";
import { ConversationTranslatorCommandTypes, ConversationTranslatorMessageTypes, IInternalParticipant } from "./ConversationTranslatorInterfaces";
import { ConversationTranslatorRecognizer } from "./ConversationTranslatorRecognizer";
import {
    CommandResponsePayload,
    IParticipantPayloadResponse,
    IParticipantsListPayloadResponse,
    ITranslationResponsePayload,
    ParticipantPayloadResponse,
    ParticipantsListPayloadResponse,
    SpeechResponsePayload,
    TextResponsePayload  } from "./ServiceMessages/Exports";

/***
 * The service adapter handles sending and receiving messages to the Conversation Translator websocket.
 */
export class ConversationServiceAdapter extends ServiceRecognizerBase {
    private privConversationServiceConnector: ConversationTranslatorRecognizer;
    private privConversationConnectionFactory: IConnectionFactory;
    private privConversationAuthFetchEventId: string;
    private privConversationAuthentication: IAuthentication;
    private privConversationRequestSession: ConversationRequestSession;
    private privConnectionConfigPromise: Promise<IConnection>;
    private privConversationConnectionPromise: Promise<IConnection>;
    private privConnectionLoop: Promise<IConnection>;
    private terminateMessageLoop: boolean;
    private privLastPartialUtteranceId: string = "";
    private privConversationIsDisposed: boolean;

    public constructor(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioSource: IAudioSource,
        recognizerConfig: RecognizerConfig,
        conversationServiceConnector: ConversationTranslatorRecognizer) {

        super(authentication, connectionFactory, audioSource, recognizerConfig, conversationServiceConnector);

        this.privConversationServiceConnector = conversationServiceConnector;
        this.privConversationAuthentication = authentication;
        this.receiveMessageOverride = this.receiveConversationMessageOverride;
        this.recognizeOverride = this.noOp;
        this.connectImplOverride = this.conversationConnectImpl;
        this.configConnectionOverride = this.configConnection;
        this.fetchConnectionOverride = this.fetchConversationConnection;
        this.disconnectOverride = this.privDisconnect;
        this.privConversationRequestSession = new ConversationRequestSession(createNoDashGuid());
        this.privConversationConnectionFactory = connectionFactory;
        this.privConversationIsDisposed = false;
    }

    public isDisposed(): boolean {
        return this.privConversationIsDisposed;
    }

    public dispose(reason?: string): void {
        this.privConversationIsDisposed = true;
        if (this.privConnectionConfigPromise) {
            this.privConnectionConfigPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose(reason);
            });
        }
    }

    public sendMessage(message: string): void {
        this.fetchConversationConnection().onSuccessContinueWith((connection: IConnection) => {
        connection.send(new ConversationConnectionMessage(
        MessageType.Text,
        message));
        });
    }

    public sendMessageAsync = (message: string): Promise<boolean> => {
        const sink: Sink<boolean> = new Sink<boolean>();

        this.fetchConversationConnection().continueWith((antecedent: PromiseResult<IConnection>): void => {
            try {
                if (antecedent.isError) {
                    sink.reject(antecedent.error);
                } else {
                    antecedent.result.send(new ConversationConnectionMessage(MessageType.Text, message))
                        .continueWith((innerAntecedent: PromiseResult<boolean>): void => {
                            try {
                                if (innerAntecedent.isError) {
                                    sink.reject(innerAntecedent.error);
                                } else {
                                    sink.resolve(innerAntecedent.result);
                                }
                            } catch (e) {
                                sink.reject(`Unhandled inner error: ${e}`);
                            }
                        });
                }
            } catch (e) {
                sink.reject(`Unhandled error: ${e}`);
            }
        });

        return new Promise<boolean>(sink);
    }

    protected privDisconnect(): void {
        if (this.terminateMessageLoop) {
            return;
        }
        this.cancelRecognition(this.privConversationRequestSession.sessionId,
            this.privConversationRequestSession.requestId,
            CancellationReason.Error,
            CancellationErrorCode.NoError,
            "Disconnecting");

        this.terminateMessageLoop = true;
        if (this.privConversationConnectionPromise.result().isCompleted) {
            if (!this.privConversationConnectionPromise.result().isError) {
                this.privConversationConnectionPromise.result().result.dispose();
                this.privConversationConnectionPromise = null;
            }
        } else {
            this.privConversationConnectionPromise.onSuccessContinueWith((connection: IConnection) => {
                connection.dispose();
            });
        }
    }

    protected processTypeSpecificMessages(
        connectionMessage: ConnectionMessage,
        successCallback?: (e: any) => void,
        errorCallBack?: (e: string) => void): boolean {
            return true;
    }

    // Cancels recognition.
    protected cancelRecognition(
        sessionId: string,
        requestId: string,
        cancellationReason: CancellationReason,
        errorCode: CancellationErrorCode,
        error: string): void {

            this.terminateMessageLoop = true;

            const cancelEvent: ConversationTranslationCanceledEventArgs = new ConversationTranslationCanceledEventArgs(
                        cancellationReason,
                        error,
                        errorCode,
                        undefined,
                        sessionId);

            try {
                if (!!this.privConversationServiceConnector.canceled) {
                    this.privConversationServiceConnector.canceled(this.privConversationServiceConnector, cancelEvent);
                }
            } catch {
                // continue on error
            }
    }

    protected noOp = (): any => {
        // operation not supported
    }

    /**
     * Establishes a websocket connection to the end point.
     * @param isUnAuthorized
     */
    protected conversationConnectImpl(isUnAuthorized: boolean = false): Promise<IConnection> {

        if (this.privConversationConnectionPromise) {
            if (this.privConversationConnectionPromise.result().isCompleted &&
                (this.privConversationConnectionPromise.result().isError
                    || this.privConversationConnectionPromise.result().result.state() === ConnectionState.Disconnected)) {
                this.privConnectionId = null;
                this.privConversationConnectionPromise = null;
                this.terminateMessageLoop = true;
                return this.conversationConnectImpl();
            } else {
                return this.privConversationConnectionPromise;
            }
        }

        this.privConversationAuthFetchEventId = createNoDashGuid();

        // keep the connectionId for reconnect events
        if (this.privConnectionId === undefined) {
            this.privConnectionId = createNoDashGuid();
        }

        this.privConversationRequestSession.onPreConnectionStart(this.privConversationAuthFetchEventId, this.privConnectionId);

        const authPromise = isUnAuthorized ? this.privConversationAuthentication.fetchOnExpiry(this.privConversationAuthFetchEventId) : this.privConversationAuthentication.fetch(this.privConversationAuthFetchEventId);

        this.privConversationConnectionPromise = authPromise
            .continueWithPromise((result: PromiseResult<AuthInfo>) => {
                if (result.isError) {
                    this.privConversationRequestSession.onAuthCompleted(true, result.error);
                    throw new Error(result.error);
                } else {
                    this.privConversationRequestSession.onAuthCompleted(false);
                }

                const connection: IConnection = this.privConversationConnectionFactory.create(this.privRecognizerConfig, result.result, this.privConnectionId);

                // Attach to the underlying event. No need to hold onto the detach pointers as in the event the connection goes away,
                // it'll stop sending events.
                connection.events.attach((event: ConnectionEvent) => {
                    this.connectionEvents.onEvent(event);
                });

                return connection.open().onSuccessContinueWithPromise((response: ConnectionOpenResponse): Promise<IConnection> => {
                    if (response.statusCode === 200) {
                        this.privConversationRequestSession.onPreConnectionStart(this.privConversationAuthFetchEventId, this.privConnectionId);
                        this.privConversationRequestSession.onConnectionEstablishCompleted(response.statusCode);
                        const sessionStartEventArgs: SessionEventArgs = new SessionEventArgs(this.privConversationRequestSession.sessionId);
                        if (!!this.privConversationServiceConnector.connectionOpened) {
                            this.privConversationServiceConnector.connectionOpened(this.privConversationServiceConnector, sessionStartEventArgs);
                        }
                        return PromiseHelper.fromResult<IConnection>(connection);
                    } else if (response.statusCode === 403 && !isUnAuthorized) {
                        return this.conversationConnectImpl(true);
                    } else {
                        this.privConversationRequestSession.onConnectionEstablishCompleted(response.statusCode, response.reason);
                        return PromiseHelper.fromError<IConnection>(`Unable to contact server. StatusCode: ${response.statusCode}, ${this.privRecognizerConfig.parameters.getProperty(PropertyId.SpeechServiceConnection_Endpoint)} Reason: ${response.reason}`);
                    }
                });
            });

        this.privConnectionLoop = this.startMessageLoop();
        return this.privConversationConnectionPromise;
    }

    /**
     * Process incoming websocket messages
     */
    private receiveConversationMessageOverride = (
        successCallback?: (e: any) => void,
        errorCallBack?: (e: string) => void
        ): Promise<IConnection> => {

            // we won't rely on the cascading promises of the connection since we want to continually be available to receive messages
            const communicationCustodian: Deferred<IConnection> = new Deferred<IConnection>();

            this.fetchConversationConnection().on((connection: IConnection): Promise<IConnection> => {
                return connection.read()
                    .onSuccessContinueWithPromise((message: ConversationConnectionMessage): Promise<IConnection> => {
                        const isDisposed: boolean = this.isDisposed();
                        const terminateMessageLoop = (!this.isDisposed() && this.terminateMessageLoop);
                        const sessionId: string = this.privConversationRequestSession.sessionId;
                        let sendFinal: boolean = false;
                        if (isDisposed || terminateMessageLoop) {
                            // We're done.
                            communicationCustodian.resolve(undefined);
                            return PromiseHelper.fromResult<IConnection>(undefined);
                        }

                        if (!message) {
                            return this.receiveConversationMessageOverride();
                        }

                        try {
                            switch (message.conversationMessageType.toLowerCase()) {
                                case "info":
                                case "participant_command":
                                case "command":
                                    const commandPayload: CommandResponsePayload = CommandResponsePayload.fromJSON(message.textBody);
                                    switch (commandPayload.command.toLowerCase()) {

                                        /**
                                         * 'ParticpantList' is the first message sent to the user after the websocket connection has opened.
                                         * The consuming client must wait for this message to arrive
                                         * before starting to send their own data.
                                         */
                                        case "participantlist":

                                            const participantsPayload: IParticipantsListPayloadResponse = ParticipantsListPayloadResponse.fromJSON(message.textBody);

                                            const participantsResult: IInternalParticipant[] = participantsPayload.participants.map((p: IParticipantPayloadResponse) => {
                                                const participant: IInternalParticipant =  {
                                                    avatar: p.avatar,
                                                    displayName: p.nickname,
                                                    id: p.participantId,
                                                    isHost: p.ishost,
                                                    isMuted: p.ismuted,
                                                    isUsingTts: p.usetts,
                                                    preferredLanguage: p.locale
                                                };
                                                return participant;
                                            });

                                            if (!!this.privConversationServiceConnector.participantsListReceived) {
                                                this.privConversationServiceConnector.participantsListReceived(this.privConversationServiceConnector,
                                                    new ParticipantsListEventArgs(participantsPayload.roomid, participantsPayload.token,
                                                        participantsPayload.translateTo, participantsPayload.profanityFilter,
                                                        participantsPayload.roomProfanityFilter, participantsPayload.roomLocked,
                                                        participantsPayload.muteAll, participantsResult, sessionId));
                                            }
                                            break;

                                        /**
                                         * 'SetTranslateToLanguages' represents the list of languages being used in the Conversation by all users(?).
                                         * This is sent at the start of the Conversation
                                         */
                                        case "settranslatetolanguages":

                                            if (!!this.privConversationServiceConnector.participantUpdateCommandReceived) {
                                                this.privConversationServiceConnector.participantUpdateCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantAttributeEventArgs(commandPayload.participantId,
                                                        ConversationTranslatorCommandTypes.setTranslateToLanguages,
                                                        commandPayload.value, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'SetProfanityFiltering' lets the client set the level of profanity filtering.
                                         * If sent by the participant the setting will effect only their own profanity level.
                                         * If sent by the host, the setting will effect all participants including the host.
                                         * Note: the profanity filters differ from Speech Service (?): 'marked', 'raw', 'removed', 'tagged'
                                         */
                                        case "setprofanityfiltering":

                                            if (!!this.privConversationServiceConnector.participantUpdateCommandReceived) {
                                                this.privConversationServiceConnector.participantUpdateCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantAttributeEventArgs(commandPayload.participantId,
                                                        ConversationTranslatorCommandTypes.setProfanityFiltering,
                                                        commandPayload.value, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'SetMute' is sent if the participant has been muted by the host.
                                         * Check the 'participantId' to determine if the current user has been muted.
                                         */
                                        case "setmute":

                                            if (!!this.privConversationServiceConnector.participantUpdateCommandReceived) {
                                                this.privConversationServiceConnector.participantUpdateCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantAttributeEventArgs(commandPayload.participantId,
                                                        ConversationTranslatorCommandTypes.setMute,
                                                        commandPayload.value, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'SetMuteAll' is sent if the Conversation has been muted by the host.
                                         */
                                        case "setmuteall":

                                            if (!!this.privConversationServiceConnector.muteAllCommandReceived) {
                                                this.privConversationServiceConnector.muteAllCommandReceived(this.privConversationServiceConnector,
                                                    new MuteAllEventArgs(commandPayload.value as boolean, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'RoomExpirationWarning' is sent towards the end of the Conversation session to give a timeout warning.
                                         */
                                        case "roomexpirationwarning":

                                            if (!!this.privConversationServiceConnector.conversationExpiration) {
                                                this.privConversationServiceConnector.conversationExpiration(this.privConversationServiceConnector,
                                                    new ConversationExpirationEventArgs(commandPayload.value as number, this.privConversationRequestSession.sessionId));
                                            }

                                            break;

                                        /**
                                         * 'SetUseTts' is sent as a confirmation if the user requests TTS to be turned on or off.
                                         */
                                        case "setusetts":

                                            if (!!this.privConversationServiceConnector.participantUpdateCommandReceived) {
                                                this.privConversationServiceConnector.participantUpdateCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantAttributeEventArgs(commandPayload.participantId,
                                                        ConversationTranslatorCommandTypes.setUseTTS,
                                                        commandPayload.value, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'SetLockState' is set if the host has locked or unlocked the Conversation.
                                         */
                                        case "setlockstate":

                                            if (!!this.privConversationServiceConnector.lockRoomCommandReceived) {
                                                this.privConversationServiceConnector.lockRoomCommandReceived(this.privConversationServiceConnector,
                                                    new LockRoomEventArgs(commandPayload.value as boolean, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'ChangeNickname' is received if a user changes their display name.
                                         * Any cached particpiants list should be updated to reflect the display name.
                                         */
                                        case "changenickname":

                                            if (!!this.privConversationServiceConnector.participantUpdateCommandReceived) {
                                                this.privConversationServiceConnector.participantUpdateCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantAttributeEventArgs(commandPayload.participantId,
                                                        ConversationTranslatorCommandTypes.changeNickname,
                                                        commandPayload.nickname, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'JoinSession' is sent when a user joins the Conversation.
                                         */
                                        case "joinsession":

                                            const joinParticipantPayload: ParticipantPayloadResponse = ParticipantPayloadResponse.fromJSON(message.textBody);

                                            const joiningParticipant: IInternalParticipant = {
                                                avatar: joinParticipantPayload.avatar,
                                                displayName: joinParticipantPayload.nickname,
                                                id: joinParticipantPayload.participantId,
                                                isHost: joinParticipantPayload.ishost,
                                                isMuted: joinParticipantPayload.ismuted,
                                                isUsingTts: joinParticipantPayload.usetts,
                                                preferredLanguage: joinParticipantPayload.locale,
                                            };

                                            if (!!this.privConversationServiceConnector.participantJoinCommandReceived) {
                                                this.privConversationServiceConnector.participantJoinCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantEventArgs(
                                                        joiningParticipant,
                                                        sessionId));
                                            }

                                            break;

                                        /**
                                         * 'LeaveSession' is sent when a user leaves the Conversation'.
                                         */
                                        case "leavesession":

                                            const leavingParticipant: IInternalParticipant = {
                                                id: commandPayload.participantId
                                            };

                                            if (!!this.privConversationServiceConnector.participantLeaveCommandReceived) {
                                                this.privConversationServiceConnector.participantLeaveCommandReceived(this.privConversationServiceConnector,
                                                    new ParticipantEventArgs(leavingParticipant, sessionId));
                                            }

                                            break;

                                        /**
                                         * 'DisconnectSession' is sent when a user is disconnected from the session (e.g. network problem).
                                         * Check the 'ParticipantId' to check whether the message is for the current user.
                                         */
                                        case "disconnectsession":

                                            const disconnectParticipant: IInternalParticipant = {
                                                id: commandPayload.participantId
                                            };

                                            break;

                                        /**
                                         * Message not recognized.
                                         */
                                        default:
                                            break;
                                    }
                                    break;

                                /**
                                 * 'partial' (or 'hypothesis') represents a unfinalized speech message.
                                 */
                                case "partial":

                                /**
                                 * 'final' (or 'phrase') represents a finalized speech message.
                                 */
                                case "final":

                                    const speechPayload: SpeechResponsePayload = SpeechResponsePayload.fromJSON(message.textBody);

                                    const speechResult: ConversationTranslationResult = new ConversationTranslationResult(speechPayload.participantId,
                                        this.getTranslations(speechPayload.translations),
                                        speechPayload.language,
                                        undefined,
                                        undefined,
                                        speechPayload.recognition,
                                        undefined,
                                        undefined,
                                        message.textBody,
                                        undefined);

                                    if (speechPayload.isFinal) {
                                        // check the length, sometimes empty finals are returned
                                        if (speechResult.text !== undefined && speechResult.text.length > 0) {
                                            sendFinal = true;
                                        } else if (speechPayload.id === this.privLastPartialUtteranceId) {
                                            // send final as normal. We had a non-empty partial for this same utterance
                                            // so sending the empty final is important
                                            sendFinal = true;
                                        } else {
                                            // suppress unneeded final
                                        }

                                        if (sendFinal) {
                                            if (!!this.privConversationServiceConnector.translationReceived) {
                                                this.privConversationServiceConnector.translationReceived(this.privConversationServiceConnector,
                                                    new ConversationReceivedTranslationEventArgs(ConversationTranslatorMessageTypes.final, speechResult, sessionId));
                                            }
                                        }
                                    }  else if (speechResult.text !== undefined) {
                                        this.privLastPartialUtteranceId = speechPayload.id;
                                        if (!!this.privConversationServiceConnector.translationReceived) {
                                            this.privConversationServiceConnector.translationReceived(this.privConversationServiceConnector,
                                                new ConversationReceivedTranslationEventArgs(ConversationTranslatorMessageTypes.partial, speechResult, sessionId));
                                        }
                                    }

                                    break;

                                /**
                                 * "translated_message" is a text message or instant message (IM).
                                 */
                                case "translated_message":

                                    const textPayload: TextResponsePayload = TextResponsePayload.fromJSON(message.textBody);

                                    const textResult: ConversationTranslationResult = new ConversationTranslationResult(textPayload.participantId,
                                                this.getTranslations(textPayload.translations),
                                                textPayload.language,
                                                undefined,
                                                undefined,
                                                textPayload.originalText,
                                                undefined,
                                                undefined,
                                                undefined,
                                                message.textBody,
                                                undefined);

                                    if (!!this.privConversationServiceConnector.translationReceived) {
                                        this.privConversationServiceConnector.translationReceived(this.privConversationServiceConnector,
                                            new ConversationReceivedTranslationEventArgs(ConversationTranslatorMessageTypes.instantMessage, textResult, sessionId));
                                    }
                                    break;

                                default:
                                    // ignore any unsupported message types
                                    break;
                            }
                        } catch (e) {
                            // continue
                        }
                        return this.receiveConversationMessageOverride();
                });
            }, (error: string) => {
                this.terminateMessageLoop = true;
            });

            return communicationCustodian.promise();
        }

    private startMessageLoop(): Promise<IConnection> {

        this.terminateMessageLoop = false;

        const messageRetrievalPromise = this.receiveConversationMessageOverride();

        return messageRetrievalPromise.on((r: IConnection) => {
            return true;
        }, (error: string) => {
            this.cancelRecognition(
                this.privRequestSession ? this.privRequestSession.sessionId : "",
                this.privRequestSession ? this.privRequestSession.requestId : "",
                CancellationReason.Error,
                CancellationErrorCode.RuntimeError,
                error);
        });
    }

    // Takes an established websocket connection to the endpoint
    private configConnection(): Promise<IConnection> {
        if (this.privConnectionConfigPromise) {
            if (this.privConnectionConfigPromise.result().isCompleted &&
                (this.privConnectionConfigPromise.result().isError
                    || this.privConnectionConfigPromise.result().result.state() === ConnectionState.Disconnected)) {

                this.privConnectionConfigPromise = null;
                return this.configConnection();
            } else {
                return this.privConnectionConfigPromise;
            }
        }

        if (this.terminateMessageLoop) {
            return PromiseHelper.fromResult<IConnection>(undefined);
        }

        this.privConnectionConfigPromise = this.conversationConnectImpl()
            .onSuccessContinueWith((connection: IConnection): any => {
                return connection;
        });
        return this.privConnectionConfigPromise;
    }

    private getTranslations(serviceResultTranslations: ITranslationResponsePayload[]): Translations {
        let translations: Translations;

        if (undefined !== serviceResultTranslations) {
            translations = new Translations();
            for (const translation of serviceResultTranslations) {
                translations.set(translation.lang, translation.translation);
            }
        }

        return translations;
    }

    private fetchConversationConnection = (): Promise<IConnection> => {
        return this.configConnection();
    }

}
