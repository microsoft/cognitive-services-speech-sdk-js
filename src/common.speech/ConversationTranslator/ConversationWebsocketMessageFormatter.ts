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

const CRLF: string = "\r\n";

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
                let headers: IStringDictionary<string> = {};
                let body: ArrayBuffer = null;

                if (!binaryMessage || binaryMessage.byteLength < 2) {
                    throw new Error("Invalid binary message format. Header length missing.");
                }

                const dataView = new DataView(binaryMessage);
                const headerLength = dataView.getInt16(0);

                if (binaryMessage.byteLength < headerLength + 2) {
                    throw new Error("Invalid binary message format. Header content missing.");
                }

                let headersString = "";
                for (let i = 0; i < headerLength; i++) {
                    headersString += String.fromCharCode((dataView).getInt8(i + 2));
                }

                headers = this.parseHeaders(headersString);

                if (binaryMessage.byteLength > headerLength + 2) {
                    body = binaryMessage.slice(2 + headerLength);
                }

                deferral.resolve(new ConversationConnectionMessage(message.messageType, body, headers, message.id));
            } else {
                // tslint:disable-next-line: no-console
                // console.log("UNSUPPORTED MESSAGE TYPE");
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
                const payload = `${this.makeHeaders(message)}${CRLF}${message.textBody ? message.textBody : ""}`;

                deferral.resolve(new RawWebsocketMessage(MessageType.Text, payload, message.id));

            } else if (message.messageType === MessageType.Binary) {
                const headersString = this.makeHeaders(message);
                const content = message.binaryBody;

                const headerInt8Array = new Int8Array(this.stringToArrayBuffer(headersString));

                const payload = new ArrayBuffer(2 + headerInt8Array.byteLength + (content ? content.byteLength : 0));
                const dataView = new DataView(payload);

                dataView.setInt16(0, headerInt8Array.length);

                for (let i = 0; i < headerInt8Array.byteLength; i++) {
                    dataView.setInt8(2 + i, headerInt8Array[i]);
                }

                if (content) {
                    const bodyInt8Array = new Int8Array(content);
                    for (let i = 0; i < bodyInt8Array.byteLength; i++) {
                        dataView.setInt8(2 + headerInt8Array.byteLength + i, bodyInt8Array[i]);
                    }
                }

                deferral.resolve(new RawWebsocketMessage(MessageType.Binary, payload, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. ${e}`);
        }

        return deferral.promise();
    }

    private makeHeaders = (message: ConnectionMessage): string => {

        let headersString: string = "";

        if (message.headers) {
            for (const header in message.headers) {
                if (header) {
                    headersString += `${header}: ${message.headers[header]}${CRLF}`;
                }
            }
        }

        return headersString;
    }

    private parseHeaders = (headersString: string): IStringDictionary<string> => {

        const headers: IStringDictionary<string> = {};

        if (headersString) {
            const headerMatches = headersString.match(/[^\r\n]+/g);
            if (headers) {
                for (const header of headerMatches) {
                    if (header) {
                        const separatorIndex = header.indexOf(":");
                        const headerName = separatorIndex > 0 ? header.substr(0, separatorIndex).trim().toLowerCase() : header;
                        const headerValue =
                            separatorIndex > 0 && header.length > (separatorIndex + 1) ?
                                header.substr(separatorIndex + 1).trim() :
                                "";

                        headers[headerName] = headerValue;
                    }
                }
            }
        }

        return headers;
    }

    private stringToArrayBuffer = (str: string): ArrayBuffer => {
        const buffer = new ArrayBuffer(str.length);
        const view = new DataView(buffer);
        for (let i = 0; i < str.length; i++) {
            view.setUint8(i, str.charCodeAt(i));
        }
        return buffer;
    }
}
