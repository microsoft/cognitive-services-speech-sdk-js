// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    IAuthentication,
    IConnectionFactory,
    OutputFormatPropertyName,
    RecognizerConfig,
    ServiceRecognizerBase,
    // SpeechConnectionFactory,
    ConversationTranscriberConnectionFactory,
    SpeechServiceConfig,
    ConversationTranscriptionServiceRecognizer,
} from "../../common.speech/Exports.js";
import { RecognitionMode } from "../../common.speech/ServiceMessages/PhraseDetection/PhraseDetectionContext.js";
import { marshalPromiseToCallbacks } from "../../common/Exports.js";
import { AudioConfigImpl } from "../Audio/AudioConfig.js";
import { Contracts } from "../Contracts.js";
import {
    AudioConfig,
    AutoDetectSourceLanguageConfig,
    ConversationTranscriptionEventArgs,
    ConversationTranscriptionCanceledEventArgs,
    OutputFormat,
    PropertyCollection,
    PropertyId,
    Recognizer,
} from "../Exports.js";
import { SpeechConfig, SpeechConfigImpl } from "../SpeechConfig.js";

/**
 * Performs speech recognition with speaker separation from microphone, file, or other audio input streams, and gets transcribed text as result.
 * @class ConversationTranscriber
 */
export class ConversationTranscriber extends Recognizer {
    private privDisposedRecognizer: boolean;

    /**
     * ConversationTranscriber constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - an set of initial properties for this recognizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    public constructor(speechConfig: SpeechConfig, audioConfig?: AudioConfig) {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        Contracts.throwIfNull(speechConfigImpl, "speechConfig");

        Contracts.throwIfNullOrWhitespace(
            speechConfigImpl.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage),
            PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

        super(audioConfig, speechConfigImpl.properties, new ConversationTranscriberConnectionFactory(), speechConfig.tokenCredential);
        this.privProperties.setProperty(PropertyId.SpeechServiceConnection_RecognitionEndpointVersion, "2");
        this.privDisposedRecognizer = false;
    }

    /**
     * ConversationTranscriber constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - an set of initial properties for this recognizer
     * @param {AutoDetectSourceLanguageConfig} autoDetectSourceLanguageConfig - An source language detection configuration associated with the recognizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    public static FromConfig(speechConfig: SpeechConfig, autoDetectSourceLanguageConfig: AutoDetectSourceLanguageConfig, audioConfig?: AudioConfig): ConversationTranscriber {
        const speechConfigImpl: SpeechConfigImpl = speechConfig as SpeechConfigImpl;
        autoDetectSourceLanguageConfig.properties.mergeTo(speechConfigImpl.properties);
        const recognizer = new ConversationTranscriber(speechConfig, audioConfig);
        return recognizer;
    }

    /**
     * The event transcribing signals that an intermediate transcription result is received.
     * @member ConversationTranscriber.prototype.transcribing
     * @function
     * @public
     */
    public transcribing: (sender: Recognizer, event: ConversationTranscriptionEventArgs) => void;

    /**
     * The event transcriber signals that a final recognition result is received.
     * @member ConversationTranscriber.prototype.transcribed
     * @function
     * @public
     */
    public transcribed: (sender: Recognizer, event: ConversationTranscriptionEventArgs) => void;

    /**
     * The event canceled signals that an error occurred during transcription.
     * @member ConversationTranscriber.prototype.canceled
     * @function
     * @public
     */
    public canceled: (sender: Recognizer, event: ConversationTranscriptionCanceledEventArgs) => void;

    /**
     * Gets the endpoint id of a customized speech model that is used for transcription.
     * @member ConversationTranscriber.prototype.endpointId
     * @function
     * @public
     * @returns {string} the endpoint id of a customized speech model that is used for speech recognition.
     */
    public get endpointId(): string {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_EndpointId, "00000000-0000-0000-0000-000000000000");
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
     * Gets the spoken language of transcription.
     * @member ConversationTranscriber.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} The spoken language of transcription.
     */
    public get speechRecognitionLanguage(): string {
        Contracts.throwIfDisposed(this.privDisposedRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    /**
     * Gets the output format of transcription.
     * @member ConversationTranscriber.prototype.outputFormat
     * @function
     * @public
     * @returns {OutputFormat} The output format of transcription.
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
     * The collection of properties and their values defined for this conversation transcriber.
     * @member ConversationTranscriber.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this SpeechRecognizer.
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
    public startTranscribingAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.startContinuousRecognitionAsyncImpl(RecognitionMode.Conversation), cb, err);
    }

    /**
     * Stops conversation transcription.
     * @member ConversationTranscriber.prototype.stopTranscribingAsync
     * @function
     * @public
     * @param cb - Callback invoked once the transcription has stopped.
     * @param err - Callback invoked in case of an error.
     */
    public stopTranscribingAsync(cb?: () => void, err?: (e: string) => void): void {
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
     * Disposes any resources held by the object.
     * @member SpeechRecognizer.prototype.dispose
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
        return new RecognizerConfig(speechConfig, this.privProperties);
    }

    protected createServiceRecognizer(
        authentication: IAuthentication,
        connectionFactory: IConnectionFactory,
        audioConfig: AudioConfig,
        recognizerConfig: RecognizerConfig): ServiceRecognizerBase {
        const configImpl: AudioConfigImpl = audioConfig as AudioConfigImpl;
        recognizerConfig.isSpeakerDiarizationEnabled = true;
        return new ConversationTranscriptionServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    }
}
