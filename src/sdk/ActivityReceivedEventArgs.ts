// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines contents of received message/events.
 * @class ActivityReceivedEventArgs
 */
export class ActivityReceivedEventArgs {
    private privActivity: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} activity - The activity..
     */
    public constructor(activity: string) {
        this.privActivity = activity;
    }

    /**
     * Gets the received activity
     * @member ActivityReceivedEventArgs.prototype.activity
     * @function
     * @public
     * @returns {string} the received activity.
     */
    public get activity(): string {
        return this.privActivity;
    }
}
