// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PullAudioOutputStream } from "./Audio/AudioOutputStream";

/**
 * Defines contents of received message/events.
 * @class ActivityReceivedEventArgs
 */
export class ActivityReceivedEventArgs {
    private privActivity: any;
    private privAudioStream: PullAudioOutputStream;
    private privPayload: ArrayBuffer;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {any} activity - The activity..
     */
    public constructor(activity: any, audioStream?: PullAudioOutputStream, payload?: ArrayBuffer) {
        this.privActivity = activity;
        this.privAudioStream = audioStream;
        this.privPayload = payload;
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

    public get payload(): ArrayBuffer {
        return this.privPayload;
    }
}
