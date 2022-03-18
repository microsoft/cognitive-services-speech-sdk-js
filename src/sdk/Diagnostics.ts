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

    public static SetLoggingLevel(eventType: EventType): void {
        Events.instance.attachConsoleListener(new ConsoleLoggingListener(eventType));
    }

}
