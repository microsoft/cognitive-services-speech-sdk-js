//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

// eslint-disable-next-line max-classes-per-file
import { HeaderNames } from "../common.speech/HeaderNames.js";
import {
    ConnectionMessage as IntConnectionMessage,
    MessageType
} from "../common/Exports.js";
import {
    PropertyCollection
} from "./PropertyCollection.js";
import { PropertyId } from "./PropertyId.js";

/**
 * ConnectionMessage represents implementation specific messages sent to and received from
 * the speech service. These messages are provided for debugging purposes and should not
 * be used for production use cases with the Azure Cognitive Services Speech Service.
 * Messages sent to and received from the Speech Service are subject to change without
 * notice. This includes message contents, headers, payloads, ordering, etc.
 * Added in version 1.11.0.
 */
export abstract class ConnectionMessage {
    /**
     * The message path.
     */
    public abstract get path(): string;

    /**
     * Checks to see if the ConnectionMessage is a text message.
     * See also IsBinaryMessage().
     */
    public abstract get isTextMessage(): boolean;

    /**
     * Checks to see if the ConnectionMessage is a binary message.
     * See also GetBinaryMessage().
     */
    public abstract get isBinaryMessage(): boolean;

    /**
     * Gets the text message payload. Typically the text message content-type is
     * application/json. To determine other content-types use
     * Properties.GetProperty("Content-Type").
     */
    public abstract get TextMessage(): string;

    /**
     * Gets the binary message payload.
     */
    public abstract get binaryMessage(): ArrayBuffer;

    /**
     * A collection of properties and their values defined for this <see cref="ConnectionMessage"/>.
     * Message headers can be accessed via this collection (e.g. "Content-Type").
     */
    public abstract get properties(): PropertyCollection;

    /**
     * Returns a string that represents the connection message.
     */
    public abstract toString(): string;
}

export class ConnectionMessageImpl {

    private privConnectionMessage: IntConnectionMessage;
    private privProperties: PropertyCollection;

    public constructor(message: IntConnectionMessage) {
        this.privConnectionMessage = message;
        this.privProperties = new PropertyCollection();
        if (!!this.privConnectionMessage.headers[HeaderNames.ConnectionId]) {
            this.privProperties.setProperty(PropertyId.Speech_SessionId, this.privConnectionMessage.headers[HeaderNames.ConnectionId]);
        }

        Object.keys(this.privConnectionMessage.headers).forEach((header: string): void => {
            this.privProperties.setProperty(header, this.privConnectionMessage.headers[header]);
        });
    }

    /**
     * The message path.
     */
    public get path(): string {
        return this.privConnectionMessage.headers[Object.keys(this.privConnectionMessage.headers).find((key: string): boolean => key.toLowerCase() === "path".toLowerCase())];
    }

    /**
     * Checks to see if the ConnectionMessage is a text message.
     * See also IsBinaryMessage().
     */
    public get isTextMessage(): boolean {
        return this.privConnectionMessage.messageType === MessageType.Text;
    }

    /**
     * Checks to see if the ConnectionMessage is a binary message.
     * See also GetBinaryMessage().
     */
    public get isBinaryMessage(): boolean {
        return this.privConnectionMessage.messageType === MessageType.Binary;
    }

    /**
     * Gets the text message payload. Typically the text message content-type is
     * application/json. To determine other content-types use
     * Properties.GetProperty("Content-Type").
     */
    public get TextMessage(): string {
        return this.privConnectionMessage.textBody;
    }

    /**
     * Gets the binary message payload.
     */
    public get binaryMessage(): ArrayBuffer {
        return this.privConnectionMessage.binaryBody;
    }

    /**
     * A collection of properties and their values defined for this <see cref="ConnectionMessage"/>.
     * Message headers can be accessed via this collection (e.g. "Content-Type").
     */
    public get properties(): PropertyCollection {
        return this.privProperties;
    }

    /**
     * Returns a string that represents the connection message.
     */
    public toString(): string {
        return "";
    }
}
