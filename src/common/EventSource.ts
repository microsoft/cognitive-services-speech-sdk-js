// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ObjectDisposedError } from "./Error.js";
import { createNoDashGuid } from "./Guid.js";
import { IDetachable } from "./IDetachable.js";
import { IStringDictionary } from "./IDictionary.js";
import { IEventListener } from "./IEventListener.js";
import { IEventSource } from "./IEventSource.js";
import { PlatformEvent } from "./PlatformEvent.js";

export class EventSource<TEvent extends PlatformEvent> implements IEventSource<TEvent> {
    private privEventListeners: IStringDictionary<(event: TEvent) => void> = {};
    private privMetadata: IStringDictionary<string>;
    private privIsDisposed: boolean = false;
    private privConsoleListener: IDetachable = undefined;

    public constructor(metadata?: IStringDictionary<string>) {
        this.privMetadata = metadata;
    }

    public onEvent(event: TEvent): void {
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

        for (const eventId in this.privEventListeners) {
            if (eventId && this.privEventListeners[eventId]) {
                this.privEventListeners[eventId](event);
            }
        }
    }

    public attach(onEventCallback: (event: TEvent) => void): IDetachable {
        const id = createNoDashGuid();
        this.privEventListeners[id] = onEventCallback;
        return {
            detach: (): Promise<void> => {
                delete this.privEventListeners[id];
                return Promise.resolve();
            },
        };
    }

    public attachListener(listener: IEventListener<TEvent>): IDetachable {
        return this.attach((e: TEvent): void => listener.onEvent(e));
    }

    public attachConsoleListener(listener: IEventListener<TEvent>): IDetachable {
        if (!!this.privConsoleListener) {
            void this.privConsoleListener.detach(); // Detach implementation for eventListeners is synchronous
        }
        this.privConsoleListener = this.attach((e: TEvent): void => listener.onEvent(e));
        return this.privConsoleListener;
    }

    public isDisposed(): boolean {
        return this.privIsDisposed;
    }

    public dispose(): void {
        this.privEventListeners = null;
        this.privIsDisposed = true;
    }

    public get metadata(): IStringDictionary<string> {
        return this.privMetadata;
    }
}
