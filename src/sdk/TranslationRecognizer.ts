// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    AutoDetectSourceLanguagesOpenRangeOptionName,
    IAuthentication,
    IConnectionFactory,
    RecognizerConfig,
    ServiceRecognizerBase,
    SpeechServiceConfig,
    TranslationConnectionFactory,
    TranslationServiceRecognizer
} from "../common.speech/Exports.js";
import { RecognitionMode } from "../common.speech/ServiceMessages/PhraseDetection/PhraseDetectionContext.js";
import { marshalPromiseToCallbacks } from "../common/Exports.js";
import { AudioConfigImpl } from "./Audio/AudioConfig.js";
import { Connection } from "./Connection.js";
import { Contracts } from "./Contracts.js";
import {
    AudioConfig,
    AutoDetectSourceLanguageConfig,
    PropertyCollection,
    PropertyId,
    Recognizer,
    TranslationRecognitionCanceledEventArgs,
    TranslationRecognitionEventArgs,
    TranslationRecognitionResult,
    TranslationSynthesisEventArgs
} from "./Exports.js";
import { SpeechTranslationConfig, SpeechTranslationConfigImpl } from "./SpeechTranslationConfig.js";

/**
 * Translation recognizer
 * @class TranslationRecognizer
 */
export class TranslationRecognizer extends Recognizer {
    /**
     * The event recognizing signals that an intermediate recognition result is received.
     * @member TranslationRecognizer.prototype.recognizing
     * @function
     * @public
     */
    public recognizing: (sender: TranslationRecognizer, event: TranslationRecognitionEventArgs) => void;

    /**
     * The event recognized signals that a final recognition result is received.
     * @member TranslationRecognizer.prototype.recognized
     * @function
     * @public
     */
    public recognized: (sender: TranslationRecognizer, event: TranslationRecognitionEventArgs) => void;

    /**
     * The event canceled signals that an error occurred during recognition.
     * @member TranslationRecognizer.prototype.canceled
     * @function
     * @public
     */
    public canceled: (sender: TranslationRecognizer, event: TranslationRecognitionCanceledEventArgs) => void;

    /**
     * The event synthesizing signals that a translation synthesis result is received.
     * @member TranslationRecognizer.prototype.synthesizing
     * @function
     * @public
     */
    public synthesizing: (sender: TranslationRecognizer, event: TranslationSynthesisEventArgs) => void;

    private privDisposedTranslationRecognizer: boolean;

