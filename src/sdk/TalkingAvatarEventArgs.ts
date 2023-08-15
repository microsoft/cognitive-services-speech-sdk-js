// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export enum TalkingAvatarEventTypes {
    SwitchedToSpeaking = "SwitchedToSpeaking",
    SwitchedToIdle = "SwitchedToIdle",
    SessionClosed = "SessionClosed",
}

/**
 * Defines content for talking avatar events.
 * @class TalkingAvatarEventArgs
 * Added in version 1.32.0
 *
 * @experimental This feature is experimental and might change or have limited support.
 */
export class TalkingAvatarEventArgs {
    private privType: TalkingAvatarEventTypes;
    private privOffset: number;

    /**
     * The type of the event.
     * @public
     * @returns {TalkingAvatarEventTypes} The type of the event.
     */
    public get type(): TalkingAvatarEventTypes {
        return this.privType;
    }

    /**
     * The time offset associated with this event.
     * @public
     * @returns {number} The time offset associated with this event.
     */
    public get offset(): number {
        return this.privOffset;
    }
}
