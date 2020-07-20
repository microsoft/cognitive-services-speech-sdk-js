// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { EventEmitter } from "ws";
import { PlatformEvent } from "./Exports";
type EventMap = Record<string, PlatformEvent>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap> {
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

// tslint:disable-next-line:max-classes-per-file
class CustomEmitter {
    private target: EventTarget;
    constructor() {
        this.target = new EventTarget();
    }
    public on(eventName: string, listener: (params: any) => void): void {
        return this.target.addEventListener(eventName, listener);
    }
    public off(eventName: string, listener: (params: any) => void): void {
        return this.target.removeEventListener(eventName, listener);
    }
    public emit(eventName: string, detail: PlatformEvent): void {
        this.target.dispatchEvent(
            new CustomEvent(eventName, { detail })
        );
    }
}

// tslint:disable-next-line:max-classes-per-file
export class PlatformEmitter<T extends EventMap> implements Emitter<T> {
    private privEmitter: CustomEmitter | EventEmitter;
    public constructor() {
        if (EventEmitter !== undefined) {
            this.privEmitter = new EventEmitter();
        } else {
            this.privEmitter = new CustomEmitter();
        }
    }
    public on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void {
        this.privEmitter.on(eventName, fn);
    }

    public off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void {
        this.privEmitter.off(eventName, fn);
    }

    public emit<K extends EventKey<T>>(eventName: K, params: T[K]): void {
        this.privEmitter.emit(eventName, params);
    }
}
