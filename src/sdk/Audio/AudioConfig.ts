// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { PathLike } from "fs";
import {
    FileAudioSource,
    MicAudioSource,
    PcmRecorder,
} from "../../common.browser/Exports.js";
import { ISpeechConfigAudioDevice } from "../../common.speech/Exports.js";
import {
    AudioSourceEvent,
    EventSource,
    IAudioDestination,
    IAudioSource,
    IAudioStreamNode
} from "../../common/Exports.js";
import { Contracts } from "../Contracts.js";
import {
    AudioInputStream,
    AudioOutputStream,
    AudioStreamFormat,
    IPlayer,
    PullAudioInputStreamCallback,
    PullAudioOutputStream,
    PushAudioOutputStream,
    PushAudioOutputStreamCallback,
    SpeakerAudioDestination
} from "../Exports.js";
import { AudioFileWriter } from "./AudioFileWriter.js";
import { PullAudioInputStreamImpl, PushAudioInputStreamImpl } from "./AudioInputStream.js";
import { PullAudioOutputStreamImpl, PushAudioOutputStreamImpl } from "./AudioOutputStream.js";
import { AudioStreamFormatImpl } from "./AudioStreamFormat.js";

/**
 * Represents audio input configuration used for specifying what type of input to use (microphone, file, stream).
 * @class AudioConfig
 * Updated in version 1.11.0
 */
export abstract class AudioConfig {
    /**
     * Creates an AudioConfig object representing the default microphone on the system.
     * @member AudioConfig.fromDefaultMicrophoneInput
     * @function
     * @public
     * @returns {AudioConfig} The audio input configuration being created.
     */
    public static fromDefaultMicrophoneInput(): AudioConfig {
        const pcmRecorder = new PcmRecorder(true);
        return new AudioConfigImpl(new MicAudioSource(pcmRecorder));
    }

    /**
     * Creates an AudioConfig object representing a microphone with the specified device ID.
     * @member AudioConfig.fromMicrophoneInput
     * @function
     * @public
     * @param {string | undefined} deviceId - Specifies the device ID of the microphone to be used.
     * Default microphone is used the value is omitted.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    public static fromMicrophoneInput(deviceId?: string): AudioConfig {
        const pcmRecorder = new PcmRecorder(true);
        return new AudioConfigImpl(new MicAudioSource(pcmRecorder, deviceId));
    }

    /**
     * Creates an AudioConfig object representing the specified file.
     * @member AudioConfig.fromWavFileInput
     * @function
     * @public
     * @param {File} fileName - Specifies the audio input file. Currently, only WAV / PCM is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    public static fromWavFileInput(file: File | Buffer, name: string = "unnamedBuffer.wav"): AudioConfig {
        return new AudioConfigImpl(new FileAudioSource(file, name));
    }

    /**
     * Creates an AudioConfig object representing the specified stream.
     * @member AudioConfig.fromStreamInput
     * @function
     * @public
     * @param {AudioInputStream | PullAudioInputStreamCallback | MediaStream} audioStream - Specifies the custom audio input
     * stream. Currently, only WAV / PCM is supported.
     * @returns {AudioConfig} The audio input configuration being created.
     */
    public static fromStreamInput(audioStream: AudioInputStream | PullAudioInputStreamCallback
        | MediaStream): AudioConfig {
        if (audioStream instanceof PullAudioInputStreamCallback) {
            return new AudioConfigImpl(new PullAudioInputStreamImpl(audioStream));
        }

        if (audioStream instanceof AudioInputStream) {
            return new AudioConfigImpl(audioStream as PushAudioInputStreamImpl);
        }
        if (typeof MediaStream !== "undefined" && audioStream instanceof MediaStream) {
            const pcmRecorder = new PcmRecorder(false);
            return new AudioConfigImpl(new MicAudioSource(pcmRecorder, null, null, audioStream));
        }

        throw new Error("Not Supported Type");
    }

    /**
     * Creates an AudioConfig object representing the default speaker.
     * @member AudioConfig.fromDefaultSpeakerOutput
     * @function
     * @public
     * @returns {AudioConfig} The audio output configuration being created.
     * Added in version 1.11.0
     */
    public static fromDefaultSpeakerOutput(): AudioConfig {
        return new AudioOutputConfigImpl(new SpeakerAudioDestination());
    }

    /**
     * Creates an AudioConfig object representing the custom IPlayer object.
     * You can use the IPlayer object to control pause, resume, etc.
     * @member AudioConfig.fromSpeakerOutput
     * @function
     * @public
     * @param {IPlayer} player - the IPlayer object for playback.
     * @returns {AudioConfig} The audio output configuration being created.
     * Added in version 1.12.0
     */
    public static fromSpeakerOutput(player?: IPlayer): AudioConfig {
        if (player === undefined) {
            return AudioConfig.fromDefaultSpeakerOutput();
        }
        if (player instanceof SpeakerAudioDestination) {
            return new AudioOutputConfigImpl(player);
        }

        throw new Error("Not Supported Type");
    }

    /**
     * Creates an AudioConfig object representing a specified output audio file
     * @member AudioConfig.fromAudioFileOutput
     * @function
     * @public
     * @param {PathLike} filename - the filename of the output audio file
     * @returns {AudioConfig} The audio output configuration being created.
     * Added in version 1.11.0
     */
    public static fromAudioFileOutput(filename: PathLike): AudioConfig {
        return new AudioOutputConfigImpl(new AudioFileWriter(filename));
    }

