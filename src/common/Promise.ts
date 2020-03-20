// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export enum PromiseState {
    None,
    Resolved,
    Rejected,
}

export interface IDeferred<T> {
    readonly promise: Promise<T>;

    resolve(result: T): IDeferred<T>;

    reject(error: string): IDeferred<T>;
}

// tslint:disable-next-line:max-classes-per-file
export class PromiseCompletionWrapper<T> {
    private privPromise: Promise<T>;
    private privIsCompleted: boolean;
    private privResult: T;
    private privIsError: boolean;
    private privFinallyPromise: Promise<PromiseCompletionWrapper<T>>;

    constructor(promise: Promise<T>) {
        this.privPromise = promise;
        this.privIsCompleted = false;
        this.privIsError = false;

        promise.then((result: T) => {
            this.privIsCompleted = true;
            this.privResult = result;
        }, () => {
            this.privIsCompleted = true;
            this.privIsError = true;
        });
    }

    public get isCompleted(): boolean {
        return this.privIsCompleted;
    }

    public get isError(): boolean {
        return this.privIsError;
    }

    public get result(): T {
        return this.privResult;
    }

    public get promise(): Promise<T> {
        return this.privPromise;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class Deferred<T> implements IDeferred<T> {
    private privPromise: Promise<T>;
    private privResolve: (value?: T | PromiseLike<T>) => void;
    private privReject: (reason?: any) => void;

    public constructor() {
        this.privPromise = new Promise<T>((resolve: (value: T) => void, reject: (reason: any) => void) => {
            this.privResolve = resolve;
            this.privReject = reject;
        });
    }

    public get promise(): Promise<T> {
        return this.privPromise;
    }

    public resolve = (result: T | Promise<T>): Deferred<T> => {
        this.privResolve(result);
        return this;
    }

    public reject = (error: string): Deferred<T> => {
        this.privReject(error);
        return this;
    }
}
