import { AudioStreamFormat } from "../../../src/sdk/Exports";
import { AudioSourceEvent, EventSource, IAudioSource, IAudioStreamNode, Promise } from "../../common/Exports";
import { AudioInputStream, PullAudioInputStreamCallback } from "../Exports";
/**
 * Represents audio input configuration used for specifying what type of input to use (microphone, file, stream).
 * @class AudioConfig
 */
export declare abstract class AudioConfig {
    /**
     * Creates an AudioConfig object representing the default microphone on the system.
     * @member AudioConfig.fromDefaultMicrophoneInput
     * @function
     * @public
     * @returns {AudioConfig} The audio input configuration being created.
     */
    static fromDefaultMicrophoneInput(): AudioConfig;
    /**
     * Creates an AudioConfig object representing a microphone on the system based on the specified constraints.
     * @member AudioConfig.fromMicrophoneInput
     * @function
     * @public
     * @param {MediaStreamConstraints} constraints A MediaStreamConstraints object specifying the requirements for microphone media device.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    static fromMicrophoneInput(constraints?: MediaStreamConstraints): AudioConfig;
    /**
     * Creates an AudioConfig object representing the specified file.
     * @member AudioConfig.fromWavFileInput
     * @function
     * @public
     * @param {File} fileName - Specifies the audio input file. Currently, only WAV / PCM with 16-bit
     *        samples, 16 kHz sample rate, and a single channel (Mono) is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    static fromWavFileInput(file: File): AudioConfig;
    /**
     * Creates an AudioConfig object representing the specified stream.
     * @member AudioConfig.fromStreamInput
     * @function
     * @public
     * @param {AudioInputStream | PullAudioInputStreamCallback} audioStream - Specifies the custom audio input
     *        stream. Currently, only WAV / PCM with 16-bit samples, 16 kHz sample rate, and a single channel
     *        (Mono) is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    static fromStreamInput(audioStream: AudioInputStream | PullAudioInputStreamCallback): AudioConfig;
    /**
     * Explicitly frees any external resource attached to the object
     * @member AudioConfig.prototype.close
     * @function
     * @public
     */
    abstract close(): void;
}
/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class AudioConfigImpl
 */
export declare class AudioConfigImpl extends AudioConfig implements IAudioSource {
    private privSource;
    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {IAudioSource} source - An audio source.
     */
    constructor(source: IAudioSource);
    /**
     * Format information for the audio
     */
    readonly format: AudioStreamFormat;
    /**
     * @member AudioConfigImpl.prototype.close
     * @function
     * @public
     */
    close(): void;
    /**
     * @member AudioConfigImpl.prototype.id
     * @function
     * @public
     */
    id(): string;
    /**
     * @member AudioConfigImpl.prototype.turnOn
     * @function
     * @public
     * @returns {Promise<boolean>} A promise.
     */
    turnOn(): Promise<boolean>;
    /**
     * @member AudioConfigImpl.prototype.attach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     * @returns {Promise<IAudioStreamNode>} A promise.
     */
    attach(audioNodeId: string): Promise<IAudioStreamNode>;
    /**
     * @member AudioConfigImpl.prototype.detach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     */
    detach(audioNodeId: string): void;
    /**
     * @member AudioConfigImpl.prototype.turnOff
     * @function
     * @public
     * @returns {Promise<boolean>} A promise.
     */
    turnOff(): Promise<boolean>;
    /**
     * @member AudioConfigImpl.prototype.events
     * @function
     * @public
     * @returns {EventSource<AudioSourceEvent>} An event source for audio events.
     */
    readonly events: EventSource<AudioSourceEvent>;
}
