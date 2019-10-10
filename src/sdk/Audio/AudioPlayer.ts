// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioStreamFormat, PullAudioInputStreamCallback } from "../Exports";
import { AudioStreamFormatImpl } from "./AudioStreamFormat";

/**
 * Audio player
 * @class
 */
export class AudioPlayer {

    private audioContext: AudioContext;
    private gainNode: GainNode;
    private audioFormat: AudioStreamFormat;


    /**
     * Creates and initializes an instance of this class.
     * @constructor
     */
    private constructor() {
    }    

    private createAudioContext() : void {
        var audioContextOptions = {
                latencyHint: "interactive",
                sampleRate: 44100,
            }

        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1;        
    }

    public static create() : AudioPlayer {
        return new AudioPlayer();
    }

    public setAudioSource() : void {

    }







}