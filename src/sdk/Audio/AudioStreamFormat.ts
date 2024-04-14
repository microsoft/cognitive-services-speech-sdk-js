// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// eslint-disable-next-line max-classes-per-file
export enum AudioFormatTag {
    PCM = 1,
    MuLaw,
    Siren,
    MP3,
    SILKSkype,
    OGG_OPUS,
    WEBM_OPUS,
    ALaw,
    FLAC,
    OPUS,
    AMR_WB,
    G722,
}

/**
 * Represents audio stream format used for custom audio input configurations.
 * @class AudioStreamFormat
 */
export abstract class AudioStreamFormat {
    /**
     * Creates an audio stream format object representing the default audio stream
     * format (16KHz 16bit mono PCM).
     * @member AudioStreamFormat.getDefaultInputFormat
     * @function
     * @public
     * @returns {AudioStreamFormat} The audio stream format being created.
     */
    public static getDefaultInputFormat(): AudioStreamFormat {
        return AudioStreamFormatImpl.getDefaultInputFormat();
    }

    /**
     * Creates an audio stream format object with the specified format characteristics.
     * @member AudioStreamFormat.getWaveFormat
     * @function
     * @public
     * @param {number} samplesPerSecond - Sample rate, in samples per second (Hertz).
     * @param {number} bitsPerSample - Bits per sample, typically 16.
     * @param {number} channels - Number of channels in the waveform-audio data. Monaural data
     * uses one channel and stereo data uses two channels.
     * @param {AudioFormatTag} format - Audio format (PCM, alaw or mulaw).
     * @returns {AudioStreamFormat} The audio stream format being created.
     */
    public static getWaveFormat(samplesPerSecond: number, bitsPerSample: number, channels: number, format: AudioFormatTag): AudioStreamFormat {
        return new AudioStreamFormatImpl(samplesPerSecond, bitsPerSample, channels, format);
    }

    /**
     * Creates an audio stream format object with the specified pcm waveformat characteristics.
     * @member AudioStreamFormat.getWaveFormatPCM
     * @function
     * @public
     * @param {number} samplesPerSecond - Sample rate, in samples per second (Hertz).
     * @param {number} bitsPerSample - Bits per sample, typically 16.
     * @param {number} channels - Number of channels in the waveform-audio data. Monaural data
     * uses one channel and stereo data uses two channels.
     * @returns {AudioStreamFormat} The audio stream format being created.
     */
    public static getWaveFormatPCM(samplesPerSecond: number, bitsPerSample: number, channels: number): AudioStreamFormat {
        return new AudioStreamFormatImpl(samplesPerSecond, bitsPerSample, channels);
    }

    /**
     * Explicitly frees any external resource attached to the object
     * @member AudioStreamFormat.prototype.close
     * @function
     * @public
     */
    public abstract close(): void;
}

/**
 * @private
 * @class AudioStreamFormatImpl
 */
export class AudioStreamFormatImpl extends AudioStreamFormat {
    protected privHeader: ArrayBuffer;

