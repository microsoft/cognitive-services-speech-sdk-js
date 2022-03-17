// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Represents the JSON used in the agent.config message sent to the speech service.
 */
export class AgentConfig {
    private iPrivConfig: IAgentConfig;

    public toJsonString(): string {
        return JSON.stringify(this.iPrivConfig);
    }

    public get(): IAgentConfig {
        return this.iPrivConfig;
    }

    /**
     * Setter for the agent.config object.
     * @param value a JSON serializable object.
     */
    public set(value: IAgentConfig): void {
        this.iPrivConfig = value;
    }
}

export interface IAgentConfig {
    botInfo: {
        commType: string;
        connectionId: string;
        conversationId: string;
        fromId: string;
        commandsCulture: string;
        ttsAudioFormat: string;
    };
    version: number;
}
