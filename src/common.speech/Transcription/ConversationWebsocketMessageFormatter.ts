// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionMessage,
    Deferred,
    IWebsocketMessageFormatter,
    MessageType,
    RawWebsocketMessage,
} from "../../common/Exports.js";
import { ConversationConnectionMessage } from "./ConversationConnectionMessage.js";

/**
 * Based off WebsocketMessageFormatter. The messages for Conversation Translator have some variations from the Speech messages.
 */
export class ConversationWebsocketMessageFormatter implements IWebsocketMessageFormatter {

    /**
     * Format incoming messages: text (speech partial/final, IM) or binary (tts)
     */
    public toConnectionMessage(message: RawWebsocketMessage): Promise<ConversationConnectionMessage> {
        const deferral = new Deferred<ConversationConnectionMessage>();

        try {
            if (message.messageType === MessageType.Text) {
                const incomingMessage: ConversationConnectionMessage = new ConversationConnectionMessage(message.messageType, message.textContent, {}, message.id);
                deferral.resolve(incomingMessage);
            } else if (message.messageType === MessageType.Binary) {
                deferral.resolve(new ConversationConnectionMessage(message.messageType, message.binaryContent, undefined, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. Error: ${e as string}`);
        }

        return deferral.promise;
    }

    /**
     * Format outgoing messages: text (commands or IM)
     */
    public fromConnectionMessage(message: ConnectionMessage): Promise<RawWebsocketMessage> {

        const deferral = new Deferred<RawWebsocketMessage>();

        try {
            if (message.messageType === MessageType.Text) {
                const payload = `${message.textBody ? message.textBody : ""}`;
                deferral.resolve(new RawWebsocketMessage(MessageType.Text, payload, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. ${e as string}`);
        }

        return deferral.promise;
    }
}
