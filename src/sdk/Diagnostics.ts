//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { ConsoleLoggingListener } from "../common.browser/Exports";
import { Events } from "../common/Exports";
import { EventType } from "./Exports";

/**
 * Defines diagnostics API for managing console output
 * Added in version 1.21.0
 */
export class Diagnostics {
    private static privListener: ConsoleLoggingListener = undefined;

    public static SetLoggingLevel(eventType: EventType): void {
        this.privListener =  new ConsoleLoggingListener(eventType);
        Events.instance.attachConsoleListener(this.privListener);
    }

    public static SetLogOutputPath(path: string): void {
        if (typeof window === "undefined") {
            if (!!this.privListener) {
                this.privListener.logPath = path;
            }
        } else {
            throw new Error("File system logging not available in browser.");
        }
    }

}
