// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { TranscriberRecognizer } from "../../common.speech/Exports.js";
import { marshalPromiseToCallbacks } from "../../common/Exports.js";
import { Contracts } from "../Contracts.js";
import {
    AudioConfig,
    CancellationEventArgs,
    Connection,
    MeetingTranscriptionEventArgs,
    PropertyCollection,
    PropertyId,
    SessionEventArgs
} from "../Exports.js";
import {
    MeetingHandler,
    MeetingImpl,
    MeetingTranscriptionHandler
} from "./Exports.js";
import { Callback, IMeeting } from "./IMeeting.js";

export class MeetingTranscriber implements MeetingTranscriptionHandler {

    /**
     * The event canceled signals that an error occurred during the meeting.
     * @member MeetingTranscriber.prototype.MeetingCanceled
     * @function
     * @public
     */
    public MeetingCanceled: (sender: MeetingHandler, event: CancellationEventArgs) => void;

    /**
     * The event canceled signals that an error occurred during transcription.
     * @member MeetingTranscriber.prototype.canceled
     * @function
     * @public
     */
    public canceled: (sender: MeetingHandler, event: CancellationEventArgs) => void;

     /**
      * The event recognized signals that a final meeting transcription result is received.
      * @member MeetingTranscriber.prototype.transcribed
      * @function
      * @public
      */
    public transcribed: (sender: MeetingTranscriptionHandler, event: MeetingTranscriptionEventArgs) => void;

     /**
      * The event recognizing signals that an intermediate meeting transcription result is received.
      * @member MeetingTranscriber.prototype.transcribing
      * @function
      * @public
      */
    public transcribing: (sender: MeetingTranscriptionHandler, event: MeetingTranscriptionEventArgs) => void;

    /**
     * Defines event handler for session started events.
     * @member MeetingTranscriber.prototype.sessionStarted
     * @function
     * @public
     */
    public sessionStarted: (sender: MeetingHandler, event: SessionEventArgs) => void;

    /**
     * Defines event handler for session stopped events.
     * @member MeetingTranscriber.prototype.sessionStopped
     * @function
     * @public
     */
    public sessionStopped: (sender: MeetingHandler, event: SessionEventArgs) => void;

    /**
     * Defines event handler for meeting started events.
     * @member MeetingTranscriber.prototype.MeetingStarted
     * @function
     * @public
     */
    public MeetingStarted: (sender: MeetingHandler, event: SessionEventArgs) => void;

    /**
     * Defines event handler for meeting stopped events.
     * @member MeetingTranscriber.prototype.MeetingStopped
     * @function
     * @public
     */
    public meetingStopped: (sender: MeetingHandler, event: SessionEventArgs) => void;

    protected privAudioConfig: AudioConfig;
    private privDisposedRecognizer: boolean;
    private privRecognizer: TranscriberRecognizer;
    private privProperties: PropertyCollection;

    /**
     * MeetingTranscriber constructor.
     * @constructor
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    public constructor(audioConfig?: AudioConfig) {
        this.privAudioConfig = audioConfig;
        this.privProperties = new PropertyCollection();
        this.privRecognizer = undefined;
        this.privDisposedRecognizer = false;
    }

    /**
     * Gets the spoken language of recognition.
     * @member MeetingTranscriber.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} The spoken language of recognition.
     */
    public get speechRecognitionLanguage(): string {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    /**
     * The collection of properties and their values defined for this MeetingTranscriber.
     * @member MeetingTranscriber.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this MeetingTranscriber.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * @Internal
     * Internal data member to support fromRecognizer* pattern methods on other classes.
     * Do not use externally, object returned will change without warning or notice.
     */
    public get internalData(): object {
        return this.privRecognizer.internalData;
    }

    /**
     * @Deprecated
     * @Obsolete
     * Please use the Connection.fromRecognizer pattern to obtain a connection object
     */
    public get connection(): Connection {
        return Connection.fromRecognizer(this.privRecognizer);
    }

    /**
     * Gets the authorization token used to communicate with the service.
     * @member MeetingTranscriber.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * @member MeetingTranscriber.prototype.authorizationToken
     * @function
     * @public
     * @param {string} token - Authorization token.
     */
    public set authorizationToken(token: string) {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, token);
    }

    /**
     * @param {Meeting} meeting - meeting to be recognized
     */
    public joinMeetingAsync(meeting: IMeeting, cb?: Callback, err?: Callback): void {
        /* eslint-disable no-console */
        // console.log(">> MeetingTranscriber::joinMeetingAsync");
        /* eslint-enable no-console */
        const meetingImpl = meeting as MeetingImpl;
        Contracts.throwIfNullOrUndefined(MeetingImpl, "Meeting");

        // ref the meeting object
        // create recognizer and subscribe to recognizer events
        this.privRecognizer = new TranscriberRecognizer(meeting.config, this.privAudioConfig);
        Contracts.throwIfNullOrUndefined(this.privRecognizer, "Recognizer");
        this.privRecognizer.connectMeetingCallbacks(this);

        marshalPromiseToCallbacks(meetingImpl.connectTranscriberRecognizer(this.privRecognizer), cb, err);
    }

    /**
     * Starts meeting transcription, until stopTranscribingAsync() is called.
     * User must subscribe to events to receive transcription results.
     * @member MeetingTranscriber.prototype.startTranscribingAsync
     * @function
     * @public
     * @param cb - Callback invoked once the transcription has started.
     * @param err - Callback invoked in case of an error.
     */
    public startTranscribingAsync(cb?: Callback, err?: Callback): void {
        this.privRecognizer.startContinuousRecognitionAsync(cb, err);
    }

    /**
     * Starts meeting transcription, until stopTranscribingAsync() is called.
     * User must subscribe to events to receive transcription results.
     * @member MeetingTranscriber.prototype.stopTranscribingAsync
     * @function
     * @public
     * @param cb - Callback invoked once the transcription has started.
     * @param err - Callback invoked in case of an error.
     */
    public stopTranscribingAsync(cb?: Callback, err?: Callback): void {
        this.privRecognizer.stopContinuousRecognitionAsync(cb, err);
    }

    /**
     * Leave the current meeting. After this is called, you will no longer receive any events.
     */
    public leaveMeetingAsync(cb?: Callback, err?: Callback): void {
        this.privRecognizer.disconnectCallbacks();
        // eslint-disable-next-line
        marshalPromiseToCallbacks((async (): Promise<void> => { return; })(), cb, err);
    }

    /**
     * closes all external resources held by an instance of this class.
     * @member MeetingTranscriber.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, errorCb?: (error: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);
        marshalPromiseToCallbacks(this.dispose(true), cb, errorCb);
    }

    /**
     * Disposes any resources held by the object.
     * @member MeetingTranscriber.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - true if disposing the object.
     */
    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposedRecognizer) {
            return;
        }
        if (!!this.privRecognizer) {
            await this.privRecognizer.close();
            this.privRecognizer = undefined;
        }
        if (disposing) {
            this.privDisposedRecognizer = true;
        }
    }
}
