// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { AgentConfig } from "../common.speech/Exports.js";
import { EventType, PlatformEvent } from "./PlatformEvent.js";

export class DialogEvent extends PlatformEvent {

    public constructor(eventName: string, eventType: EventType = EventType.Info) {
        super(eventName, eventType);
    }
}

export class SendingAgentContextMessageEvent extends DialogEvent {
    private privAgentConfig: AgentConfig;

    public constructor(agentConfig: AgentConfig) {
        super("SendingAgentContextMessageEvent");
        this.privAgentConfig = agentConfig;
    }

    public get agentConfig(): AgentConfig {
        return this.privAgentConfig;
    }
}
