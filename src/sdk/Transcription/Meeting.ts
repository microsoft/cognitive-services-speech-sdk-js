// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import {
    ConversationConnectionConfig,
    IInternalParticipant,
    InternalParticipants,
    TranscriberRecognizer
} from "../../common.speech/Exports.js";
import {
    IDisposable,
    IErrorMessages,
    marshalPromiseToCallbacks
} from "../../common/Exports.js";
import { Contracts } from "../Contracts.js";
import {
    Participant,
    PropertyCollection,
    PropertyId,
    SpeechTranslationConfig,
} from "../Exports.js";
import { SpeechTranslationConfigImpl } from "../SpeechTranslationConfig.js";
import { Callback, MeetingInfo, MeetingProperties, IMeeting } from "./IMeeting.js";
import { IParticipant, IUser, TranscriptionParticipant } from "./IParticipant.js";

export abstract class Meeting implements IMeeting {

    protected constructor() {
        return;
    }

    public abstract get authorizationToken(): string;

    public abstract get config(): SpeechTranslationConfig;

    public abstract get meetingId(): string;
    public abstract get meetingInfo(): MeetingInfo;
    public abstract get properties(): PropertyCollection;
    public abstract get speechRecognitionLanguage(): string;
    public abstract get participants(): Participant[];
    public abstract set authorizationToken(value: string);

    /**
     * Create a meeting
     * @param speechConfig
     * @param meetingId
     * @param cb
     * @param err
     */
    public static createMeetingAsync(speechConfig: SpeechTranslationConfig, meetingId: string, arg3?: Callback, arg4?: Callback): Meeting {
        Contracts.throwIfNullOrUndefined(speechConfig, ConversationConnectionConfig.restErrors.invalidArgs.replace("{arg}", "config"));
        Contracts.throwIfNullOrUndefined(speechConfig.region, ConversationConnectionConfig.restErrors.invalidArgs.replace("{arg}", "SpeechServiceConnection_Region"));
        Contracts.throwIfNull(meetingId, "meetingId");
        if (meetingId.length === 0) {
            throw new Error("meetingId cannot be empty");
        }
        if (!speechConfig.subscriptionKey && !speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceAuthorization_Token])) {
            Contracts.throwIfNullOrUndefined(speechConfig.subscriptionKey, ConversationConnectionConfig.restErrors.invalidArgs.replace("{arg}", "SpeechServiceConnection_Key"));
        }
        const meetingImpl = new MeetingImpl(speechConfig, meetingId);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        marshalPromiseToCallbacks((async (): Promise<void> => {})(), arg3, arg4);
        return meetingImpl;
    }

    /** Add Participant to Meeting. */
    public abstract addParticipantAsync(participant: IParticipant, cb?: Callback, err?: Callback): void;

    /**
     * Remove a participant from a meeting using the user id, Participant or User object
     * @param userId A user identifier
     */
    public abstract removeParticipantAsync(userId: string | IParticipant | IUser, cb?: Callback, err?: Callback): void;
}

export class MeetingImpl extends Meeting implements IDisposable {

    private privConfig: SpeechTranslationConfig;
    private privProperties: PropertyCollection;
    private privLanguage: string;
    private privToken: string;
    private privIsDisposed: boolean;
    private privParticipants: InternalParticipants;
    private privTranscriberRecognizer: TranscriberRecognizer;
    private privErrors: IErrorMessages = ConversationConnectionConfig.restErrors;
    private privMeetingId: string;

    /**
     * Create a Meeting impl
     * @param speechConfig
     * @param {string} id - meetingId
     */
    public constructor(speechConfig: SpeechTranslationConfig, id: string) {
        super();
        this.privIsDisposed = false;
        this.privMeetingId = "";
        this.privProperties = new PropertyCollection();

        // check the speech language
        const language: string = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);
        if (!language) {
            speechConfig.setProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage], ConversationConnectionConfig.defaultLanguageCode);
        }
        this.privLanguage = speechConfig.getProperty(PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);
        this.privMeetingId = id;

        // save the speech config for future usage
        this.privConfig = speechConfig;

        // save the config properties
        const configImpl = speechConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(configImpl, "speechConfig");
        this.privProperties = configImpl.properties.clone();
        this.privParticipants = new InternalParticipants();
    }

    // get the config
    public get config(): SpeechTranslationConfig {
        return this.privConfig;
    }

    // get the meeting Id
    public get meetingId(): string {
        return this.privMeetingId;
    }

    // get the properties
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    // get the speech language
    public get speechRecognitionLanguage(): string {
        return this.privLanguage;
    }

    public get participants(): Participant[] {
        return this.toParticipants(true);
    }

    public get transcriberRecognizer(): TranscriberRecognizer {
        return this.privTranscriberRecognizer;
    }

    public get meetingInfo(): MeetingInfo {
        const meetingId: string = this.meetingId;
        const p: TranscriptionParticipant[] = this.participants.map((part: Participant): TranscriptionParticipant => (
            {
                id: part.id,
                preferredLanguage: part.preferredLanguage,
                voice: part.voice
            }
        ));
        const props: MeetingProperties = {};
        for (const key of ConversationConnectionConfig.transcriptionEventKeys) {
            const val: string = this.properties.getProperty(key, "");
            if (val !== "") {
                props[key] = val;
            }
        }
        const info: MeetingInfo = { id: meetingId, participants: p, meetingProperties: props };
        return info;
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

    /**
     * Add a participant to the meeting.
     * @param { IParticipant } participant - participant to add
     * @param cb
     * @param err
     */
    public addParticipantAsync(participant: IParticipant, cb?: Callback, err?: Callback): void {
        Contracts.throwIfNullOrUndefined(participant, "Participant");
        marshalPromiseToCallbacks(this.addParticipantImplAsync(participant), cb, err);
    }

    /**
     * Remove a participant from the meeting.
     * @param userId
     * @param cb
     * @param err
     */
    public removeParticipantAsync(userId: string | IParticipant | IUser, cb?: Callback, err?: Callback): void {
        Contracts.throwIfDisposed(this.privIsDisposed);
        Contracts.throwIfNullOrUndefined(this.privTranscriberRecognizer, "Recognizer");
        Contracts.throwIfNullOrUndefined(userId, this.privErrors.invalidArgs.replace("{arg}", "userId"));
        marshalPromiseToCallbacks(this.removeParticipantImplAsync(userId as IParticipant), cb, err);
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
        this.privToken = undefined;
        this.privParticipants = undefined;
    }

    public async connectTranscriberRecognizer(recognizer: TranscriberRecognizer): Promise<void> {
        if (!!this.privTranscriberRecognizer) {
            await this.privTranscriberRecognizer.close();
        }
        await recognizer.enforceAudioGating();
        this.privTranscriberRecognizer = recognizer;
        this.privTranscriberRecognizer.meeting = this;
    }

    private addParticipantImplAsync(participant: IParticipant): Promise<void> {
        const newParticipant: IInternalParticipant = this.privParticipants.addOrUpdateParticipant(participant);
        if (newParticipant !== undefined) {
            if (!!this.privTranscriberRecognizer) {
                const meetingInfo = this.meetingInfo;
                meetingInfo.participants = [participant];
                return this.privTranscriberRecognizer.pushMeetingEvent(meetingInfo, "join");
            }
        }
    }

    private removeParticipantImplAsync(participant: IParticipant): Promise<void> {
        this.privParticipants.deleteParticipant(participant.id);
        const meetingInfo = this.meetingInfo;
        meetingInfo.participants = [participant];
        return this.privTranscriberRecognizer.pushMeetingEvent(meetingInfo, "leave");
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
}
