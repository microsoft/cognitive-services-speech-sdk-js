// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConnectionMessage, IStringDictionary, MessageType } from "../../common/Exports.js";

export class ConversationConnectionMessage extends ConnectionMessage {
    private privConversationMessageType: string;

    public constructor(
        messageType: MessageType,
        body: any,
        headers?: IStringDictionary<string>,
        id?: string) {
            super(messageType, body, headers, id);
            const json: { type: string } = JSON.parse(this.textBody) as { type: string };
            if (json.type !== undefined) {
                this.privConversationMessageType = json.type;
            }
    }

    public get conversationMessageType(): string {
        return this.privConversationMessageType;
    }
}
