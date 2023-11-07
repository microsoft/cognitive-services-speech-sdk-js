// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { EventType, PlatformEvent } from "../common/Exports.js";

export class SpeechSynthesisEvent extends PlatformEvent {
    private privRequestId: string;

    public constructor(eventName: string, requestId: string, eventType: EventType = EventType.Info) {
        super(eventName, eventType);

        this.privRequestId = requestId;
    }

    public get requestId(): string {
        return this.privRequestId;
    }
}

export class SynthesisTriggeredEvent extends SpeechSynthesisEvent {
    private privSessionAudioDestinationId: string;
    private privTurnAudioDestinationId: string;

    public constructor(requestId: string, sessionAudioDestinationId: string, turnAudioDestinationId: string) {
        super("SynthesisTriggeredEvent", requestId);

        this.privSessionAudioDestinationId = sessionAudioDestinationId;
        this.privTurnAudioDestinationId = turnAudioDestinationId;
    }

    public get audioSessionDestinationId(): string {
        return this.privSessionAudioDestinationId;
    }

    public get audioTurnDestinationId(): string {
        return this.privTurnAudioDestinationId;
    }
}

export class ConnectingToSynthesisServiceEvent extends SpeechSynthesisEvent {
    private privAuthFetchEventId: string;

    public constructor(requestId: string, authFetchEventId: string) {
        super("ConnectingToSynthesisServiceEvent", requestId);
        this.privAuthFetchEventId = authFetchEventId;
    }

    public get authFetchEventId(): string {
        return this.privAuthFetchEventId;
    }
}

export class SynthesisStartedEvent extends SpeechSynthesisEvent {
    private privAuthFetchEventId: string;

    public constructor(requestId: string, authFetchEventId: string) {
        super("SynthesisStartedEvent", requestId);

        this.privAuthFetchEventId = authFetchEventId;
    }

    public get authFetchEventId(): string {
        return this.privAuthFetchEventId;
    }
}
