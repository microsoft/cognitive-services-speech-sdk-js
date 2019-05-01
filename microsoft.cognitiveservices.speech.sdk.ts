// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { ConsoleLoggingListener } from "./src/common.browser/Exports";
import { Events, EventType } from "./src/common/Exports";

Events.instance.attachListener(new ConsoleLoggingListener());

// Speech SDK API
export * from "./src/sdk/Exports";
