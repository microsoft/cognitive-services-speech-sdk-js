// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export class Deferred<T> {
    public resolve: (value?: T | PromiseLike<T>) => void;

    public reject: (reason?: any) => void;

    public promise: Promise<T> = new Promise<T>(((resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => {
        this.resolve = resolve;
        this.reject = reject;
    }).bind(this));

    // public then: (onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
    // public catch: (onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;

    // public constructor() {
    //     this.then = this.promise.then.bind(this.promise);
    //     this.catch = this.promise.catch.bind(this.promise);
    // }
}
