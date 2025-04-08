// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { marshalPromiseToCallbacks } from "../../common/Exports.js";
import { AudioConfigImpl } from "../../sdk/Audio/AudioConfig.js";
import { AudioStreamFormatImpl } from "../../sdk/Audio/AudioStreamFormat.js";
import { Contracts } from "../../sdk/Contracts.js";
import {
    AudioConfig,
    CancellationEventArgs,
    Conversation,
    ConversationInfo,
    Meeting,
    MeetingInfo,
    MeetingTranscriber,
    PropertyCollection,
    PropertyId,
    Recognizer,
    SessionEventArgs,
    SpeechRecognitionEventArgs,
    SpeechTranslationConfig,
    SpeechTranslationConfigImpl,
} from "../../sdk/Exports.js";
import {
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig,
    TranscriberConnectionFactory,
    TranscriptionServiceRecognizer,
} from "../Exports.js";
import { RecognitionMode } from "../ServiceMessages/PhraseDetection/PhraseDetectionContext.js";

export class TranscriberRecognizer extends Recognizer {

    public recognizing: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void;

    public recognized: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void;

    public canceled: (sender: Recognizer, event: CancellationEventArgs) => void;

    private privDisposedRecognizer: boolean;
    private privConversation: Conversation;
    private privMeeting: Meeting;
    private isMeetingRecognizer: boolean;

    /**
     * TranscriberRecognizer constructor.
     * @constructor
     * @param {SpeechTranslationConfig} speechTranslationConfig - Non-audio configuration associated with the recognizer
     * @param {AudioConfig} audioConfig - An audio configuration associated with the recognizer
     */
    public constructor(speechTranslationConfig: SpeechTranslationConfig, audioConfig: AudioConfig) {
        const speechTranslationConfigImpl: SpeechTranslationConfigImpl = speechTranslationConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(speechTranslationConfigImpl, "speechTranslationConfig");

        const audioConfigImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        Contracts.throwIfNull(audioConfigImpl, "audioConfigImpl");

        Contracts.throwIfNullOrWhitespace(
            speechTranslationConfigImpl.speechRecognitionLanguage,
            PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

        super(audioConfig, speechTranslationConfigImpl.properties, new TranscriberConnectionFactory());
        this.privDisposedRecognizer = false;
        this.isMeetingRecognizer = false;
    }

    public get speechRecognitionLanguage(): string {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    public set authorizationToken(token: string) {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, token);
    }

    public set conversation(c: Conversation) {
        Contracts.throwIfNullOrUndefined(c, "Conversation");
        this.isMeetingRecognizer = false;
        this.privConversation = c;
    }

    public getConversationInfo(): ConversationInfo {
        Contracts.throwIfNullOrUndefined(this.privConversation, "Conversation");
        return this.privConversation.conversationInfo;
    }

    public set meeting(m: Meeting) {
        Contracts.throwIfNullOrUndefined(m, "Meeting");
        this.isMeetingRecognizer = true;
        this.privMeeting = m;
    }

    public getMeetingInfo(): MeetingInfo {
        Contracts.throwIfNullOrUndefined(this.privMeeting, "Meeting");
        return this.privMeeting.meetingInfo;
    }

    public IsMeetingRecognizer(): boolean {
        return this.isMeetingRecognizer;
    }

    public startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.startContinuousRecognitionAsyncImpl(RecognitionMode.Conversation), cb, err);
    }

    public stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.stopContinuousRecognitionAsyncImpl(), cb, err);
    }

    public async close(): Promise<void> {
        if (!this.privDisposedRecognizer) {
            await this.dispose(true);
        }
    }

    // Push async join/leave conversation message via serviceRecognizer
    public async pushConversationEvent(conversationInfo: ConversationInfo, command: string): Promise<void> {
        const reco = (this.privReco) as TranscriptionServiceRecognizer;
        Contracts.throwIfNullOrUndefined(reco, "serviceRecognizer");
        await reco.sendSpeechEventAsync(conversationInfo, command);
    }

    // Push async join/leave meeting message via serviceRecognizer
    public async pushMeetingEvent(meetingInfo: MeetingInfo, command: string): Promise<void> {
        const reco = (this.privReco) as TranscriptionServiceRecognizer;
        Contracts.throwIfNullOrUndefined(reco, "serviceRecognizer");
        await reco.sendMeetingSpeechEventAsync(meetingInfo, command);
    }

    public async enforceAudioGating(): Promise<void> {
        const audioConfigImpl = this.audioConfig as AudioConfigImpl;
        const format: AudioStreamFormatImpl = await audioConfigImpl.format;
        const channels = format.channels;
        if (channels === 1) {
            if (this.properties.getProperty("f0f5debc-f8c9-4892-ac4b-90a7ab359fd2", "false").toLowerCase() !== "true") {
                throw new Error("Single channel audio configuration for MeetingTranscriber is currently under private preview, please contact diarizationrequest@microsoft.com for more details");
            }
        } else if (channels !== 8) {
            throw new Error(`Unsupported audio configuration: Detected ${channels}-channel audio`);
        }
        return;
    }

    public connectMeetingCallbacks(transcriber: MeetingTranscriber): void {
        this.isMeetingRecognizer = true;
        this.canceled = (s: any, e: CancellationEventArgs): void => {
            if (!!transcriber.canceled) {
                transcriber.canceled(transcriber, e);
            }
        };
        this.recognizing = (s: any, e: SpeechRecognitionEventArgs): void => {
            if (!!transcriber.transcribing) {
                transcriber.transcribing(transcriber, e);
            }
        };
        this.recognized = (s: any, e: SpeechRecognitionEventArgs): void => {
            if (!!transcriber.transcribed) {
                transcriber.transcribed(transcriber, e);
            }
        };
        this.sessionStarted = (s: any, e: SessionEventArgs): void => {
            if (!!transcriber.sessionStarted) {
                transcriber.sessionStarted(transcriber, e);
            }
        };
        this.sessionStopped = (s: any, e: SessionEventArgs): void => {
            if (!!transcriber.sessionStopped) {
                transcriber.sessionStopped(transcriber, e);
            }
        };
    }

    public disconnectCallbacks(): void {
        this.canceled = undefined;
        this.recognizing = undefined;
        this.recognized = undefined;
        this.sessionStarted = undefined;
        this.sessionStopped = undefined;
    }

    /**
     * Disposes any resources held by the object.
     * @member ConversationTranscriber.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - true if disposing the object.
     */
    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposedRecognizer) {
            return;
        }

        if (disposing) {
            this.privDisposedRecognizer = true;
            await this.implRecognizerStop();
        }

        await super.dispose(disposing);
    }

    protected createRecognizerConfig(speechConfig: SpeechServiceConfig): RecognizerConfig {
        return new RecognizerConfig(
            speechConfig,
            this.properties);
    }

    protected createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase {
        const configImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        return new TranscriptionServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    }
}
