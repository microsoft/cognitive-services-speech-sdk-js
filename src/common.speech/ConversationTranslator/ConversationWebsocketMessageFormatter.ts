// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionMessage,
    Deferred,
    IStringDictionary,
    IWebsocketMessageFormatter,
    MessageType,
    Promise,
    RawWebsocketMessage,
} from "../../common/Exports";
import { ConversationConnectionMessage } from "./ConversationConnectionMessage";

/**
 * Based off WebsocketMessageFormatter. The messages for Conversation Translator have some variations from the Speech messages.
 */
export class ConversationWebsocketMessageFormatter implements IWebsocketMessageFormatter {

    /**
     * Format incoming messages: text (speech partial/final, IM) or binary (tts)
     */
    public toConnectionMessage = (message: RawWebsocketMessage): Promise<ConversationConnectionMessage> => {
        const deferral = new Deferred<ConversationConnectionMessage>();

        try {
            if (message.messageType === MessageType.Text) {
                const incomingMessage: ConversationConnectionMessage = new ConversationConnectionMessage(message.messageType, message.textContent, {}, message.id);
                deferral.resolve(incomingMessage);
            } else if (message.messageType === MessageType.Binary) {
                const binaryMessage: ArrayBuffer = message.binaryContent;
                let body: ArrayBuffer = null;

                if (!binaryMessage || binaryMessage.byteLength < 2) {
                    throw new Error("Invalid binary message format. Header length missing.");
                }

                const dataView = new DataView(binaryMessage);
                const headerLength = dataView.getInt16(0);

                if (binaryMessage.byteLength < headerLength + 2) {
                    throw new Error("Invalid binary message format. Header content missing.");
                }

                if (binaryMessage.byteLength > headerLength + 2) {
                    body = binaryMessage.slice(2 + headerLength);
                }

                deferral.resolve(new ConversationConnectionMessage(message.messageType, body, undefined, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. Error: ${e}`);
        }

        return deferral.promise();
    }

    /**
     * Format outgoing messages: text (commands or IM)
     */
    public fromConnectionMessage = (message: ConnectionMessage): Promise<RawWebsocketMessage> => {

        const deferral = new Deferred<RawWebsocketMessage>();

        try {
            if (message.messageType === MessageType.Text) {
                const payload = `${message.textBody ? message.textBody : ""}`;
                deferral.resolve(new RawWebsocketMessage(MessageType.Text, payload, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. ${e}`);
        }

        return deferral.promise();
    }
}
