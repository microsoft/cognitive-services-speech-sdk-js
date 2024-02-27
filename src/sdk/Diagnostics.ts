//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { ConsoleLoggingListener } from "../common.browser/Exports.js";
import { Events } from "../common/Exports.js";
import { LogLevel } from "./LogLevel.js";

type LogCallback = (s: string) => void;

/**
 * Defines diagnostics API for managing console output
 * Added in version 1.21.0
 */
export class Diagnostics {
    private static privListener: ConsoleLoggingListener = undefined;

    public static SetLoggingLevel(logLevel: LogLevel): void {
        this.privListener = new ConsoleLoggingListener(logLevel);
        Events.instance.attachConsoleListener(this.privListener);
    }

    public static StartConsoleOutput(): void {
        if (!!this.privListener) {
            this.privListener.enableConsoleOutput = true;
        }
    }

    public static StopConsoleOutput(): void {
        if (!!this.privListener) {
            this.privListener.enableConsoleOutput = false;
        }
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


    public static set onLogOutput( callback: LogCallback ) {
        if (!!this.privListener) {
            this.privListener.logCallback = callback;
        }
    }

}
