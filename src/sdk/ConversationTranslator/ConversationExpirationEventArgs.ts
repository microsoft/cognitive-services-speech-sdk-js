// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { SessionEventArgs } from "../Exports";

export class ConversationExpirationEventArgs extends SessionEventArgs {
    private privExpirationTime: number;

    constructor(expirationTime: number, sessionId?: string) {
        super(sessionId);
        this.privExpirationTime = expirationTime;
    }

    /** How much longer until the conversation expires (in minutes). */
    get expirationTime(): number {
        return this.privExpirationTime;
    }
}
