/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import * as fs from "fs";
import { LogLevel } from "../sdk/LogLevel.js";
import { IEventListener, PlatformEvent } from "../common/Exports.js";
import { Contracts } from "../sdk/Contracts.js";

export class ConsoleLoggingListener implements IEventListener<PlatformEvent> {
    private privLogLevelFilter: LogLevel;
    private privLogPath: fs.PathLike = undefined;
    private privEnableConsoleOutput: boolean = true;

    public logCallback: (s: string) => void;

    public constructor(logLevelFilter: LogLevel = LogLevel.None) { // Console output disabled by default
        this.privLogLevelFilter = logLevelFilter;
    }

    public set logPath(path: fs.PathLike) {
        Contracts.throwIfNullOrUndefined(fs.openSync, "\nFile System access not available");
        this.privLogPath = path;
    }

    public set enableConsoleOutput(enableOutput: boolean) {
        this.privEnableConsoleOutput = enableOutput;
    }

    public onEvent(event: PlatformEvent): void {
        if (event.eventType >= this.privLogLevelFilter) {
            const log = this.toString(event);
            if (!!this.logCallback) {
                this.logCallback(log);
            }
            if (!!this.privLogPath) {
                fs.writeFileSync(this.privLogPath, log + "\n", { flag: "a+" });
            }

            if (this.privEnableConsoleOutput) {
                switch (event.eventType) {
                    case LogLevel.Debug:
                        // eslint-disable-next-line no-console
                        console.debug(log);
                        break;
                    case LogLevel.Info:
                        // eslint-disable-next-line no-console
                        console.info(log);
                        break;
                    case LogLevel.Warning:
                        // eslint-disable-next-line no-console
                        console.warn(log);
                        break;
                    case LogLevel.Error:
                        // eslint-disable-next-line no-console
                        console.error(log);
                        break;
                    default:
                        // eslint-disable-next-line no-console
                        console.log(log);
                        break;
                }
            }
        }
    }

    private toString(event: PlatformEvent): string {
        const logFragments = [
            `${event.eventTime}`,
            `${event.name}`,
        ];

        const e: any = event as any;
        for (const prop in e) {
            if (prop && event.hasOwnProperty(prop) &&
                prop !== "eventTime" && prop !== "eventType" &&
                prop !== "eventId" && prop !== "name" &&
                prop !== "constructor") {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const value = e[prop];
                let valueToLog = "<NULL>";
                if (value !== undefined && value !== null) {
                    if (typeof (value) === "number" || typeof (value) === "string") {
                        valueToLog = value.toString();
                    } else {
                        valueToLog = JSON.stringify(value);
                    }
                }

                logFragments.push(`${prop}: ${valueToLog}`);
            }

        }

        return logFragments.join(" | ");
    }
}
