import { IAuthentication, IConnectionFactory, PlatformConfig, RecognitionMode, RecognizerConfig, ServiceRecognizerBase } from "../common.speech/Exports";
import { AudioConfig, KeywordRecognitionModel, OutputFormat, PropertyCollection, Recognizer, SpeechRecognitionCanceledEventArgs, SpeechRecognitionEventArgs, SpeechRecognitionResult } from "./Exports";
import { SpeechConfig } from "./SpeechConfig";
/**
 * Performs speech recognition from microphone, file, or other audio input streams, and gets transcribed text as result.
 * @class SpeechRecognizer
 */
export declare class SpeechRecognizer extends Recognizer {
    private privDisposedSpeechRecognizer;
    private privProperties;
    /**
     * SpeechRecognizer constructor.
     * @constructor
     * @param {SpeechConfig} speechConfig - An set of initial properties for this recognizer
     * @param {AudioConfig} audioConfig - An optional audio configuration associated with the recognizer
     */
    constructor(speechConfig: SpeechConfig, audioConfig?: AudioConfig);
    /**
     * The event recognizing signals that an intermediate recognition result is received.
     * @member SpeechRecognizer.prototype.recognizing
     * @function
     * @public
     */
    recognizing: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void;
    /**
     * The event recognized signals that a final recognition result is received.
     * @member SpeechRecognizer.prototype.recognized
     * @function
     * @public
     */
    recognized: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void;
    /**
     * The event canceled signals that an error occurred during recognition.
     * @member SpeechRecognizer.prototype.canceled
     * @function
     * @public
     */
    canceled: (sender: Recognizer, event: SpeechRecognitionCanceledEventArgs) => void;
    /**
     * Gets the endpoint id of a customized speech model that is used for speech recognition.
     * @member SpeechRecognizer.prototype.endpointId
     * @function
     * @public
     * @returns {string} the endpoint id of a customized speech model that is used for speech recognition.
     */
    readonly endpointId: string;
    /**
     * Sets the authorization token used to communicate with the service.
     * @member SpeechRecognizer.prototype.authorizationToken
     * @function
     * @public
     * @param {string} token - Authorization token.
     */
    /**
    * Gets the authorization token used to communicate with the service.
    * @member SpeechRecognizer.prototype.authorizationToken
    * @function
    * @public
    * @returns {string} Authorization token.
    */
    authorizationToken: string;
    /**
     * Gets the spoken language of recognition.
     * @member SpeechRecognizer.prototype.speechRecognitionLanguage
     * @function
     * @public
     * @returns {string} The spoken language of recognition.
     */
    readonly speechRecognitionLanguage: string;
    /**
     * Gets the output format of recognition.
     * @member SpeechRecognizer.prototype.outputFormat
     * @function
     * @public
     * @returns {OutputFormat} The output format of recognition.
     */
    readonly outputFormat: OutputFormat;
    /**
     * The collection of properties and their values defined for this SpeechRecognizer.
     * @member SpeechRecognizer.prototype.properties
     * @function
     * @public
     * @returns {PropertyCollection} The collection of properties and their values defined for this SpeechRecognizer.
     */
    readonly properties: PropertyCollection;
    /**
     * Starts speech recognition, and stops after the first utterance is recognized.
     * The task returns the recognition text as result.
     * Note: RecognizeOnceAsync() returns when the first utterance has been recognized,
     *       so it is suitable only for single shot recognition
     *       like command or query. For long-running recognition, use StartContinuousRecognitionAsync() instead.
     * @member SpeechRecognizer.prototype.recognizeOnceAsync
     * @function
     * @public
     * @param cb - Callback that received the SpeechRecognitionResult.
     * @param err - Callback invoked in case of an error.
     */
    recognizeOnceAsync(cb?: (e: SpeechRecognitionResult) => void, err?: (e: string) => void): void;
    /**
     * Starts speech recognition, until stopContinuousRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * @member SpeechRecognizer.prototype.startContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    startContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
    /**
     * Stops continuous speech recognition.
     * @member SpeechRecognizer.prototype.stopContinuousRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    stopContinuousRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
    /**
     * Starts speech recognition with keyword spotting, until
     * stopKeywordRecognitionAsync() is called.
     * User must subscribe to events to receive recognition results.
     * Note: Key word spotting functionality is only available on the
     *      Speech Devices SDK. This functionality is currently not included in the SDK itself.
     * @member SpeechRecognizer.prototype.startKeywordRecognitionAsync
     * @function
     * @public
     * @param {KeywordRecognitionModel} model The keyword recognition model that
     *        specifies the keyword to be recognized.
     * @param cb - Callback invoked once the recognition has started.
     * @param err - Callback invoked in case of an error.
     */
    startKeywordRecognitionAsync(model: KeywordRecognitionModel, cb?: () => void, err?: (e: string) => void): void;
    /**
     * Stops continuous speech recognition.
     * Note: Key word spotting functionality is only available on the
     *       Speech Devices SDK. This functionality is currently not included in the SDK itself.
     * @member SpeechRecognizer.prototype.stopKeywordRecognitionAsync
     * @function
     * @public
     * @param cb - Callback invoked once the recognition has stopped.
     * @param err - Callback invoked in case of an error.
     */
    stopKeywordRecognitionAsync(cb?: () => void, err?: (e: string) => void): void;
    /**
     * closes all external resources held by an instance of this class.
     * @member SpeechRecognizer.prototype.close
     * @function
     * @public
     */
    close(): void;
    /**
     * Disposes any resources held by the object.
     * @member SpeechRecognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - true if disposing the object.
     */
    protected dispose(disposing: boolean): void;
    protected createRecognizerConfig(speechConfig: PlatformConfig, recognitionMode: RecognitionMode): RecognizerConfig;
    protected createServiceRecognizer(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioConfig: AudioConfig, recognizerConfig: RecognizerConfig): ServiceRecognizerBase;
    private privReco;
    private implCloseExistingRecognizer;
}
