// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    OutputFormatPropertyName,
} from "../../common.speech/Exports";
import { marshalPromiseToCallbacks } from "../../common/Exports";
import { Contracts } from "../Contracts";
import {
    AudioConfig,
    ConversationTranscriptionCanceledEventArgs,
    ConversationTranscriptionEventArgs,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    SessionEventArgs,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
} from "../Exports";
import {
    Conversation,
    ConversationCommon,
    ConversationImpl,
    ConversationTranscriptionHandler,
    TranscriberRecognizer,
} from "./Exports";
import { Callback, IConversation } from "./IConversation";

export class ConversationTranscriber implements ConversationTranscriptionHandler {
    private privDisposedRecognizer: boolean;
    private privRecognizer: TranscriberRecognizer;
    private privProperties: PropertyCollection;
    protected privAudioConfig: AudioConfig;

    /**
     * ConversationTranscriber constructor.
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
     * The event canceled signals that an error occurred during transcription.
     * @member ConversationTranscriber.prototype.canceled
     * @function
     * @public
     */
    public set canceled(func: (sender: ConversationTranscriptionHandler, event: ConversationTranscriptionCanceledEventArgs) => void) {
        this.canceled = func;
        if (!!this.privRecognizer) {
            this.privRecognizer.canceled = function(s: any, e: SpeechRecognitionCanceledEventArgs): void { func(this, e); };
        }
    }

    /**
     * @param {Conversation} converation - conversation to be recognized
     */
    public joinConversationAsync(conversation: IConversation, cb?: Callback, err?: Callback): void {
        const conversationImpl = conversation as ConversationImpl;
        Contracts.throwIfNullOrUndefined(conversationImpl, "Conversation");

        // ref the conversation object
        // create recognizer and subscribe to recognizer events
        this.privRecognizer = new TranscriberRecognizer(conversation.config, this.privAudioConfig);
        Contracts.throwIfNullOrUndefined(this.privRecognizer, "Recognizer");
        this.privRecognizer.canceled = function(s: any, e: SpeechRecognitionCanceledEventArgs): void { this.canceled(this, e); };
        this.privRecognizer.recognizing = function(s: any, e: SpeechRecognitionEventArgs): void { this.transcribing(this, e); };
        this.privRecognizer.recognized = function(s: any, e: SpeechRecognitionEventArgs): void { this.transcribed(this, e); };
        this.privRecognizer.sessionStarted = function(s: any, e: SpeechRecognitionEventArgs): void { this.sessionStarted(this, e); };
        this.privRecognizer.sessionStopped = function(s: any, e: SpeechRecognitionEventArgs): void { this.sessionStopped(this, e); };
        marshalPromiseToCallbacks(conversationImpl.connectTranscriberRecognizer(this.privRecognizer), cb, err);
    }

     /**
      * The event recognized signals that a final conversation transcription result is received.
      * @member ConversationTranscriber.prototype.transcribed
      * @function
      * @public
      */
    public set transcribed(func: (sender: ConversationTranscriptionHandler, event: ConversationTranscriptionEventArgs) => void) {
        this.transcribed = func;
        if (!!this.privRecognizer) {
            this.privRecognizer.recognized = function(s: any, e: SpeechRecognitionEventArgs): void { func(this, e); };
        }
    }

     /**
      * The event recognizing signals that an intermediate conversation transcription result is received.
      * @member ConversationTranscriber.prototype.transcribing
      * @function
      * @public
      */
    public set transcribing(func: (sender: ConversationTranscriptionHandler, event: ConversationTranscriptionEventArgs) => void) {
        this.transcribing = func;
        if (!!this.privRecognizer) {
            this.privRecognizer.recognizing = function(s: any, e: SpeechRecognitionEventArgs): void { func(this, e); };
        }
    }

    /**
     * Defines event handler for session started events.
     * @member ConversationTranscriber.prototype.sessionStarted
     * @function
     * @public
     */
    public set sessionStarted(func: (sender: ConversationTranscriptionHandler, event: SessionEventArgs) => void) {
        this.sessionStarted = func;
        if (!!this.privRecognizer) {
            this.privRecognizer.sessionStarted = function(s: any, e: SpeechRecognitionEventArgs): void { func(this, e); };
        }
    }

    /**
     * Defines event handler for session stopped events.
     * @member ConversationTranscriber.prototype.sessionStopped
     * @function
     * @public
     */
    public set sessionStopped(func: (sender: ConversationTranscriptionHandler, event: SessionEventArgs) => void) {
        this.sessionStopped = func;
        if (!!this.privRecognizer) {
            this.privRecognizer.sessionStopped = function(s: any, e: SpeechRecognitionEventArgs): void { func(this, e); };
        }
    }

    /**
     * Gets the authorization token used to communicate with the service.
     * @member ConversationTranscriber.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * @member ConversationTranscriber.prototype.authorizationToken
     * @function
     * @public
     * @param {string} token - Authorization token.
     */
    public set authorizationToken(token: string) {
        Contracts.throwIfNullOrWhitespace(token, "token");
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, token);
    }

    /**
     * Gets the spoken language of recognition.
     * @member ConversationTranscriber.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} The spoken language of recognition.
     */
    public get speechRecognitionLanguage(): string {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    /**
     * Gets the output format of recognition.
     * @member ConversationTranscriber.prototype.outputFormat
     * @function
     * @public
     * @returns {OutputFormat} The output format of recognition.
     */
    public get outputFormat(): OutputFormat {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);

        if (this.properties.getProperty(OutputFormatPropertyName, OutputFormat[OutputFormat.Simple]) === OutputFormat[OutputFormat.Simple]) {
            return OutputFormat.Simple;
        } else {
            return OutputFormat.Detailed;
        }
    }

    /**
     * The collection of properties and their values defined for this ConversationTranscriber.
     * @member ConversationTranscriber.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this ConversationTranscriber.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Starts conversation transcription, until stopTranscribingAsync() is called.
     * User must subscribe to events to receive transcription results.
     * @member ConversationTranscriber.prototype.startTranscribingAsync
     * @function
     * @public
     * @param cb - Callback invoked once the transcription has started.
     * @param err - Callback invoked in case of an error.
     */
    public startTranscribingAsync(cb?: Callback, err?: Callback): void {
        this.privRecognizer.startContinuousRecognitionAsync(cb, err);
    }

    /**
     * Starts conversation transcription, until stopTranscribingAsync() is called.
     * User must subscribe to events to receive transcription results.
     * @member ConversationTranscriber.prototype.stopTranscribingAsync
     * @function
     * @public
     * @param cb - Callback invoked once the transcription has started.
     * @param err - Callback invoked in case of an error.
     */
    public stopTranscribingAsync(cb?: Callback, err?: Callback): void {
        this.privRecognizer.stopContinuousRecognitionAsync(cb, err);
    }

    /**
     * Leave the current conversation. After this is called, you will no longer receive any events.
     */
    public leaveConversationAsync(cb?: Callback, err?: Callback): void {
        this.privRecognizer.canceled = undefined;
        this.privRecognizer.recognizing = undefined;
        this.privRecognizer.recognized = undefined;
        this.privRecognizer.sessionStarted = undefined;
        this.privRecognizer.sessionStopped = undefined;
        marshalPromiseToCallbacks((async (): Promise<void> => { return; })(), cb, err);
    }

    /**
     * closes all external resources held by an instance of this class.
     * @member ConversationTranscriber.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, errorCb?: (error: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);
        marshalPromiseToCallbacks(this.dispose(true), cb, errorCb);
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
        }
    }
}
