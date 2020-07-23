// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { PlatformEmitter } from "./Emitter";
import { ObjectDisposedError } from "./Error";
import { createNoDashGuid } from "./Guid";
import { IDetachable } from "./IDetachable";
import { IStringDictionary } from "./IDictionary";
import { IEventListener, IEventSource } from "./IEventSource";
import { PlatformEvent } from "./PlatformEvent";

export class EventSource<TEvent extends PlatformEvent> implements IEventSource<TEvent> {
    private privEventIds: Record<string, boolean> = {};
    private privMetadata: IStringDictionary<string>;
    private privEmitter: PlatformEmitter<Record<string, PlatformEvent>>;
    private privIsDisposed: boolean = false;

    constructor(metadata?: IStringDictionary<string>) {
        this.privMetadata = metadata;
        this.privEmitter = new PlatformEmitter<Record<string, PlatformEvent>>();
    }

    public onEvent = (event: TEvent): void => {
        if (this.isDisposed()) {
            throw (new ObjectDisposedError("EventSource"));
        }

        if (this.metadata) {
            for (const paramName in this.metadata) {
                if (paramName) {
                    if (event.metadata) {
                        if (!event.metadata[paramName]) {
                            event.metadata[paramName] = this.metadata[paramName];
                        }
                    }
                }
            }
        }

        for (const eventId in this.privEventIds) {
            if (eventId && this.privEventIds[eventId]) {
                this.privEmitter.emit(eventId, event);
            }
        }
    }

    public attach = (onEventCallback: (event: TEvent) => void): IDetachable => {
        const id = createNoDashGuid();
        this.privEmitter.on(id, onEventCallback);
        this.privEventIds[id] = true;
        return {
            detach: () => {
                this.privEmitter.off(id, onEventCallback);
                delete this.privEventIds[id];
                return Promise.resolve();
            },
        };
    }

    public attachListener = (listener: IEventListener<TEvent>): IDetachable => {
        return this.attach(listener.onEvent);
    }

    public isDisposed = (): boolean => {
        return this.privIsDisposed;
    }

    public dispose = (): void => {
        this.privIsDisposed = true;
    }

    public get metadata(): IStringDictionary<string> {
        return this.privMetadata;
    }
}
