//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { SessionEventArgs } from "./Exports.js";

/**
 * Defines payload for any Service message event
 * Added in version 1.9.0
 */

export class ServiceEventArgs extends SessionEventArgs {
    private privJsonResult: string;
    private privEventName: string;

    /**
     * Creates and initializes an instance of this class.
     * @constructor
     * @param {string} json - json payload of the USP message.
     */
    public constructor(json: string,  name: string, sessionId?: string) {
        super(sessionId);
        this.privJsonResult = json;
        this.privEventName = name;
    }

    public get jsonString(): string {
        return this.privJsonResult;
    }

    public get eventName(): string {
        return this.privEventName;
    }
}
