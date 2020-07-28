// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAuthentication,
    IConnectionFactory,
    OutputFormatPropertyName,
    RecognitionMode,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig,
    TranscriberConnectionFactory,
    TranscriptionServiceRecognizer,
} from "../common.speech/Exports";
import { marshalPromiseToCallbacks } from "../common/Exports";
import { AudioConfigImpl } from "./Audio/AudioConfig";
import { Contracts } from "./Contracts";
import {
    AudioConfig,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    Recognizer,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs,
    SpeechRecognitionResult,
    SpeechTranslationConfig,
    SpeechTranslationConfigImpl,
} from "./Exports";
import { Conversation, ConversationImpl } from "./Transcription/Exports";

/**
 * Performs conversation transcription from file, or other audio input streams, and gets transcribed text as result.
 * @class ConversationTranscriber
 */
export class ConversationTranscriber extends Recognizer {
    private privConversation: Conversation;
    private privDisposedRecognizer: boolean;

    /**
     * ConversationTranscriber constructor.
     * @constructor
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    private constructor(conversation: Conversation, audioConfig?: AudioConfig) {
        Contracts.throwIfNull(conversation, "Conversation");
        const speechTranslationConfigImpl: SpeechTranslationConfigImpl = conversation.config as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(speechTranslationConfigImpl, "conversationConfig");

        Contracts.throwIfNullOrWhitespace(
            speechTranslationConfigImpl.speechRecognitionLanguage,
            PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

        super(audioConfig, speechTranslationConfigImpl.properties, new TranscriberConnectionFactory());
        this.privDisposedRecognizer = false;
    }

    /**
     * ConversationTranscriber constructor.
     * @constructor
     * @param {Conversation} conversation - Initial conversation to recognize
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    public static FromConversation(conversation: Conversation, audioConfig?: AudioConfig): ConversationTranscriber {
        const recognizer = new ConversationTranscriber(conversation, audioConfig);
        return recognizer;
    }

    /**
     * ConversationTranscriber constructor.
     * @constructor
     * @param {Conversation} converation - conversation to be recognized
     */
    public JoinConversationAsync(conversation: Conversation): void {
        Contracts.throwIfNull(conversation, "Conversation");
        const speechTranslationConfigImpl: SpeechTranslationConfigImpl = conversation.config as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(speechTranslationConfigImpl, "speechConfig");
        Contracts.throwIfNullOrWhitespace(
            speechTranslationConfigImpl.speechRecognitionLanguage,
            PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

        this.privProperties = speechTranslationConfigImpl.properties.clone();
        this.setAuthFromProperties();
        this.privConversation = conversation;
    }
    /**
     * The event recognizing signals that an intermediate recognition result is received.
     * @member ConversationTranscriber.prototype.recognizing
     * @function
     * @public
     */
    public recognizing: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void;

    /**
     * The event recognized signals that a final recognition result is received.
     * @member ConversationTranscriber.prototype.recognized
     * @function
     * @public
     */
    public recognized: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void;

    /**
     * The event canceled signals that an error occurred during recognition.
     * @member ConversationTranscriber.prototype.canceled
     * @function
     * @public
     */
    public canceled: (sender: Recognizer, event: SpeechRecognitionCanceledEventArgs) => void;

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
     * Starts speech recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     *       so it is suitable only for single shot recognition
     *       like command or query. For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member ConversationTranscriber.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the SpeechRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    public recognizeOnceAsync(cb?: (e: SpeechRecognitionResult) => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.recognizeOnceAsyncImpl(RecognitionMode.Interactive), cb, err);
    }

    /**
     * Starts speech recognition, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * @member ConversationTranscriber.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    public startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.startContinuousRecognitionAsyncImpl(RecognitionMode.Conversation), cb, err);
    }

    /**
     * Stops continuous speech recognition.
     * @member ConversationTranscriber.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    public stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.stopContinuousRecognitionAsyncImpl(), cb, err);
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
     * get conversation information from conversation member
     * @return {object} conversation info
     */
    public get conversationSpeechEvent(): any {
        Contracts.throwIfNull(this.privConversation, "Conversation");
        return (this.privConversation as ConversationImpl).speechEventStart;
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
            await this.privConversation.deleteConversationAsync();
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
