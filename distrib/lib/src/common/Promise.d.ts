export declare enum PromiseState {
    None = 0,
    Resolved = 1,
    Rejected = 2
}
export interface IPromise<T> {
    result(): PromiseResult<T>;
    continueWith<TContinuationResult>(continuationCallback: (promiseResult: PromiseResult<T>) => TContinuationResult): IPromise<TContinuationResult>;
    continueWithPromise<TContinuationResult>(continuationCallback: (promiseResult: PromiseResult<T>) => IPromise<TContinuationResult>): IPromise<TContinuationResult>;
    onSuccessContinueWith<TContinuationResult>(continuationCallback: (result: T) => TContinuationResult): IPromise<TContinuationResult>;
    onSuccessContinueWithPromise<TContinuationResult>(continuationCallback: (result: T) => IPromise<TContinuationResult>): IPromise<TContinuationResult>;
    on(successCallback: (result: T) => void, errorCallback: (error: string) => void): IPromise<T>;
    finally(callback: () => void): IPromise<T>;
}
export interface IDeferred<T> {
    state(): PromiseState;
    promise(): IPromise<T>;
    resolve(result: T): IDeferred<T>;
    reject(error: string): IDeferred<T>;
}
export declare class PromiseResult<T> {
    protected privIsCompleted: boolean;
    protected privIsError: boolean;
    protected privError: string;
    protected privResult: T;
    constructor(promiseResultEventSource: PromiseResultEventSource<T>);
    readonly isCompleted: boolean;
    readonly isError: boolean;
    readonly error: string;
    readonly result: T;
    throwIfError: () => void;
}
export declare class PromiseResultEventSource<T> {
    private privOnSetResult;
    private privOnSetError;
    setResult: (result: T) => void;
    setError: (error: string) => void;
    on: (onSetResult: (result: T) => void, onSetError: (error: string) => void) => void;
}
export declare class PromiseHelper {
    static whenAll: (promises: Promise<any>[]) => Promise<boolean>;
    static fromResult: <TResult>(result: TResult) => Promise<TResult>;
    static fromError: <TResult>(error: string) => Promise<TResult>;
}
export declare class Promise<T> implements IPromise<T> {
    private privSink;
    constructor(sink: Sink<T>);
    result: () => PromiseResult<T>;
    continueWith: <TContinuationResult>(continuationCallback: (promiseResult: PromiseResult<T>) => TContinuationResult) => Promise<TContinuationResult>;
    onSuccessContinueWith: <TContinuationResult>(continuationCallback: (result: T) => TContinuationResult) => Promise<TContinuationResult>;
    continueWithPromise: <TContinuationResult>(continuationCallback: (promiseResult: PromiseResult<T>) => Promise<TContinuationResult>) => Promise<TContinuationResult>;
    onSuccessContinueWithPromise: <TContinuationResult>(continuationCallback: (result: T) => Promise<TContinuationResult>) => Promise<TContinuationResult>;
    on: (successCallback: (result: T) => void, errorCallback: (error: string) => void) => Promise<T>;
    finally: (callback: () => void) => Promise<T>;
}
export declare class Deferred<T> implements IDeferred<T> {
    private privPromise;
    private privSink;
    constructor();
    state: () => PromiseState;
    promise: () => Promise<T>;
    resolve: (result: T) => Deferred<T>;
    reject: (error: string) => Deferred<T>;
}
export declare class Sink<T> {
    private privState;
    private privPromiseResult;
    private privPromiseResultEvents;
    private privSuccessHandlers;
    private privErrorHandlers;
    constructor();
    readonly state: PromiseState;
    readonly result: PromiseResult<T>;
    resolve: (result: T) => void;
    reject: (error: string) => void;
    on: (successCallback: (result: T) => void, errorCallback: (error: string) => void) => void;
    private executeSuccessCallback;
    private executeErrorCallback;
    private detachHandlers;
}
