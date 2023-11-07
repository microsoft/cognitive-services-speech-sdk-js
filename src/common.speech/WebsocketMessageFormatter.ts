// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import {
    ConnectionMessage,
    Deferred,
    IStringDictionary,
    IWebsocketMessageFormatter,
    MessageType,
    RawWebsocketMessage,
} from "../common/Exports.js";

const CRLF: string = "\r\n";

export class WebsocketMessageFormatter implements IWebsocketMessageFormatter {

    public toConnectionMessage(message: RawWebsocketMessage): Promise<ConnectionMessage> {
        const deferral = new Deferred<ConnectionMessage>();

        try {
            if (message.messageType === MessageType.Text) {
                const textMessage: string = message.textContent;
                let headers: IStringDictionary<string> = {};
                let body: string = null;

                if (textMessage) {
                    const headerBodySplit = textMessage.split("\r\n\r\n");
                    if (headerBodySplit && headerBodySplit.length > 0) {
                        headers = this.parseHeaders(headerBodySplit[0]);
                        if (headerBodySplit.length > 1) {
                            body = headerBodySplit[1];
                        }
                    }
                }

                deferral.resolve(new ConnectionMessage(message.messageType, body, headers, message.id));
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

                deferral.resolve(new ConnectionMessage(message.messageType, body, headers, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. Error: ${e as string}`);
        }

        return deferral.promise;
    }

    public fromConnectionMessage(message: ConnectionMessage): Promise<RawWebsocketMessage> {
        const deferral = new Deferred<RawWebsocketMessage>();

        try {
            if (message.messageType === MessageType.Text) {
                const payload = `${this.makeHeaders(message)}${CRLF}${message.textBody ? message.textBody : ""}`;

                deferral.resolve(new RawWebsocketMessage(MessageType.Text, payload, message.id));

            } else if (message.messageType === MessageType.Binary) {
                const headersString = this.makeHeaders(message);
                const content = message.binaryBody;

                const headerBuffer = this.stringToArrayBuffer(headersString);
                const headerInt8Array = new Int8Array(headerBuffer);
                const headerLength = headerInt8Array.byteLength;

                const payloadInt8Array = new Int8Array(2 + headerLength + (content ? content.byteLength : 0));
                payloadInt8Array[0] = ((headerLength >> 8) & 0xff);
                payloadInt8Array[1] = headerLength & 0xff;
                payloadInt8Array.set(headerInt8Array, 2);

                if (content) {
                    const bodyInt8Array = new Int8Array(content);
                    payloadInt8Array.set(bodyInt8Array, 2 + headerLength);
                }

                const payload: ArrayBuffer = payloadInt8Array.buffer;

                deferral.resolve(new RawWebsocketMessage(MessageType.Binary, payload, message.id));
            }
        } catch (e) {
            deferral.reject(`Error formatting the message. ${e as string}`);
        }

        return deferral.promise;
    }

    private makeHeaders(message: ConnectionMessage): string {
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

    private parseHeaders(headersString: string): IStringDictionary<string> {
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

    private stringToArrayBuffer(str: string): ArrayBuffer {
        const buffer = new ArrayBuffer(str.length);
        const view = new DataView(buffer);
        for (let i = 0; i < str.length; i++) {
            view.setUint8(i, str.charCodeAt(i));
        }
        return buffer;
    }
}
