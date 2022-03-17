// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

export enum ParticipantChangedReason {
    /** Participant has joined the conversation. */
    JoinedConversation,

    /** Participant has left the conversation. This could be voluntary, or involuntary
     * (e.g. they are experiencing networking issues).
     */
    LeftConversation,

    /** The participants' state has changed (e.g. they became muted, changed their nickname). */
    Updated
}
