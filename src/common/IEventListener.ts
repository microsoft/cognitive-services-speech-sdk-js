// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PlatformEvent } from "./PlatformEvent.js";

export interface IEventListener<TEvent extends PlatformEvent> {
    onEvent(e: TEvent): void;
}
