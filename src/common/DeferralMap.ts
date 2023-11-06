// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { Deferred } from "./Promise.js";

/**
 * The error that is thrown when an argument passed in is null.
 *
 * @export
 * @class DefferalMap
 */

export class DeferralMap {
    private privMap: { [id: string]: Deferred<any> } = {};

    public add<T>(id: string, deferral: Deferred<T>): void {
        this.privMap[id] = deferral;
    }

    public getId(id: string): Deferred<any> {
        return this.privMap[id];
    }

    public complete<T>(id: string, result: T): void {
        try {
            this.privMap[id].resolve(result);
        } catch (error) {
            this.privMap[id].reject(error as string);
        } finally {
            this.privMap[id] = undefined;
         }
    }
}
