// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/**
 * @class Contracts
 * @private
 */
export class Contracts {
    public static throwIfNullOrUndefined(param: any, name: string): void {
        if (param === undefined || param === null) {
            throw new Error("throwIfNullOrUndefined:" + name);
        }
    }

    public static throwIfNull(param: any, name: string): void {
        if (param === null) {
            throw new Error("throwIfNull:" + name);
        }
    }

    public static throwIfNullOrWhitespace(param: string, name: string): void {
        Contracts.throwIfNullOrUndefined(param, name);

        if (("" + param).trim().length < 1) {
            throw new Error("throwIfNullOrWhitespace:" + name);
        }
    }

    public static throwIfNullOrTooLong(param: string, name: string, maxLength: number): void {
        Contracts.throwIfNullOrUndefined(param, name);

        if (("" + param).length > maxLength) {
            throw new Error("throwIfNullOrTooLong:" + name + " (more than " + maxLength.toString() + " characters)");
        }
    }

    public static throwIfNullOrTooShort(param: string, name: string, minLength: number): void {
        Contracts.throwIfNullOrUndefined(param, name);

        if (("" + param).length < minLength) {
            throw new Error("throwIfNullOrTooShort:" + name + " (less than " + minLength.toString() + " characters)");
        }
    }

    public static throwIfDisposed(isDisposed: boolean): void {
        if (isDisposed) {
            throw new Error("the object is already disposed");
        }
    }

    public static throwIfArrayEmptyOrWhitespace(array: string[], name: string): void {
        Contracts.throwIfNullOrUndefined(array, name);

        if (array.length === 0) {
            throw new Error("throwIfArrayEmptyOrWhitespace:" + name);
        }

        for (const item of array) {
            Contracts.throwIfNullOrWhitespace(item, name);
        }
    }

    public static throwIfFileDoesNotExist(param: string, name: string): void {
        Contracts.throwIfNullOrWhitespace(param, name);

        // TODO check for file existence.
    }

    public static throwIfNotUndefined(param: any, name: string): void {
        if (param !== undefined) {
            throw new Error("throwIfNotUndefined:" + name);
        }
    }
}