    /**
     * Creates an instance with the given values.
     * @constructor
     * @param {number} samplesPerSec - Samples per second.
     * @param {number} bitsPerSample - Bits per sample.
     * @param {number} channels - Number of channels.
     * @param {AudioFormatTag} format - Audio format (PCM, alaw or mulaw).
     */
    public constructor(samplesPerSec: number = 16000, bitsPerSample: number = 16, channels: number = 1, format: AudioFormatTag = AudioFormatTag.PCM) {
        super();

        let isWavFormat: boolean = true;
        /* 1 for PCM; 6 for alaw; 7 for mulaw */
        switch (format) {
            case AudioFormatTag.PCM:
                this.formatTag = 1;
                break;
            case AudioFormatTag.ALaw:
                this.formatTag = 6;
                break;
            case AudioFormatTag.MuLaw:
                this.formatTag = 7;
                break;
            default:
                isWavFormat = false;
        }
        this.bitsPerSample = bitsPerSample;
        this.samplesPerSec = samplesPerSec;
        this.channels = channels;
        this.avgBytesPerSec = this.samplesPerSec * this.channels * (this.bitsPerSample / 8);
        this.blockAlign = this.channels * Math.max(this.bitsPerSample, 8);

        if (isWavFormat) {
            this.privHeader = new ArrayBuffer(44);

            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/DataView
            const view = new DataView(this.privHeader);

            /* RIFF identifier */
            this.setString(view, 0, "RIFF");
            /* file length */
            view.setUint32(4, 0, true);
            /* RIFF type & Format */
            this.setString(view, 8, "WAVEfmt ");
            /* format chunk length */
            view.setUint32(16, 16, true);
            /* audio format */
            view.setUint16(20, this.formatTag, true);
            /* channel count */
            view.setUint16(22, this.channels, true);
            /* sample rate */
            view.setUint32(24, this.samplesPerSec, true);
            /* byte rate (sample rate * block align) */
            view.setUint32(28, this.avgBytesPerSec, true);
            /* block align (channel count * bytes per sample) */
            view.setUint16(32, this.channels * (this.bitsPerSample / 8), true);
            /* bits per sample */
            view.setUint16(34, this.bitsPerSample, true);
            /* data chunk identifier */
            this.setString(view, 36, "data");
            /* data chunk length */
            view.setUint32(40, 0, true);
        }
    }

    /**
     * Retrieves the default input format.
     * @member AudioStreamFormatImpl.getDefaultInputFormat
     * @function
     * @public
     * @returns {AudioStreamFormatImpl} The default input format.
     */
    public static getDefaultInputFormat(): AudioStreamFormatImpl {
        return new AudioStreamFormatImpl();
    }

    /**
     * Creates an audio context appropriate to current browser
     * @member AudioStreamFormatImpl.getAudioContext
     * @function
     * @public
     * @returns {AudioContext} An audio context instance
     */
    /* eslint-disable */
    public static getAudioContext(sampleRate?: number): AudioContext {
        // Workaround for Speech SDK bug in Safari.
        const AudioContext = (window as any).AudioContext // our preferred impl
            || (window as any).webkitAudioContext // fallback, mostly when on Safari
            || false; // could not find.

        // https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
        if (!!AudioContext) {
            if (sampleRate !== undefined && navigator.mediaDevices.getSupportedConstraints().sampleRate) {
                return new AudioContext({ sampleRate });
            } else {
                return new AudioContext();
            }
        } else {
            throw new Error("Browser does not support Web Audio API (AudioContext is not available).");
        }
    }
    /* eslint-enable */

    /**
     * Closes the configuration object.
     * @member AudioStreamFormatImpl.prototype.close
     * @function
     * @public
     */
    public close(): void {
        return;
    }

    /**
     * The format of the audio, valid values: 1 (PCM)
     * @member AudioStreamFormatImpl.prototype.formatTag
     * @function
     * @public
     */
    public formatTag: number;

    /**
     * The number of channels, valid values: 1 (Mono).
     * @member AudioStreamFormatImpl.prototype.channels
     * @function
     * @public
     */
    public channels: number;

    /**
     * The sample rate, valid values: 16000.
     * @member AudioStreamFormatImpl.prototype.samplesPerSec
     * @function
     * @public
     */
    public samplesPerSec: number;

    /**
     * The bits per sample, valid values: 16
     * @member AudioStreamFormatImpl.prototype.b
     * @function
     * @public
     */
    public bitsPerSample: number;

    /**
     * Average bytes per second, usually calculated as nSamplesPerSec * nChannels * ceil(wBitsPerSample, 8).
     * @member AudioStreamFormatImpl.prototype.avgBytesPerSec
     * @function
     * @public
     */
    public avgBytesPerSec: number;

    /**
     * The size of a single frame, valid values: nChannels * ceil(wBitsPerSample, 8).
     * @member AudioStreamFormatImpl.prototype.blockAlign
     * @function
     * @public
     */
    public blockAlign: number;

    public get header(): ArrayBuffer {
        return this.privHeader;
    }

    protected setString(view: DataView, offset: number, str: string): void {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }
}
