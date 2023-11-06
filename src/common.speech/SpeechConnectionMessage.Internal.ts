// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArgumentNullError, ConnectionMessage, IStringDictionary, MessageType } from "../common/Exports.js";
import { HeaderNames } from "./HeaderNames.js";

export class SpeechConnectionMessage extends ConnectionMessage {

    private privPath: string;
    private privRequestId: string;
    private privContentType: string;
    private privStreamId: string;
    private privAdditionalHeaders: IStringDictionary<string>;

    public constructor(
        messageType: MessageType,
        path: string,
        requestId: string,
        contentType: string,
        body: any,
        streamId?: string,
        additionalHeaders?: IStringDictionary<string>,
        id?: string) {

        if (!path) {
            throw new ArgumentNullError("path");
        }

        if (!requestId) {
            throw new ArgumentNullError("requestId");
        }

        const headers: IStringDictionary<string> = {};
        headers[HeaderNames.Path] = path;
        headers[HeaderNames.RequestId] = requestId;
        headers[HeaderNames.RequestTimestamp] = new Date().toISOString();
        if (contentType) {
            headers[HeaderNames.ContentType] = contentType;
        }

        if (streamId) {
            headers[HeaderNames.RequestStreamId] = streamId;
        }

        if (additionalHeaders) {
            for (const headerName in additionalHeaders) {
                if (headerName) {
                    headers[headerName] = additionalHeaders[headerName];
                }

            }
        }

        if (id) {
            super(messageType, body, headers, id);
        } else {
            super(messageType, body, headers);
        }

        this.privPath = path;
        this.privRequestId = requestId;
        this.privContentType = contentType;
        this.privStreamId = streamId;
        this.privAdditionalHeaders = additionalHeaders;
    }

    public get path(): string {
        return this.privPath;
    }

    public get requestId(): string {
        return this.privRequestId;
    }

    public get contentType(): string {
        return this.privContentType;
    }

    public get streamId(): string {
        return this.privStreamId;
    }

    public get additionalHeaders(): IStringDictionary<string> {
        return this.privAdditionalHeaders;
    }

    public static fromConnectionMessage(message: ConnectionMessage): SpeechConnectionMessage {
        let path = null;
        let requestId = null;
        let contentType = null;
        // let requestTimestamp = null;
        let streamId = null;
        const additionalHeaders: IStringDictionary<string> = {};

        if (message.headers) {
            for (const headerName in message.headers) {
                if (headerName) {
                    if (headerName.toLowerCase() === HeaderNames.Path.toLowerCase()) {
                        path = message.headers[headerName];
                    } else if (headerName.toLowerCase() === HeaderNames.RequestId.toLowerCase()) {
                        requestId = message.headers[headerName];
                    // } else if (headerName.toLowerCase() === HeaderNames.RequestTimestamp.toLowerCase()) {
                       //  requestTimestamp = message.headers[headerName];
                    } else if (headerName.toLowerCase() === HeaderNames.ContentType.toLowerCase()) {
                        contentType = message.headers[headerName];
                    } else if (headerName.toLowerCase() === HeaderNames.RequestStreamId.toLowerCase()) {
                        streamId = message.headers[headerName];
                    } else {
                        additionalHeaders[headerName] = message.headers[headerName];
                    }
                }
            }
        }

        return new SpeechConnectionMessage(
            message.messageType,
            path,
            requestId,
            contentType,
            message.body,
            streamId,
            additionalHeaders,
            message.id);
    }
}
