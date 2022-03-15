// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * Defines the payload for incoming websocket commands
 */
export interface ICommandResponsePayload {
    type: string;
    command?: string;
    id?: string; // incoming ws
    nickname?: string; // incoming ws
    participantId?: string;
    roomid?: string;
    value: boolean | number | string;
    token?: string;
}

const parseCommandResponse = (json: string): ICommandResponsePayload => JSON.parse(json) as ICommandResponsePayload;

export class CommandResponsePayload implements ICommandResponsePayload {
    private privCommandResponse: ICommandResponsePayload;

    public constructor(json: string) {
        this.privCommandResponse = parseCommandResponse(json);
    }

    public get type(): string {
        return this.privCommandResponse.type;
    }
    public get command(): string {
        return this.privCommandResponse.command;
    }
    public get id(): string {
        return this.privCommandResponse.id;
    }
    public get nickname(): string {
        return this.privCommandResponse.nickname;
    }
    public get participantId(): string {
        return this.privCommandResponse.participantId;
    }
    public get roomid(): string {
        return this.privCommandResponse.roomid;
    }
    public get value(): boolean | number | string {
        return this.privCommandResponse.value;
    }
    public get token(): string {
        return this.privCommandResponse.token;
    }

    public static fromJSON(json: string): CommandResponsePayload {
        return new CommandResponsePayload(json);
    }

}
