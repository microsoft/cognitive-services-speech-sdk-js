// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InvalidOperationError } from "../../common/Error.js";
import { AudioStreamFormat } from "../Exports.js";
import { AudioStreamFormatImpl } from "./AudioStreamFormat.js";

type AudioDataTypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array;
/**
 * Base audio player class
 * TODO: Plays only PCM for now.
 * @class
 */
export class BaseAudioPlayer {

    private audioContext: AudioContext = null;
    private gainNode: GainNode = null;
    private audioFormat: AudioStreamFormatImpl;
    private autoUpdateBufferTimer: any = 0;
    private samples: Float32Array;
    private startTime: number;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {AudioStreamFormat} audioFormat audio stream format recognized by the player.
     */
    public constructor(audioFormat?: AudioStreamFormat) {
        if (audioFormat === undefined) {
            audioFormat = AudioStreamFormat.getDefaultInputFormat();
        }
        this.init(audioFormat);
    }

    /**
     * play Audio sample
     * @param newAudioData audio data to be played.
     */
    public playAudioSample(newAudioData: ArrayBuffer, cb?: () => void, err?: (error: string) => void): void {
        try {
            this.ensureInitializedContext();
            const audioData = this.formatAudioData(newAudioData);
            const newSamplesData = new Float32Array(this.samples.length + audioData.length);
            newSamplesData.set(this.samples, 0);
            newSamplesData.set(audioData, this.samples.length);
            this.samples = newSamplesData;
            if (!!cb) {
                cb();
            }
        } catch (e) {
            if (!!err) {
                err(e as string);
            }
        }
    }

    /**
     * stops audio and clears the buffers
     */
    public stopAudio(cb?: () => void, err?: (error: string) => void): void {
        if (this.audioContext !== null) {
            this.samples = new Float32Array();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            clearInterval(this.autoUpdateBufferTimer);
            this.audioContext.close().then((): void => {
                if (!!cb) {
                    cb();
                }
            }, (error: string): void => {
                if (!!err) {
                    err(error);
                }
            });
            this.audioContext = null;
        }
    }

    private init(audioFormat: AudioStreamFormat): void {
        this.audioFormat = audioFormat as AudioStreamFormatImpl;
        this.samples = new Float32Array();
    }

    private ensureInitializedContext(): void {
        if (this.audioContext === null) {
            this.createAudioContext();
            const timerPeriod = 200;
            this.autoUpdateBufferTimer = setInterval((): void => {
                this.updateAudioBuffer();
            }, timerPeriod);
        }
    }

    private createAudioContext(): void {
        // new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        this.audioContext = AudioStreamFormatImpl.getAudioContext();

        // TODO: Various examples shows this gain node, it does not seem to be needed unless we plan
        // to control the volume, not likely
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1;
        this.gainNode.connect(this.audioContext.destination);
        this.startTime = this.audioContext.currentTime;
    }

    private formatAudioData(audioData: ArrayBuffer): Float32Array {
        switch (this.audioFormat.bitsPerSample) {
            case 8:
                return this.formatArrayBuffer(new Int8Array(audioData), 128);
            case 16:
                return this.formatArrayBuffer(new Int16Array(audioData), 32768);
            case 32:
                return this.formatArrayBuffer(new Int32Array(audioData), 2147483648);
            default:
                throw new InvalidOperationError("Only WAVE_FORMAT_PCM (8/16/32 bps) format supported at this time");
        }
    }

    private formatArrayBuffer(audioData: AudioDataTypedArray, maxValue: number): Float32Array {
        const float32Data = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            float32Data[i] = audioData[i] / maxValue;
        }
        return float32Data;
    }

    private updateAudioBuffer(): void {
        if (this.samples.length === 0) {
            return;
        }

        const channelCount = this.audioFormat.channels;
        const bufferSource = this.audioContext.createBufferSource();
        const frameCount = this.samples.length / channelCount;
        const audioBuffer = this.audioContext.createBuffer(channelCount, frameCount, this.audioFormat.samplesPerSec);

        // TODO: Should we do the conversion in the pushAudioSample instead?
        for (let channel = 0; channel < channelCount; channel++) {
            // Fill in individual channel data
            let channelOffset = channel;
            const audioData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < this.samples.length; i++, channelOffset += channelCount) {
                audioData[i] = this.samples[channelOffset];
            }
        }

        if (this.startTime < this.audioContext.currentTime) {
            this.startTime = this.audioContext.currentTime;
        }

        bufferSource.buffer = audioBuffer;
        bufferSource.connect(this.gainNode);
        bufferSource.start(this.startTime);

        // Make sure we play the next sample after the current one.
        this.startTime += audioBuffer.duration;

        // Clear the samples for the next pushed data.
        this.samples = new Float32Array();
    }

    private async playAudio(audioData: ArrayBuffer): Promise<void> {
        if (this.audioContext === null) {
            this.createAudioContext();
        }
        const source: AudioBufferSourceNode = this.audioContext.createBufferSource();
        const destination: AudioDestinationNode = this.audioContext.destination;
        await this.audioContext.decodeAudioData(audioData, (newBuffer: AudioBuffer): void => {
            source.buffer = newBuffer;
            source.connect(destination);
            source.start(0);
        });
    }
}
