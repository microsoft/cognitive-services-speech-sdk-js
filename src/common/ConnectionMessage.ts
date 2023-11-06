/* eslint-disable @typescript-eslint/no-unsafe-return */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { InvalidOperationError } from "./Error.js";
import { createNoDashGuid } from "./Guid.js";
import { IStringDictionary } from "./IDictionary.js";

export enum MessageType {
    Text,
    Binary,
}

export class ConnectionMessage {

    private privMessageType: MessageType;
    private privHeaders: IStringDictionary<string>;
    private privBody: any = null;
    private privSize: number;

    private privId: string;

    public constructor(
        messageType: MessageType,
        body: any,
        headers?: IStringDictionary<string>,
        id?: string) {

        if (messageType === MessageType.Text && body && !(typeof (body) === "string")) {
            throw new InvalidOperationError("Payload must be a string");
        }

        if (messageType === MessageType.Binary && body && !(body instanceof ArrayBuffer)) {
            throw new InvalidOperationError("Payload must be ArrayBuffer");
        }

        this.privMessageType = messageType;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.privBody = body;
        this.privHeaders = headers ? headers : {};
        this.privId = id ? id : createNoDashGuid();
        switch (this.messageType) {
            case MessageType.Binary:
                this.privSize = this.binaryBody !== null ? this.binaryBody.byteLength : 0;
                break;
            case MessageType.Text:
                this.privSize = this.textBody.length;
        }
    }

    public get messageType(): MessageType {
        return this.privMessageType;
    }

    public get headers(): IStringDictionary<string> {
        return this.privHeaders;
    }

    public get body(): any {
        return this.privBody;
    }

    public get textBody(): string {
        if (this.privMessageType === MessageType.Binary) {
            throw new InvalidOperationError("Not supported for binary message");
        }

        return this.privBody as string;
    }

    public get binaryBody(): ArrayBuffer {
        if (this.privMessageType === MessageType.Text) {
            throw new InvalidOperationError("Not supported for text message");
        }

        return this.privBody;
    }

    public get id(): string {
        return this.privId;
    }
}
