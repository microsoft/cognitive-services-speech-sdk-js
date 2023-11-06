// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { PullAudioOutputStream } from "./Audio/AudioOutputStream.js";

interface IActivity {
    conversation?: any;
    id?: string;
    replyToId?: string;
    type?: string;
    text?: string;
    speak?: any;
}

/**
 * Defines contents of received message/events.
 * @class ActivityReceivedEventArgs
 */
export class ActivityReceivedEventArgs {
    private privActivity: IActivity;
    private privAudioStream: PullAudioOutputStream;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {any} activity - The activity..
     */
    public constructor(activity: any, audioStream?: PullAudioOutputStream) {
        this.privActivity = activity as IActivity;
        this.privAudioStream = audioStream;
    }

    /**
     * Gets the received activity
     * @member ActivityReceivedEventArgs.prototype.activity
     * @function
     * @public
     * @returns {any} the received activity.
     */
    public get activity(): any {
        return this.privActivity;
    }

    public get audioStream(): PullAudioOutputStream {
        return this.privAudioStream;
    }
}
