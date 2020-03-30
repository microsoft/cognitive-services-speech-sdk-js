// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createNoDashGuid, IAudioDestination } from "../common/Exports";
import { AudioStreamFormat } from "../sdk/Exports";

/**
 * This is not implemented yet, just a place holder.
 */
export class SpeakerAudioDestination implements IAudioDestination {
    private readonly privId: string;

    public constructor(audioDestinationId?: string) {
        this.privId = audioDestinationId ? audioDestinationId : createNoDashGuid();
    }

    public id(): string {
        return this.privId;
    }

    // tslint:disable-next-line:no-empty
    public write(buffer: ArrayBuffer): void {}

    // tslint:disable-next-line:no-empty
    public close(): void {}

    // tslint:disable-next-line:no-empty
    set format(format: AudioStreamFormat) {}

}
