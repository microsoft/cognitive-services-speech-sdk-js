
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { EventType } from "../sdk/Exports";
import { PlatformEvent } from "./Exports";

export class BackgroundEvent extends PlatformEvent {
    private privError: string;

    public constructor(error: string) {
        super("BackgroundEvent", EventType.Error);
        this.privError = error;
    }

    public get error(): string {
        return this.privError;
    }
}
