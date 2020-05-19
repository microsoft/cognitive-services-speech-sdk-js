// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { ArgumentNullError } from "./Error";

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

export class PromiseResult<T> {
    protected privIsCompleted: boolean;
    protected privIsError: boolean;
    protected privError: string;
    protected privResult: T;

    public constructor(promiseResultEventSource: PromiseResultEventSource<T>) {
        promiseResultEventSource.on((result: T) => {
            if (!this.privIsCompleted) {
                this.privIsCompleted = true;
                this.privIsError = false;
                this.privResult = result;
            }
        }, (error: string) => {
            if (!this.privIsCompleted) {
                this.privIsCompleted = true;
                this.privIsError = true;
                this.privError = error;
            }
        });
    }

    public get isCompleted(): boolean {
        return this.privIsCompleted;
    }

    public get isError(): boolean {
        return this.privIsError;
    }

    public get error(): string {
        return this.privError;
    }

    public get result(): T {
        return this.privResult;
    }

    public throwIfError = (): void => {
        if (this.isError) {
            throw this.error;
        }
    }
}

// tslint:disable-next-line:max-classes-per-file
export class PromiseResultEventSource<T>  {

    private privOnSetResult: (result: T) => void;
    private privOnSetError: (error: string) => void;

    public setResult = (result: T): void => {
        this.privOnSetResult(result);
    }

    public setError = (error: string): void => {
        this.privOnSetError(error);
    }

    public on = (onSetResult: (result: T) => void, onSetError: (error: string) => void): void => {
        this.privOnSetResult = onSetResult;
        this.privOnSetError = onSetError;
    }
}

// tslint:disable-next-line:max-classes-per-file
export class PromiseCompletionWrapper<T> {
    private privPromise: Promise<T>;
    private privIsCompleted: boolean;
    private privResult: T;
    private privIsError: boolean;
    private privFinallyPromise: Promise<PromiseCompletionWrapper<T>>;

    constructor(promise: Promise<T>, after?: () => void) {
        this.privPromise = promise;
        this.privIsCompleted = false;
        this.privIsError = false;

        this.privFinallyPromise = new Promise<PromiseCompletionWrapper<T>>((resolve: (value: PromiseCompletionWrapper<T>) => void, reject: (reason: any) => void) => {
            promise.then((result: T) => {
                this.privIsCompleted = true;
                this.privResult = result;
                if (!!after) {
                    after();
                }
                resolve(this);
            }, () => {
                this.privIsCompleted = true;
                this.privIsError = true;
                if (!!after) {
                    after();
                }
                resolve(this);
            });
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

    public get finally(): Promise<PromiseCompletionWrapper<T>> {
        return this.privFinallyPromise;
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

// tslint:disable-next-line:max-classes-per-file
export class Sink<T> {
    private privState: PromiseState = PromiseState.None;
    private privPromiseResult: PromiseResult<T> = null;
    private privPromiseResultEvents: PromiseResultEventSource<T> = null;

    private privSuccessHandlers: Array<((result: T) => void)> = [];
    private privErrorHandlers: Array<(e: string) => void> = [];

    public constructor() {
        this.privPromiseResultEvents = new PromiseResultEventSource();
        this.privPromiseResult = new PromiseResult(this.privPromiseResultEvents);
    }

    public get state(): PromiseState {
        return this.privState;
    }

    public get result(): PromiseResult<T> {
        return this.privPromiseResult;
    }

    public resolve = (result: T): void => {
        if (this.privState !== PromiseState.None) {
            throw new Error("'Cannot resolve a completed promise'");
        }

        this.privState = PromiseState.Resolved;
        this.privPromiseResultEvents.setResult(result);

        for (let i = 0; i < this.privSuccessHandlers.length; i++) {
            this.executeSuccessCallback(result, this.privSuccessHandlers[i], this.privErrorHandlers[i]);
        }

        this.detachHandlers();
    }

    public reject = (error: string): void => {
        if (this.privState !== PromiseState.None) {
            throw new Error("'Cannot reject a completed promise'");
        }

        this.privState = PromiseState.Rejected;
        this.privPromiseResultEvents.setError(error);

        for (const errorHandler of this.privErrorHandlers) {
            this.executeErrorCallback(error, errorHandler);
        }

        this.detachHandlers();
    }

    public on = (
        successCallback: (result: T) => void,
        errorCallback: (error: string) => void): void => {

        if (successCallback == null) {
            successCallback = (r: T) => { return; };
        }

        if (this.privState === PromiseState.None) {
            this.privSuccessHandlers.push(successCallback);
            this.privErrorHandlers.push(errorCallback);
        } else {
            if (this.privState === PromiseState.Resolved) {
                this.executeSuccessCallback(this.privPromiseResult.result, successCallback, errorCallback);
            } else if (this.privState === PromiseState.Rejected) {
                this.executeErrorCallback(this.privPromiseResult.error, errorCallback);
            }

            this.detachHandlers();
        }
    }

    private executeSuccessCallback = (result: T, successCallback: (result: T) => void, errorCallback: (error: string) => void): void => {
        try {
            successCallback(result);
        } catch (e) {
            this.executeErrorCallback(`'Unhandled callback error: ${e}'`, errorCallback);
        }
    }

    private executeErrorCallback = (error: string, errorCallback: (error: string) => void): void => {
        if (errorCallback) {
            try {
                errorCallback(error);
            } catch (e) {
                throw new Error(`'Unhandled callback error: ${e}. InnerError: ${error}'`);
            }
        } else {
            throw new Error(`'Unhandled error: ${error}'`);
        }
    }

    private detachHandlers = (): void => {
        this.privErrorHandlers = [];
        this.privSuccessHandlers = [];
    }
}
