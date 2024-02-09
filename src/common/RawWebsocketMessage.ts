/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { MessageType } from "./ConnectionMessage.js";
import { ArgumentNullError, InvalidOperationError } from "./Error.js";
import { createNoDashGuid } from "./Guid.js";

export class RawWebsocketMessage {
    private privMessageType: MessageType;
    private privPayload: any = null;
    private privId: string;

    public constructor(messageType: MessageType, payload: any, id?: string) {
        if (!payload) {
            throw new ArgumentNullError("payload");
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (messageType === MessageType.Binary && Object.getPrototypeOf(payload).constructor.name !== "ArrayBuffer") {
            throw new InvalidOperationError("Payload must be ArrayBuffer");
        }

        if (messageType === MessageType.Text && !(typeof (payload) === "string")) {
            throw new InvalidOperationError("Payload must be a string");
        }

        this.privMessageType = messageType;
        this.privPayload = payload;
        this.privId = id ? id : createNoDashGuid();
    }

    public get messageType(): MessageType {
        return this.privMessageType;
    }

    public get payload(): any {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return this.privPayload;
    }

    public get textContent(): string {
        if (this.privMessageType === MessageType.Binary) {
            throw new InvalidOperationError("Not supported for binary message");
        }

        return this.privPayload as string;
    }

    public get binaryContent(): ArrayBuffer {
        if (this.privMessageType === MessageType.Text) {
            throw new InvalidOperationError("Not supported for text message");
        }

        return this.privPayload as ArrayBuffer;
    }

    public get id(): string {
        return this.privId;
    }
}
