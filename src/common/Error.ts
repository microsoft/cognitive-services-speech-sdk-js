// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/* eslint-disable max-classes-per-file */

/**
 * The error that is thrown when an argument passed in is null.
 *
 * @export
 * @class ArgumentNullError
 * @extends {Error}
 */
export class ArgumentNullError extends Error {

    /**
     * Creates an instance of ArgumentNullError.
     *
     * @param {string} argumentName - Name of the argument that is null
     *
     * @memberOf ArgumentNullError
     */
    public constructor(argumentName: string) {
        super(argumentName);
        this.name = "ArgumentNull";
        this.message = argumentName;
    }
}

/**
 * The error that is thrown when an invalid operation is performed in the code.
 *
 * @export
 * @class InvalidOperationError
 * @extends {Error}
 */
export class InvalidOperationError extends Error {

    /**
     * Creates an instance of InvalidOperationError.
     *
     * @param {string} error - The error
     *
     * @memberOf InvalidOperationError
     */
    public constructor(error: string) {
        super(error);
        this.name = "InvalidOperation";
        this.message = error;
    }
}

/**
 * The error that is thrown when an object is disposed.
 *
 * @export
 * @class ObjectDisposedError
 * @extends {Error}
 */
export class ObjectDisposedError extends Error {

    /**
     * Creates an instance of ObjectDisposedError.
     *
     * @param {string} objectName - The object that is disposed
     * @param {string} error - The error
     *
     * @memberOf ObjectDisposedError
     */
    public constructor(objectName: string, error?: string) {
        super(error);
        this.name = objectName + "ObjectDisposed";
        this.message = error;
    }
}
