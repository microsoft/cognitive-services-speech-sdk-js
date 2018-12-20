import { IAuthentication, IConnectionFactory, PlatformConfig, RecognitionMode, RecognizerConfig, ServiceRecognizerBase } from "../common.speech/Exports";
import { AudioConfig, PropertyCollection, RecognitionEventArgs, SessionEventArgs, SpeechRecognitionResult } from "./Exports";
/**
 * Defines the base class Recognizer which mainly contains common event handlers.
 * @class Recognizer
 */
export declare abstract class Recognizer {
    private privDisposed;
    protected audioConfig: AudioConfig;
    /**
     * Creates and initializes an instance of a Recognizer
     * @constructor
     * @param {AudioConfig} audioInput - An optional audio input stream associated with the recognizer
     */
    protected constructor(audioConfig: AudioConfig);
    /**
     * Defines event handler for session started events.
     * @member Recognizer.prototype.sessionStarted
     * @function
     * @public
     */
    sessionStarted: (sender: Recognizer, event: SessionEventArgs) => void;
    /**
     * Defines event handler for session stopped events.
     * @member Recognizer.prototype.sessionStopped
     * @function
     * @public
     */
    sessionStopped: (sender: Recognizer, event: SessionEventArgs) => void;
    /**
     * Defines event handler for speech started events.
     * @member Recognizer.prototype.speechStartDetected
     * @function
     * @public
     */
    speechStartDetected: (sender: Recognizer, event: RecognitionEventArgs) => void;
    /**
     * Defines event handler for speech stopped events.
     * @member Recognizer.prototype.speechEndDetected
     * @function
     * @public
     */
    speechEndDetected: (sender: Recognizer, event: RecognitionEventArgs) => void;
    /**
     * Dispose of associated resources.
     * @member Recognizer.prototype.close
     * @function
     * @public
     */
    close(): void;
    /**
     * This method performs cleanup of resources.
     * The Boolean parameter disposing indicates whether the method is called
     * from Dispose (if disposing is true) or from the finalizer (if disposing is false).
     * Derived classes should override this method to dispose resource if needed.
     * @member Recognizer.prototype.dispose
     * @function
     * @public
     * @param {boolean} disposing - Flag to request disposal.
     */
    protected dispose(disposing: boolean): void;
    /**
     * This method returns the current state of the telemetry setting.
     * @member Recognizer.prototype.telemetryEnabled
     * @function
     * @public
     * @returns true if the telemetry is enabled, false otherwise.
     */
    static readonly telemetryEnabled: boolean;
    /**
     * This method globally enables or disables telemetry.
     * @member Recognizer.prototype.enableTelemetry
     * @function
     * @public
     * @param enabled - Global setting for telemetry collection.
     * If set to true, telemetry information like microphone errors,
     * recognition errors are collected and sent to Microsoft.
     * If set to false, no telemetry is sent to Microsoft.
     */
    static enableTelemetry(enabled: boolean): void;
    protected abstract createRecognizerConfig(speecgConfig: PlatformConfig, recognitionMode: RecognitionMode): RecognizerConfig;
    protected abstract createServiceRecognizer(authentication: IAuthentication, connectionFactory: IConnectionFactory, audioConfig: AudioConfig, recognizerConfig: RecognizerConfig): ServiceRecognizerBase;
    protected implRecognizerSetup(recognitionMode: RecognitionMode, speechProperties: PropertyCollection, audioConfig: AudioConfig, speechConnectionFactory: IConnectionFactory): ServiceRecognizerBase;
    protected implRecognizerStart(recognizer: ServiceRecognizerBase, successCallback: (e: SpeechRecognitionResult) => void, errorCallback: (e: string) => void, speechContext?: string): void;
}
