// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ConnectionMessage, IStringDictionary, MessageType } from "../../common/Exports";

export class ConversationConnectionMessage extends ConnectionMessage {
    private privConversationMessageType: string;

    public constructor(
        messageType: MessageType,
        body: any,
        headers?: IStringDictionary<string>,
        id?: string) {
            super(messageType, body, headers, id);
            const json = JSON.parse(this.textBody);
            if (json.type !== undefined) {
                this.privConversationMessageType = json.type;
            }
    }

    public get conversationMessageType(): string {
        return this.privConversationMessageType;
    }
}
