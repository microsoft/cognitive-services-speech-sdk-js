// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
// Multi-device Conversation is a Preview feature.

import { SessionEventArgs } from "../Exports.js";
import { ParticipantChangedReason } from "./Exports.js";
import { IParticipant } from "./IParticipant.js";

export class ConversationParticipantsChangedEventArgs extends SessionEventArgs {
    private privReason: ParticipantChangedReason;
    private privParticipant: IParticipant[];

    public constructor(reason: ParticipantChangedReason, participants: IParticipant[], sessionId?: string) {
        super(sessionId);
        this.privReason = reason;
        this.privParticipant = participants;
    }

    public get reason(): ParticipantChangedReason {
        return this.privReason;
    }

    public get participants(): IParticipant[] {
        return this.privParticipant;
    }
}