    /**
     * Creates an AudioConfig object representing a specified audio output stream
     * @member AudioConfig.fromStreamOutput
     * @function
     * @public
     * @param {AudioOutputStream | PushAudioOutputStreamCallback} audioStream - Specifies the custom audio output
     * stream.
     * @returns {AudioConfig} The audio output configuration being created.
     * Added in version 1.11.0
     */
    public static fromStreamOutput(audioStream: AudioOutputStream | PushAudioOutputStreamCallback): AudioConfig {
        if (audioStream instanceof PushAudioOutputStreamCallback) {
            return new AudioOutputConfigImpl(new PushAudioOutputStreamImpl(audioStream));
        }

        if (audioStream instanceof PushAudioOutputStream) {
            return new AudioOutputConfigImpl(audioStream as PushAudioOutputStreamImpl);
        }

        if (audioStream instanceof PullAudioOutputStream) {
            return new AudioOutputConfigImpl(audioStream as PullAudioOutputStreamImpl);
        }

        throw new Error("Not Supported Type");
    }

    /**
     * Explicitly frees any external resource attached to the object
     * @member AudioConfig.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;

    /**
     * Sets an arbitrary property.
     * @member SpeechConfig.prototype.setProperty
     * @function
     * @public
     * @param {string} name - The name of the property to set.
     * @param {string} value - The new value of the property.
     */
    public abstract setProperty(name: string, value: string): void;

    /**
     * Returns the current value of an arbitrary property.
     * @member SpeechConfig.prototype.getProperty
     * @function
     * @public
     * @param {string} name - The name of the property to query.
     * @param {string} def - The value to return in case the property is not known.
     * @returns {string} The current value, or provided default, of the given property.
     */
    public abstract getProperty(name: string, def?: string): string;

}

/**
 * Represents audio input stream used for custom audio input configurations.
 * @private
 * @class AudioConfigImpl
 */
export class AudioConfigImpl extends AudioConfig implements IAudioSource {
    private privSource: IAudioSource;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {IAudioSource} source - An audio source.
     */
    public constructor(source: IAudioSource) {
        super();
        this.privSource = source;
    }

    /**
     * Format information for the audio
     */
    public get format(): Promise<AudioStreamFormatImpl> {
        return this.privSource.format;
    }

    /**
     * @member AudioConfigImpl.prototype.close
     * @function
     * @public
     */
    public close(cb?: () => void, err?: (error: string) => void): void {
        this.privSource.turnOff().then((): void => {
            if (!!cb) {
                cb();
            }
        }, (error: string): void => {
            if (!!err) {
                err(error);
            }
        });
    }

    /**
     * @member AudioConfigImpl.prototype.id
     * @function
     * @public
     */
    public id(): string {
        return this.privSource.id();
    }

    /**
     * @member AudioConfigImpl.prototype.turnOn
     * @function
     * @public
     * @returns {Promise<void>} A promise.
     */
    public turnOn(): Promise<void> {
        return this.privSource.turnOn();
    }

    /**
     * @member AudioConfigImpl.prototype.attach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     * @returns {Promise<IAudioStreamNode>} A promise.
     */
    public attach(audioNodeId: string): Promise<IAudioStreamNode> {
        return this.privSource.attach(audioNodeId);
    }

    /**
     * @member AudioConfigImpl.prototype.detach
     * @function
     * @public
     * @param {string} audioNodeId - The audio node id.
     */
    public detach(audioNodeId: string): void {
        return this.privSource.detach(audioNodeId);
    }

    /**
     * @member AudioConfigImpl.prototype.turnOff
     * @function
     * @public
     * @returns {Promise<void>} A promise.
     */
    public turnOff(): Promise<void> {
        return this.privSource.turnOff();
    }

    /**
     * @member AudioConfigImpl.prototype.events
     * @function
     * @public
     * @returns {EventSource<AudioSourceEvent>} An event source for audio events.
     */
    public get events(): EventSource<AudioSourceEvent> {
        return this.privSource.events;
    }

    public setProperty(name: string, value: string): void {
        Contracts.throwIfNull(value, "value");

        if (undefined !== this.privSource.setProperty) {
            this.privSource.setProperty(name, value);
        } else {
            throw new Error("This AudioConfig instance does not support setting properties.");
        }

    }

    public getProperty(name: string, def?: string): string {
        if (undefined !== this.privSource.getProperty) {
            return this.privSource.getProperty(name, def);
        } else {
            throw new Error("This AudioConfig instance does not support getting properties.");
        }

        return def;
    }

    public get deviceInfo(): Promise<ISpeechConfigAudioDevice> {
        return this.privSource.deviceInfo;
    }
}

export class AudioOutputConfigImpl extends AudioConfig implements IAudioDestination {
    private privDestination: IAudioDestination;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {IAudioDestination} destination - An audio destination.
     */
    public constructor(destination: IAudioDestination) {
        super();
        this.privDestination = destination;
    }

    public set format(format: AudioStreamFormat) {
        this.privDestination.format = format;
    }

    public write(buffer: ArrayBuffer): void {
        this.privDestination.write(buffer);
    }

    public close(): void {
        this.privDestination.close();
    }

    public id(): string {
        return this.privDestination.id();
    }

    public setProperty(): void {
        throw new Error("This AudioConfig instance does not support setting properties.");
    }

    public getProperty(): string {
        throw new Error("This AudioConfig instance does not support getting properties.");
    }
}
