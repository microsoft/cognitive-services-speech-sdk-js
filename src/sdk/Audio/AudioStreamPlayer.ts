// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PromiseResult } from "../../common/Promise";
import { Queue } from "../../common/Queue";
import { PullAudioOutputStream } from "./AudioOutputStream";
import { BaseAudioPlayer } from "./BaseAudioPlayer";

/**
 * @abstract
 * @public
 * @class {AudioStreamPlayer}
 */
export abstract class AudioStreamPlayer {

    /**
     * Crea tes and initializes an instance.
     * @constructor
     */
    protected constructor() { }

    /**
     * Creates a AudioStreamPlayer to play the oudio output from the TTS stream of an activity
     * @member AudioStreamPlayer.create
     * @function
     * @public
     * @returns {AudioStreamPlayer} The audio stream player.
     */
    public static create(): AudioStreamPlayer {
        return new AudioStreamPlayerImpl();
    }

    /**
     * Queues audio stream for playing.
     * @param {PullAudioOutputStream} audioStream
     */
    public abstract playAudioStream(audioStream: PullAudioOutputStream): void;

    /**
     * Skip the playing stream.
     *
     * @abstract
     * @memberof AudioStreamPlayer
     */
    public abstract skipStream(): void;

    /**
     * Stops the playing stream and empties the queue.
     *
     * @abstract
     * @memberof AudioStreamPlayer
     */
    public abstract stop(): void;
}

/**
 * Audio stream player implmentation.
 * @class AudioStreamPlayerImpl
 */
// tslint:disable-next-line:max-classes-per-file
export class AudioStreamPlayerImpl extends AudioStreamPlayer {

    private privAudioStreamQueue: Queue<PullAudioOutputStream>;
    private privBasePlayer: BaseAudioPlayer;

    /**
     * Creates and initializes an instance.
     * @constructor
     */
    public constructor() {
        super();
        this.privAudioStreamQueue = new Queue<PullAudioOutputStream>();
    }

    /**
     *
     * @param audioStream audio stream to play
     */
    public playAudioStream(audioStream: PullAudioOutputStream): void {
        this.privAudioStreamQueue.enqueue(audioStream);
        if (this.privAudioStreamQueue.length() === 1) {
            this.startPlaying();
        }

        return;
    }

    /**
     * Stops the current playing stream and starts the next one in queue if any.
     *
     * @memberof AudioStreamPlayer
     */
    public skipStream(): void {

    }

    /**
     * Stops the playing stream and empties the queue.
     *
     * @memberof AudioStreamPlayer
     */
    public stop(): void {

    }

    /**
     *
     *
     * @memberof AudioStreamPlayerImpl
     */
    private startPlaying(): void {
        if (this.privAudioStreamQueue.length() === 0) {
            return;
        }

        const currentStream = this.privAudioStreamQueue.peek()
            .continueWith((stream: PromiseResult<PullAudioOutputStream>) => {
                stream.result.read();
            });
    }

    private playLoop(stream: PullAudioOutputStream): void {
        stream.read().onSuccessContinueWith((readResult: ArrayBuffer) => {
            if (readResult != null) {
                this.privBasePlayer.playAudioSample(readResult);
                this.playLoop(stream);
            } else {
                this.privAudioStreamQueue.dequeue();
            }
        });
    }
}
