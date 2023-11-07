// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { AudioStreamFormat } from "../sdk/Exports.js";

export interface IAudioDestination {
    id(): string;
    write(buffer: ArrayBuffer): void;
    format: AudioStreamFormat;
    close(cb?: () => void, err?: (error: string) => void): void;
}
