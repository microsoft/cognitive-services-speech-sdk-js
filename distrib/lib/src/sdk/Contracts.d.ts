/**
 * @class Contracts
 * @private
 */
export declare class Contracts {
    static throwIfNullOrUndefined(param: any, name: string): void;
    static throwIfNull(param: any, name: string): void;
    static throwIfNullOrWhitespace(param: string, name: string): void;
    static throwIfDisposed(isDisposed: boolean): void;
    static throwIfArrayEmptyOrWhitespace(array: string[], name: string): void;
    static throwIfFileDoesNotExist(param: any, name: string): void;
}
