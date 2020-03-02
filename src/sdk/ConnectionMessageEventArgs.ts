//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import {
    ConnectionMessage,
    SessionEventArgs
} from "./Exports";

export class ConnectionMessageEventArgs {

    private privConnectionMessage: ConnectionMessage;

    constructor(message: ConnectionMessage) {
        this.privConnectionMessage = message;
    }

    /**
     * Gets the <see cref="ConnectionMessage"/> associated with this <see cref="ConnectionMessageEventArgs"/>.
     */
    public get message(): ConnectionMessage {
        return this.privConnectionMessage;
    }

    /**
     * Returns a string that represents the connection message event.
     */
    public toString(): string {
        return "Message: " + this.privConnectionMessage.toString();
    }
}
