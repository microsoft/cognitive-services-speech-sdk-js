// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

import { EventType, PlatformEvent } from "./PlatformEvent";

export class OCSPEvent extends PlatformEvent {
    private privSignature: string;

    constructor(eventName: string, eventType: EventType, signature: string) {
        super(eventName, eventType);

        this.privSignature = signature;
    }
}

export class OCSPMemoryCacheHitEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPMemoryCacheHitEvent", EventType.Debug, signature);
    }
}

export class OCSPCacheMissEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPCacheMissEvent", EventType.Debug, signature);
    }
}

export class OCSPDiskCacheHitEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPDiskCacheHitEvent", EventType.Debug, signature);
    }
}

export class OCSPCacheUpdateNeededEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPCacheUpdateNeededEvent", EventType.Debug, signature);
    }
}

export class OCSPMemoryCacheStoreEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPMemoryCacheStoreEvent", EventType.Debug, signature);
    }
}

export class OCSPDiskCacheStoreEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPDiskCacheStoreEvent", EventType.Debug, signature);
    }
}

export class OCSPCacheUpdateCompleteEvent extends OCSPEvent {
    constructor(signature: string) {
        super("OCSPCacheUpdateCompleteEvent", EventType.Debug, signature);
    }
}

export class OCSPStapleReceivedEvent extends OCSPEvent {
    constructor() {
        super("OCSPStapleReceivedEvent", EventType.Debug, "");
    }
}

export class OCSPWSUpgradeStartedEvent extends OCSPEvent {
    constructor(serialNumber: string) {
        super("OCSPWSUpgradeStartedEvent", EventType.Debug, serialNumber);
    }
}

export class OCSPCacheEntryExpiredEvent extends OCSPEvent {
    private privExpireTime: number;

    constructor(serialNumber: string, expireTime: number) {
        super("OCSPCacheEntryExpiredEvent", EventType.Debug, serialNumber);
        this.privExpireTime = expireTime;
    }
}

export class OCSPCacheEntryNeedsRefreshEvent extends OCSPEvent {
    private privExpireTime: number;
    private privStartTime: number;

    constructor(serialNumber: string, startTime: number, expireTime: number) {
        super("OCSPCacheEntryNeedsRefreshEvent", EventType.Debug, serialNumber);
        this.privExpireTime = expireTime;
        this.privStartTime = startTime;
    }
}

export class OCSPCacheHitEvent extends OCSPEvent {
    private privExpireTime: number;
    private privStartTime: number;
    private privExpireTimeString: string;
    private privStartTimeString: string;

    constructor(serialNumber: string, startTime: number, expireTime: number) {
        super("OCSPCacheHitEvent", EventType.Debug, serialNumber);
        this.privExpireTime = expireTime;
        this.privExpireTimeString = new Date(expireTime).toLocaleDateString();
        this.privStartTime = startTime;
        this.privStartTimeString = new Date(startTime).toLocaleTimeString();
    }
}

export class OCSPVerificationFailedEvent extends OCSPEvent {
    private privError: string;

    constructor(serialNumber: string, error: string) {
        super("OCSPVerificationFailedEvent", EventType.Debug, serialNumber);
        this.privError = error;
    }
}

export class OCSPCacheFetchErrorEvent extends OCSPEvent {
    private privError: string;

    constructor(serialNumber: string, error: string) {
        super("OCSPCacheFetchErrorEvent", EventType.Debug, serialNumber);
        this.privError = error;
    }
}

export class OCSPResponseRetrievedEvent extends OCSPEvent {
    constructor(serialNumber: string) {
        super("OCSPResponseRetrievedEvent", EventType.Debug, serialNumber);
    }
}

export class OCSPCacheUpdateErrorEvent extends OCSPEvent {
    private privError: string;

    constructor(serialNumber: string, error: string) {
        super("OCSPCacheUpdateErrorEvent", EventType.Debug, serialNumber);
        this.privError = error;
    }
}
