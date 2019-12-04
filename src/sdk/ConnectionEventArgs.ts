//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.md file in the project root for full license information.
//

import { SessionEventArgs } from "./Exports";

/**
 * Defines payload for connection events like Connected/Disconnected.
 * Added in version 1.2.0
 */
export class ConnectionEventArgs extends SessionEventArgs {
}

/**
 * Defines payload for connection events like Connected/Disconnected.
 * Added in version 1.9.0
 */
// tslint:disable-next-line:max-classes-per-file
export class ServiceEventArgs extends SessionEventArgs {
}