    /**
     * Initializes an instance of the TranslationRecognizer.
     * @constructor
     * @param {SpeechTranslationConfig} speechConfig - Set of properties to configure this recognizer.
     * @param {AudioConfig} audioConfig - An optional audio config associated with the recognizer
     * @param {IConnectionFactory} connectionFactory - An optional connection factory to use to generate the endpoint URIs, headers to set, etc...
     */
    public constructor(speechConfig: SpeechTranslationConfig, audioConfig?: AudioConfig, connectionFactory?: IConnectionFactory) {
        const configImpl = speechConfig as SpeechTranslationConfigImpl;
        Contracts.throwIfNull(configImpl, "speechConfig");

        super(audioConfig, configImpl.properties, connectionFactory || new TranslationConnectionFactory(), speechConfig.tokenCredential);

        this.privDisposedTranslationRecognizer = false;

        if (this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice, undefined) !== undefined) {
            Contracts.throwIfNullOrWhitespace(
                this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice),
                PropertyId[PropertyId.SpeechServiceConnection_TranslationVoice]);
        }

        Contracts.throwIfNullOrWhitespace(
            this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages),
            PropertyId[PropertyId.SpeechServiceConnection_TranslationToLanguages]);

        Contracts.throwIfNullOrWhitespace(this.properties.getProperty(
            PropertyId.SpeechServiceConnection_RecoLanguage),
            PropertyId[PropertyId.SpeechServiceConnection_RecoLanguage]);

    }

    /**
     * TranslationRecognizer constructor.
     * @constructor
     * @param {SpeechTranslationConfig} speechTranslationConfig - an set of initial properties for this recognizer
     * @param {AutoDetectSourceLanguageConfig} autoDetectSourceLanguageConfig - An source language detection configuration associated with the recognizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    public static FromConfig(speechTranslationConfig: SpeechTranslationConfig, autoDetectSourceLanguageConfig: AutoDetectSourceLanguageConfig, audioConfig?: AudioConfig): TranslationRecognizer {
        const speechTranslationConfigImpl: SpeechTranslationConfigImpl = speechTranslationConfig as SpeechTranslationConfigImpl;
        autoDetectSourceLanguageConfig.properties.mergeTo(speechTranslationConfigImpl.properties);

        if (autoDetectSourceLanguageConfig.properties.getProperty(PropertyId.SpeechServiceConnection_AutoDetectSourceLanguages, undefined) === AutoDetectSourceLanguagesOpenRangeOptionName) {
            speechTranslationConfigImpl.properties.setProperty(PropertyId.SpeechServiceConnection_RecoLanguage, "en-US");
        }
        return new TranslationRecognizer(speechTranslationConfig, audioConfig);
    }

    /**
     * Gets the language name that was set when the recognizer was created.
     * @member TranslationRecognizer.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} Gets the language name that was set when the recognizer was created.
     */
    public get speechRecognitionLanguage(): string {
        Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_RecoLanguage);
    }

    /**
     * Gets target languages for translation that were set when the recognizer was created.
     * The language is specified in BCP-47 format. The translation will provide translated text for each of language.
     * @member TranslationRecognizer.prototype.targetLanguages
     * @function
     * @public
     * @returns {string[]} Gets target languages for translation that were set when the recognizer was created.
     */
    public get targetLanguages(): string[] {
        Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
    }

    /**
     * Gets the name of output voice.
     * @member TranslationRecognizer.prototype.voiceName
     * @function
     * @public
     * @returns {string} the name of output voice.
     */
    public get voiceName(): string {
        Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);

        return this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationVoice, undefined);
    }

    /**
     * The collection of properties and their values defined for this TranslationRecognizer.
     * @member TranslationRecognizer.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this TranslationRecognizer.
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Gets the authorization token used to communicate with the service.
     * @member TranslationRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    public get authorizationToken(): string {
        return this.properties.getProperty(PropertyId.SpeechServiceAuthorization_Token);
    }

    /**
     * Gets/Sets the authorization token used to communicate with the service.
     * @member TranslationRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @param {string} value - Authorization token.
     */
    public set authorizationToken(value: string) {
        this.properties.setProperty(PropertyId.SpeechServiceAuthorization_Token, value);
    }

    /**
     * Starts recognition and translation, and stops after the first utterance is recognized.
     * The task returns the translation text as result.
     * Note: recognizeOnceAsync returns when the first utterance has been recognized, so it is suitable only
     * for single shot recognition like command or query. For long-running recognition,
     * use startContinuousRecognitionAsync() instead.
     * @member TranslationRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the result when the translation has completed.
     * @param err - Callback invoked in case of an error.
     */
    public recognizeOnceAsync(cb?: (e: TranslationRecognitionResult) => void, err?: (e: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
        marshalPromiseToCallbacks(this.recognizeOnceAsyncImpl(RecognitionMode.Interactive), cb, err);
    }

    /**
     * Starts recognition and translation, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive translation results.
     * @member TranslationRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has started.
     * @param err - Callback invoked in case of an error.
     */
    public startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.startContinuousRecognitionAsyncImpl(RecognitionMode.Conversation), cb, err);
    }

    /**
     * Stops continuous recognition and translation.
     * @member TranslationRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has stopped.
     * @param err - Callback invoked in case of an error.
     */
    public stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void {
        marshalPromiseToCallbacks(this.stopContinuousRecognitionAsyncImpl(), cb, err);
    }

    /**
     * dynamically remove a language from list of target language
     * (can be used while recognition is ongoing)
     * @member TranslationRecognizer.prototype.removeTargetLanguage
     * @function
     * @param lang - language to be removed
     * @public
     */
    public removeTargetLanguage(lang: string): void {
        Contracts.throwIfNullOrUndefined(lang, "language to be removed");
        if (this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, undefined) !== undefined) {
            const languages: string[] = this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
            const index: number = languages.indexOf(lang);
            if (index > -1) {
                languages.splice(index, 1);
                this.properties.setProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, languages.join(","));
                this.updateLanguages(languages);
            }
        }
    }

    /**
     * dynamically add a language to list of target language
     * (can be used while recognition is ongoing)
     * @member TranslationRecognizer.prototype.addTargetLanguage
     * @function
     * @param lang - language to be added
     * @public
     */
    public addTargetLanguage(lang: string): void {
        Contracts.throwIfNullOrUndefined(lang, "language to be added");
        let languages: string[] = [];
        if (this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, undefined) !== undefined) {
            languages = this.properties.getProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages).split(",");
            if (!languages.includes(lang)) {
                languages.push(lang);
                this.properties.setProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, languages.join(","));
            }
        } else {
            this.properties.setProperty(PropertyId.SpeechServiceConnection_TranslationToLanguages, lang);
            languages = [lang];
        }
        this.updateLanguages(languages);
    }

    /**
     * closes all external resources held by an instance of this class.
     * @member TranslationRecognizer.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, errorCb?: (error: string) => void): void {
        Contracts.throwIfDisposed(this.privDisposedTranslationRecognizer);
        marshalPromiseToCallbacks(this.dispose(true), cb, errorCb);
    }

    /**
     * handles ConnectionEstablishedEvent for conversation translation scenarios.
     * @member TranslationRecognizer.prototype.onConnection
     * @function
     * @public
     */
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public onConnection(): void { }

    protected async dispose(disposing: boolean): Promise<void> {
        if (this.privDisposedTranslationRecognizer) {
            return;
        }

        this.privDisposedTranslationRecognizer = true;

        if (disposing) {
            await this.implRecognizerStop();
            await super.dispose(disposing);
        }
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

        return new TranslationServiceRecognizer(authentication, connectionFactory, configImpl, recognizerConfig, this);
    }

    private updateLanguages(languages: string[]): void {
        const conn: Connection = Connection.fromRecognizer(this);
        if (!!conn) {
            conn.setMessageProperty("speech.context", "translationcontext", { to: languages });
            conn.sendMessageAsync("event", JSON.stringify({
                id: "translation",
                name: "updateLanguage",
                to: languages
            }));
        }
    }

}
