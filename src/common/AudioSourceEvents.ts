// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { EventType, PlatformEvent } from "./PlatformEvent.js";

export class AudioSourceEvent extends PlatformEvent {
    private privAudioSourceId: string;

    public constructor(eventName: string, audioSourceId: string, eventType: EventType = EventType.Info) {
        super(eventName, eventType);
        this.privAudioSourceId = audioSourceId;
    }

    public get audioSourceId(): string {
        return this.privAudioSourceId;
    }
}

export class AudioSourceInitializingEvent extends AudioSourceEvent {
    public constructor(audioSourceId: string) {
        super("AudioSourceInitializingEvent", audioSourceId);
    }
}

export class AudioSourceReadyEvent extends AudioSourceEvent {
    public constructor(audioSourceId: string) {
        super("AudioSourceReadyEvent", audioSourceId);
    }
}

export class AudioSourceOffEvent extends AudioSourceEvent {
    public constructor(audioSourceId: string) {
        super("AudioSourceOffEvent", audioSourceId);
    }
}

export class AudioSourceErrorEvent extends AudioSourceEvent {
    private privError: string;

    public constructor(audioSourceId: string, error: string) {
        super("AudioSourceErrorEvent", audioSourceId, EventType.Error);
        this.privError = error;
    }

    public get error(): string {
        return this.privError;
    }
}

export class AudioStreamNodeEvent extends AudioSourceEvent {
    private privAudioNodeId: string;

    public constructor(eventName: string, audioSourceId: string, audioNodeId: string) {
        super(eventName, audioSourceId);
        this.privAudioNodeId = audioNodeId;
    }

    public get audioNodeId(): string {
        return this.privAudioNodeId;
    }
}

export class AudioStreamNodeAttachingEvent extends AudioStreamNodeEvent {
    public constructor(audioSourceId: string, audioNodeId: string) {
        super("AudioStreamNodeAttachingEvent", audioSourceId, audioNodeId);
    }
}

export class AudioStreamNodeAttachedEvent extends AudioStreamNodeEvent {
    public constructor(audioSourceId: string, audioNodeId: string) {
        super("AudioStreamNodeAttachedEvent", audioSourceId, audioNodeId);
    }
}

export class AudioStreamNodeDetachedEvent extends AudioStreamNodeEvent {
    public constructor(audioSourceId: string, audioNodeId: string) {
        super("AudioStreamNodeDetachedEvent", audioSourceId, audioNodeId);
    }
}

export class AudioStreamNodeErrorEvent extends AudioStreamNodeEvent {
    private privError: string;

    public constructor(audioSourceId: string, audioNodeId: string, error: string) {
        super("AudioStreamNodeErrorEvent", audioSourceId, audioNodeId);
        this.privError = error;
    }

    public get error(): string {
        return this.privError;
    }
}
