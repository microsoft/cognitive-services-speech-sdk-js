import { IAuthentication, IConnectionFactory, PlatformConfig, RecognitionMode, RecognizerConfig, ServiceRecognizerBase } from "../common.speech/Exports";
import { AudioConfig, PropertyCollection, Recognizer, TranslationRecognitionCanceledEventArgs, TranslationRecognitionEventArgs, TranslationRecognitionResult, TranslationSynthesisEventArgs } from "./Exports";
import { SpeechTranslationConfig } from "./SpeechTranslationConfig";
/**
 * Translation recognizer
 * @class TranslationRecognizer
 */
export declare class TranslationRecognizer extends Recognizer {
    private privDisposedTranslationRecognizer;
    private privProperties;
    /**
     * Initializes an instance of the TranslationRecognizer.
     * @constructor
     * @param {SpeechTranslationConfig} speechConfig - Set of properties to configure this recognizer.
     * @param {AudioConfig} audioConfig - An optional audio config associated with the recognizer
     */
    constructor(speechConfig: SpeechTranslationConfig, audioConfig?: AudioConfig);
    /**
     * The event recognizing signals that an intermediate recognition result is received.
     * @member TranslationRecognizer.prototype.recognizing
     * @function
     * @public
     */
    recognizing: (sender: TranslationRecognizer, event: TranslationRecognitionEventArgs) => void;
    /**
     * The event recognized signals that a final recognition result is received.
     * @member TranslationRecognizer.prototype.recognized
     * @function
     * @public
     */
    recognized: (sender: TranslationRecognizer, event: TranslationRecognitionEventArgs) => void;
    /**
     * The event canceled signals that an error occurred during recognition.
     * @member TranslationRecognizer.prototype.canceled
     * @function
     * @public
     */
    canceled: (sender: TranslationRecognizer, event: TranslationRecognitionCanceledEventArgs) => void;
    /**
     * The event synthesizing signals that a translation synthesis result is received.
     * @member TranslationRecognizer.prototype.synthesizing
     * @function
     * @public
     */
    synthesizing: (sender: TranslationRecognizer, event: TranslationSynthesisEventArgs) => void;
    /**
     * Gets the language name that was set when the recognizer was created.
     * @member TranslationRecognizer.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} Gets the language name that was set when the recognizer was created.
     */
    readonly speechRecognitionLanguage: string;
    /**
     * Gets target languages for translation that were set when the recognizer was created.
     * The language is specified in BCP-47 format. The translation will provide translated text for each of language.
     * @member TranslationRecognizer.prototype.targetLanguages
     * @function
     * @public
     * @returns {string[]} Gets target languages for translation that were set when the recognizer was created.
     */
    readonly targetLanguages: string[];
    /**
     * Gets the name of output voice.
     * @member TranslationRecognizer.prototype.voiceName
     * @function
     * @public
     * @returns {string} the name of output voice.
     */
    readonly voiceName: string;
    /**
     * Gets the authorization token used to communicate with the service.
     * @member TranslationRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @returns {string} Authorization token.
     */
    /**
    * Sets the authorization token used to communicate with the service.
    * @member TranslationRecognizer.prototype.authorizationToken
    * @function
    * @public
    * @param {string} value - Authorization token.
    */
    authorizationToken: string;
    /**
     * The collection of properties and their values defined for this TranslationRecognizer.
     * @member TranslationRecognizer.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this TranslationRecognizer.
     */
    readonly properties: PropertyCollection;
    /**
     * Starts recognition and translation, and stops after the first utterance is recognized.
     * The task returns the translation text as result.
     * Note: recognizeOnceAsync returns when the first utterance has been recognized, so it is suitableonly
     *       for single shot recognition like command or query. For long-running recognition,
     *       use startContinuousRecognitionAsync() instead.
     * @member TranslationRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the result when the translation has completed.
     * @param err - Callback invoked in case of an error.
     */
    recognizeOnceAsync(cb?: (e: TranslationRecognitionResult) => void, err?: (e: string) => void): void;
    /**
     * Starts recognition and translation, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive translation results.
     * @member TranslationRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has started.
     * @param err - Callback invoked in case of an error.
     */
    startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
    /**
     * Stops continuous recognition and translation.
     * @member TranslationRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback that received the translation has stopped.
     * @param err - Callback invoked in case of an error.
     */
    stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
    /**
     * closes all external resources held by an instance of this class.
     * @member TranslationRecognizer.prototype.close
     * @function
     * @public
     */
    close(): void;
    protected dispose(disposing: boolean): boolean;
    protected createRecognizerConfig(speechConfig: PlatformConfig, recognitionMode: RecognitionMode): RecognizerConfig;
    protected createServiceRecognizer(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioConfig: AudioConfig, recognizerConfig: RecognizerConfig): ServiceRecognizerBase;
    private privReco;
    private implCloseExistingRecognizer;
}
