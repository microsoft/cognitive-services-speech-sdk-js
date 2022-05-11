// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */
import { IIntentEntity } from "../common.speech/Exports";
import { PullAudioOutputStream } from "./Audio/AudioOutputStream";

export interface ChannelAccount {
    aadObjectId?: string;
    id: string;
    name: string;
    role?: string;
}

export interface ConversationAccount extends ChannelAccount {
    conversationType: string;
    isGroup: boolean;
    properties?: any;
    tenantId?: string;
}

export interface IActivity {
    channelData?: any;
    channelId: string;
    conversation: ConversationAccount;
    entities?: IIntentEntity[];
    from: ChannelAccount;
    id?: string;
    localTimestamp?: Date;
    replyToId?: string;
    serviceUrl: string;
    timestamp?: Date;
    type?: string;
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
