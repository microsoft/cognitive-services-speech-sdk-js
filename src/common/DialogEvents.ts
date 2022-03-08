// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { AgentConfig } from "../common.speech/Exports";
import { EventType, PlatformEvent } from "./PlatformEvent";

export class DialogEvent extends PlatformEvent {

    constructor(eventName: string, eventType: EventType = EventType.Info) {
        super(eventName, eventType);
    }
}

export class SendingAgentContextMessageEvent extends DialogEvent {
    private privAgentConfig: AgentConfig;

    constructor(agentConfig: AgentConfig) {
        super("SendingAgentContextMessageEvent");
        this.privAgentConfig = agentConfig;
    }

    public get agentConfig(): AgentConfig {
        return this.privAgentConfig;
    }
}
