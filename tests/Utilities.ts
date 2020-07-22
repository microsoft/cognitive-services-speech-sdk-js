// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export function WaitForCondition(condition: () => boolean, after: () => void): void {
    if (condition() === true) {
        after();
    } else {
        setTimeout(() => WaitForCondition(condition, after), 500);
    }
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve: (_: void) => void) => setTimeout(resolve, ms));
}

export const WaitForPromise = (condition: () => boolean, rejectMessage: string, timeout: number = 60 * 1000): Promise<void> => {
    return new Promise(async (resolve: (value: void) => void, reject: (reason: string) => void): Promise<void> => {
        const endTime: number = Date.now() + timeout;

        while (!condition() && Date.now() < endTime) {
            await sleep(500);
        }

        if (Date.now() <= endTime) {
            resolve();
        } else {
            reject("Condition timeout: " + rejectMessage);
        }
    });
};

export async function closeAsyncObjects(objsToClose: any[]): Promise<void> {
    for (const current of objsToClose) {
        if (typeof current.close === "function") {
            if (current.close.length === 2) {
                await new Promise<void>((resolve: () => void, reject: (reason: string) => void) => {
                    current.close(resolve, reject);
                });
            } else {
                current.close();
            }
        }
    }
}
