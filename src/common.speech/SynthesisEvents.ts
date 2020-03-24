// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { EventType, PlatformEvent } from "../common/Exports";

export class SpeechSynthesisEvent extends PlatformEvent {
    private privRequestId: string;

    constructor(eventName: string, requestId: string, eventType: EventType = EventType.Info) {
        super(eventName, eventType);

        this.privRequestId = requestId;
    }

    public get requestId(): string {
        return this.privRequestId;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class SynthesisTriggeredEvent extends SpeechSynthesisEvent {
    private privSessionAudioDestinationId: string;
    private privTurnAudioDestinationId: string;

    constructor(requestId: string, sessionAudioDestinationId: string, turnAudioDestinationId: string) {
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

// tslint:disable-next-line:max-classes-per-file
export class ConnectingToSynthesisServiceEvent extends SpeechSynthesisEvent {
    private privAuthFetchEventId: string;

    constructor(requestId: string, authFetchEventId: string) {
        super("ConnectingToSynthesisServiceEvent", requestId);
        this.privAuthFetchEventId = authFetchEventId;
    }

    public get authFetchEventId(): string {
        return this.privAuthFetchEventId;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class SynthesisStartedEvent extends SpeechSynthesisEvent {
    private privAuthFetchEventId: string;

    constructor(requestId: string, authFetchEventId: string) {
        super("SynthesisStartedEvent", requestId);

        this.privAuthFetchEventId = authFetchEventId;
    }

    public get authFetchEventId(): string {
        return this.privAuthFetchEventId;
    }
}
